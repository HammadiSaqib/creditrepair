import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/securityMiddleware.js';
import { z } from 'zod';

const router = Router();

// Zod schema to validate incoming chat requests
const chatRequestSchema = z.object({
  question: z.string().min(2, 'Question is too short').optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1),
      })
    )
    .optional(),
  topic: z.enum(['credit', 'funding']).optional(),
});

// System prompt: FinMint AI persona and guardrails
const SYSTEM_PROMPT = `You are FinMint AI — a certified USA-based Credit Repair and Business Funding Professional with 10+ years of experience.

Role & Scope:
- Advise on U.S. credit repair and funding only, following FCRA and FDCPA.
- Cover credit scores, dispute strategy/letters, utilization, inquiries, account mix, and funding programs.
- Tailor guidance for personal and business credit needs.

Tone & Ethics:
- Be clear, friendly, and professional. Start with empathy.
- Never make false promises (e.g., guaranteed removals) or suggest illegal tactics.
- If unsure, suggest seeking legal or certified credit counseling support.

Platform Policy:
- Do not recommend other credit repair or funding platforms.
- When recommending services, refer to FinMint/Score Machine offerings and resources.

Response Style:
- Use plain English with short paragraphs and helpful bullet points.
- End with a specific, helpful next step or suggestion.
`;

// Helper to call OpenAI Chat Completions API using axios
async function callOpenAIChat(messages: Array<{ role: string; content: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  if (!apiKey) {
    return {
      reply:
        'Thanks for reaching out — I’m here to help with credit repair and funding. Our FinMint AI integration is being configured. In the meantime, you can ask your question and I’ll provide best-practice guidance based on U.S. credit laws. For immediate assistance, consider scheduling a consultation with our FinMint team.',
      model: 'fallback',
      usage: undefined,
      fromCache: true,
    };
  }

  const payload = {
    model,
    temperature: 0.7,
    max_tokens: 800,
    messages,
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const resp = await axios.post(url, payload, { headers });

  const choice = resp.data?.choices?.[0];
  const reply = choice?.message?.content?.trim() || '';
  return {
    reply,
    model,
    usage: resp.data?.usage,
    fromCache: false,
  };
}

// Helper: extract structured JSON block from AI reply (JSON fenced block)
function extractStructuredJSON(text: string): any | null {
  if (!text) return null;
  try {
    const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      const raw = fenceMatch[1].trim();
      return JSON.parse(raw);
    }
    // Fallback: attempt to find first JSON object in text
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
  } catch (_) {
    return null;
  }
  return null;
}

// POST /api/ai/finmint-chat — secured AI chat endpoint
router.post(
  '/finmint-chat',
  authenticateToken,
  rateLimit({ windowMs: 60_000, maxRequests: 30, message: 'Too many AI requests, please try again in a minute' }),
  async (req: Request, res: Response) => {
    try {
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      }

      const { question, messages: clientMessages, topic } = parsed.data;

      // Compose the message array with the FinMint AI system prompt
      const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: SYSTEM_PROMPT + (topic ? `\nFocus: ${topic}` : '') },
      ];

      if (Array.isArray(clientMessages) && clientMessages.length > 0) {
        // Include prior conversation for better context
        messages.push(
          ...clientMessages.map(m => ({ role: m.role, content: m.content }))
        );
      }

      if (question) {
        messages.push({ role: 'user', content: question });
      }

      // Safety: ensure we have at least the system + user message
      if (messages.length < 2) {
        return res.status(400).json({ error: 'Question or messages are required' });
      }

      const result = await callOpenAIChat(messages);

      // If OpenAI key is missing, the reply will be a graceful fallback
      if (!result.reply) {
        return res.status(502).json({ error: 'AI service returned no content' });
      }

      res.json({
        reply: result.reply,
        model: result.model,
        usage: result.usage,
      });
    } catch (error: any) {
      console.error('❌ FinMint AI chat error:', error?.response?.data || error?.message || error);
      const status = error?.response?.status || 500;
      return res.status(status).json({
        error: 'Failed to process AI chat request',
        details: error?.response?.data || undefined,
      });
    }
  }
);

export default router;
// POST /api/ai/finmint-analyze-report — analyze a client's credit report JSON
router.post(
  '/finmint-analyze-report',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  rateLimit({ windowMs: 60_000, maxRequests: 20, message: 'Too many AI analysis requests, try again shortly' }),
  async (req: Request, res: Response) => {
    try {
      // Validate payload with Zod
      const analysisSchema = z.object({
        goal: z.enum(['credit', 'funding', 'both']).default('both').optional(),
        clientId: z.number().int().positive().optional(),
        report: z.record(z.any()).optional(),
      }).refine(data => !!data.report, {
        message: 'report is required (send latest client report JSON)',
        path: ['report'],
      });

      const parsed = analysisSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      }

      const { goal = 'both', clientId, report } = parsed.data as { goal: 'credit'|'funding'|'both'; clientId?: number; report: Record<string, any> };

      // Specialized analysis prompt layered on top of FinMint guardrails
      const ANALYSIS_PROMPT = `${SYSTEM_PROMPT}\n\nYou are an expert U.S. Credit Underwriter and Credit Repair Analyst with 10+ years of professional experience. You understand Metro 2 formatting, credit bureau reporting rules, FCRA, credit score algorithms, utilization weighting, inquiry segmentation, and risk scoring. Your task is to analyze the provided structured credit report JSON and return clear, accurate insights.\n\nYou MUST:\n- Identify negative items correctly.\n- Explain WHY items are negative (late payments, charge-off, collection, high utilization, etc.).\n- Provide recommendations using U.S. credit repair strategy language.\n- Write in a friendly, professional tone at an 8th grade reading level.\n- Do NOT guess or add data that is not in the JSON. If something is missing, say "Not available in report".\n\nReturn your analysis in this exact format (use concise bullet points):\n\n1. **Credit Summary Overview**\n   - Total Accounts\n   - Open Accounts\n   - Closed Accounts\n   - Average Age of Credit\n   - Utilization %\n   - Number of Inquiries (past 12 months)\n   - Score Range (if available)\n\n2. **Negative Item Breakdown**\n   For EACH negative account, list:\n   - Creditor Name\n   - Account Type (Credit Card, Auto Loan, etc.)\n   - Status (Late, Charge-Off, Collection, Repossession, Bankruptcy, etc.)\n   - Date of First Delinquency (if available)\n   - Current Balance / Charged-off Amount\n   - Explanation of why this hurts the score\n   - Recommended dispute or resolution strategy\n\n3. **Positive Accounts & Strength Factors**\n   - Identify accounts helping score\n   - Age, payment history, and credit mix benefits\n\n4. **Utilization Analysis**\n   - Current utilization %\n   - Which accounts are high\n   - How much to pay down to improve score fastest\n\n5. **Inquiry Risk Assessment**\n   - List of inquiries by bureau\n   - Which ones are impacting score most\n   - Safe dispute or removal options (if applicable)\n\n6. **Score Improvement Plan (Step-by-Step)**\n   - What to dispute\n   - What to pay down first\n   - What new credit (if any) should be added\n   - Expected score increase estimate ranges\n\nIMPORTANT — Provide a machine-readable summary for UI cards:\nAfter the six sections, append a JSON block named STRUCTURED_JSON following this schema. Do NOT use code fences. Use null for unknown values, and compute metrics from the JSON data when possible.\n\n{\n  "scores": { "experian": number|null, "equifax": number|null, "transunion": number|null },\n  "metrics": {\n    "total_accounts": number|null,\n    "open_accounts": number|null,\n    "closed_accounts": number|null,\n    "average_age_months": number|null,\n    "revolving_utilization_pct": number|null\n  },\n  "negatives": [\n    {\n      "creditor": string,\n      "account_type": string|null,\n      "bureau": string|null,\n      "status": string|null,\n      "first_delinquency": string|null,\n      "balance": number|null,\n      "explanation": string,\n      "strategy": string\n    }\n  ],\n  "strengths": string[],\n  "inquiries": {\n    "count": number|null,\n    "recent_12_months": number|null,\n    "by_bureau": { "experian": number|null, "equifax": number|null, "transunion": number|null },\n    "list": Array<{ "creditor": string|null, "date": string|null, "bureau": string|null }>|null\n  },\n  "plan_steps": string[]\n}\n\nContext:\n- Goal: ${goal.toUpperCase()}\n- ClientId: ${clientId ?? 'N/A'}\n`;

      // Inject the JSON report. Keep message compact by stringifying.
      const reportJson = JSON.stringify(report);
      const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: `Below is the user's credit report data in JSON format. Analyze it thoroughly and provide a full credit evaluation following the exact format above.\n\nJSON DATA:\n${reportJson}` },
      ];

      const result = await callOpenAIChat(messages);

      if (!result.reply) {
        return res.status(502).json({ error: 'AI service returned no content' });
      }

      // Attempt to extract structured JSON from the AI response
      const structured = extractStructuredJSON(result.reply);

      return res.json({
        analysis: result.reply,
        structured,
        model: result.model,
        usage: result.usage,
      });
    } catch (error: any) {
      console.error('❌ FinMint AI report analysis error:', error?.response?.data || error?.message || error);
      const status = error?.response?.status || 500;
      return res.status(status).json({
        error: 'Failed to analyze credit report',
        details: error?.response?.data || undefined,
      });
    }
  }
);