import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { contractsApi } from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";

interface ScoreMachineEliteAgreement {
  id: number;
  status: string;
  title?: string;
  content?: string | null;
  signature_image_url?: string | null;
}

interface ScoreMachineElitePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgreementCompleted?: () => void;
}

export default function ScoreMachineElitePrompt({
  open,
  onOpenChange,
  onAgreementCompleted,
}: ScoreMachineElitePromptProps) {
  const { userProfile } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreement, setAgreement] = useState<ScoreMachineEliteAgreement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const looksLikeHtml = (value?: string | null) => {
    if (!value) return false;
    return /<[^>]+>/.test(value);
  };

  const resetState = () => {
    setSignatureDataUrl(null);
    setHasDrawing(false);
    setIsDrawing(false);
    setAgree(false);
    setError(null);
  };

  const fetchAgreement = async () => {
    if (userProfile?.role !== "admin") return;

    try {
      setLoading(true);
      setError(null);
      const response = await contractsApi.getLatestTsmEliteAgreement();
      const data = response?.data?.data as ScoreMachineEliteAgreement | undefined;

      if (data) {
        setAgreement(data);
        setSignatureDataUrl(data.signature_image_url || null);
      } else {
        setAgreement(null);
        setError("No Score Machine Elite agreement is available right now.");
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setAgreement(null);
        setError("No active Score Machine Elite agreement is available right now.");
      } else if (err?.response?.status === 403) {
        setAgreement(null);
        setError("Score Machine Elite is not enabled for this admin account.");
      } else {
        console.error("ScoreMachineElitePrompt: failed to fetch agreement", err);
        setAgreement(null);
        setError("Failed to load the Score Machine Elite agreement.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      resetState();
      fetchAgreement();
    } else {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userProfile?.id]);

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = getCtx();
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawing(false);
    setSignatureDataUrl(null);
  };

  useEffect(() => {
    if (open && agreement && agreement.status?.toLowerCase() !== "signed") {
      setTimeout(() => initCanvas(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agreement?.id, agreement?.status]);

  const pointerPos = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawing(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
  };

  const clearCanvas = () => {
    initCanvas();
  };

  const handleGetNow = async () => {
    if (!agreement?.id) return;
    if (!signatureDataUrl) {
      toast({ title: "Signature required", description: "Please draw your signature." });
      return;
    }

    try {
      setSubmitting(true);
      await contractsApi.signLatestTsmEliteAgreement({
        signature_image_url: signatureDataUrl,
      });

      toast({
        title: "Score Machine Elite unlocked",
        description: "The Score Machine Elite agreement has been completed successfully.",
      });

      setAgreement((prev) => (prev ? { ...prev, status: "signed", signature_image_url: signatureDataUrl } : prev));
      onAgreementCompleted?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("ScoreMachineElitePrompt: sign failed", err);
      const message = err?.response?.data?.error || "Failed to complete the Score Machine Elite agreement.";
      toast({ title: "Error", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (userProfile?.role !== "admin") return null;

  const isSigned = agreement?.status?.toLowerCase() === "signed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {agreement?.title || "The Score Machine Elite Agreement"}
          </DialogTitle>
          <DialogDescription>
            Review and complete this agreement to get access to Score Machine Elite.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="text-sm text-muted-foreground">Loading Score Machine Elite agreement...</div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {!loading && agreement && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Score Machine Elite Contracts</Label>
              <ScrollArea className="mt-2 h-48 rounded-md border p-3 bg-slate-50 dark:bg-slate-800">
                {agreement.content ? (
                  looksLikeHtml(agreement.content) ? (
                    <div dangerouslySetInnerHTML={{ __html: agreement.content }} />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">{agreement.content}</pre>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No preview content available right now.
                  </p>
                )}
              </ScrollArea>
            </div>

            {isSigned ? (
              <div className="space-y-3">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                  This Score Machine Elite agreement has already been completed.
                </div>
                {agreement.signature_image_url && (
                  <div className="grid gap-2">
                    <Label>Saved Signature</Label>
                    <div className="rounded-md border bg-white p-3">
                      <img
                        src={agreement.signature_image_url}
                        alt="Score Machine Elite signature"
                        className="max-h-24 w-auto object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Draw Signature</Label>
                  <div className="rounded-md border bg-white">
                    <canvas
                      ref={canvasRef}
                      className="h-40 w-full touch-none"
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerLeave={onPointerUp}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={clearCanvas}>Clear</Button>
                    {hasDrawing && signatureDataUrl && (
                      <span className="text-xs text-muted-foreground">Signature captured</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="scoreMachineEliteAgree" checked={agree} onCheckedChange={(checked) => setAgree(!!checked)} />
                  <Label htmlFor="scoreMachineEliteAgree" className="text-sm">
                    I acknowledge I have read and agree to the terms.
                  </Label>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            className="gradient-primary"
            onClick={handleGetNow}
            disabled={
              !agreement ||
              isSigned ||
              submitting ||
              !agree ||
              !signatureDataUrl
            }
          >
            {submitting ? "Getting..." : isSigned ? "Already Received" : "Get Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}