import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

interface InvitationEmailData {
  email: string;
  name?: string;
  type: 'admin' | 'client' | 'affiliate' | 'meeting';
  token: string;
  invitedBy?: string;
  meetingLink?: string;
}

interface AdminLoginData {
  adminName: string;
  email: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  loginTime: string;
  deviceInfo: string;
}

  interface WelcomeEmailData {
    firstName: string;
    email: string;
    userType: 'admin' | 'affiliate' | 'client';
  }

  interface AffiliateCreatedEmailData {
    firstName: string;
    email: string;
    password: string;
  }

  interface AdminCreatedEmailData {
    firstName: string;
    email: string;
    password: string;
  }

interface PurchaseNotificationData {
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  planName: string;
  planType: string;
  amount: number;
  purchaseDate: string;
  transactionId: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  // Enhanced email template with admin dashboard color scheme
  private getEmailTemplate(content: string, title: string = 'Score Machine'): string {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3001';
    const logoUrl = process.env.EMAIL_LOGO_URL || `${baseUrl}/image.png`;
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            margin: 0;
            padding: 20px;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(172, 47%, 45%) 100%);
            padding: 30px 40px;
            text-align: center;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }
          
          .logo {
            position: relative;
            z-index: 1;
          }
          
          .logo h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .logo p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            font-weight: 400;
          }
          
          .content {
            padding: 40px;
          }
          
          .content h2 {
            color: #1e293b;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            background: linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(172, 47%, 45%) 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .content p {
            color: #475569;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.7;
          }
          
          .info-card {
            background: linear-gradient(135deg, hsl(220, 13%, 97%) 0%, hsl(220, 13%, 98%) 100%);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .info-row:last-child {
            border-bottom: none;
          }
          
          .info-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }
          
          .info-value {
            color: #1e293b;
            font-weight: 500;
            font-size: 14px;
          }
          
          .verification-code {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 2px solid hsl(199, 89%, 48%);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
          }
          
          .code {
            font-size: 36px;
            font-weight: 700;
            color: hsl(199, 89%, 48%);
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
          }
          
          .button {
            display: inline-block;
            background: linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(172, 47%, 45%) 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }
          
          .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
          }
          
          .footer {
            background: #f8fafc;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer p {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .footer a {
            color: hsl(199, 89%, 48%);
            text-decoration: none;
            font-weight: 500;
          }
          
          .security-notice {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 8px;
          }
          
          .security-notice p {
            color: #92400e;
            font-size: 14px;
            margin: 0;
            font-weight: 500;
          }
          :root {
            color-scheme: light dark;
          }
          @media (prefers-color-scheme: dark) {
            body {
              color: #e5e7eb !important;
              background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%) !important;
            }
            .email-container {
              background: #0f172a !important;
              box-shadow: none !important;
            }
            .logo h1 {
              color: #ffffff !important;
            }
            .logo p {
              color: rgba(255, 255, 255, 0.85) !important;
            }
            .content h2 {
              -webkit-text-fill-color: inherit !important;
              color: #e5e7eb !important;
            }
            .content p,
            p,
            h1, h2, h3, h4, h5, h6,
            span, li, td, th {
              color: #cbd5e1 !important;
            }
            .info-card {
              background: #0b1324 !important;
              border-color: #334155 !important;
            }
            .info-row {
              border-bottom-color: #334155 !important;
            }
            .info-label {
              color: #94a3b8 !important;
            }
            .info-value {
              color: #e5e7eb !important;
            }
            .verification-code {
              background: #111827 !important;
              border-color: hsl(199, 89%, 48%) !important;
            }
            .footer {
              background: #0b1324 !important;
              border-top-color: #334155 !important;
            }
            .footer p {
              color: #94a3b8 !important;
            }
          .footer a,
          a {
            color: #7dd3fc !important;
          }
          .details-card {
            background: #0b1324 !important;
            border-color: #334155 !important;
          }
          .details-card h2,
          .details-card h3,
          .details-card p,
          .details-card li,
          .details-card span {
            color: #cbd5e1 !important;
          }
          .code-box {
            background: #111827 !important;
            color: #e5e7eb !important;
          }
          .admin-details {
            background: #0b1324 !important;
            border-color: #334155 !important;
          }
            .admin-details-title {
              color: #e5e7eb !important;
            }
            .admin-details-row {
              border-bottom-color: #334155 !important;
            }
            .admin-details-row .label {
              color: #94a3b8 !important;
            }
            .admin-details-row .value {
              color: #e5e7eb !important;
            }
            .admin-details-row .mono {
              background: #1f2937 !important;
              color: #e5e7eb !important;
            }
            .hero-icon {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .hero-icon-symbol {
              line-height: 1 !important;
              display: inline-block !important;
            }
          }
          
          @media (max-width: 600px) {
            .email-container {
              margin: 10px;
              border-radius: 12px;
            }
            
            .header, .content, .footer {
              padding: 20px;
            }
            
            .logo h1 {
              font-size: 24px;
            }
            
            .content h2 {
              font-size: 20px;
            }
            
            .code {
              font-size: 28px;
              letter-spacing: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <img src="${logoUrl}" alt="Score Machine" style="height: 40px; margin-bottom: 10px;" />
              <h1>Score Machine</h1>
              <p>Professional Credit Management Platform</p>
            </div>
          </div>
          ${content}
          <div class="footer">
            <p>&copy; 2025 Score Machine. All rights reserved.</p>
            <p>
              <a href="#">Privacy Policy</a> | 
              <a href="#">Terms of Service</a> | 
              <a href="#">Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private initializeTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      console.log('🔧 Initializing EmailService with config:');
      console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
      console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
      console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
      
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
    return this.transporter;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = this.initializeTransporter();
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Score Machine'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || 'application/pdf'
        }))
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  async sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
    const { email, name, type, token, invitedBy, meetingLink } = data;
    
    // Determine the invitation URL based on type
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3001';
    const invitationUrl = `${baseUrl}/invitation/accept?token=${token}&type=${type}`;
    
    // Generate role-specific content
    const roleInfo = this.getRoleInfo(type);
    
    const subject = `Invitation to Join Score Machine as ${roleInfo.title}`;
    
    const html = this.generateInvitationHTML({
      recipientName: name || email,
      recipientEmail: email,
      roleTitle: roleInfo.title,
      roleDescription: roleInfo.description,
      permissions: roleInfo.permissions,
      invitationUrl,
      invitedBy: invitedBy || 'System Administrator',
      expiresIn: '7 days',
      meetingLink: type === 'meeting' ? meetingLink : undefined
    });

    const text = this.generateInvitationText({
      recipientName: name || email,
      roleTitle: roleInfo.title,
      invitationUrl,
      expiresIn: '7 days'
    });

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  private getRoleInfo(type: string) {
    switch (type) {
      case 'admin':
        return {
          title: 'Administrator',
          description: 'Full administrative access to manage clients, disputes, and system settings.',
          permissions: [
            'Manage client accounts and credit reports',
            'Process dispute letters and track progress',
            'Access financial reports and analytics',
            'Manage system settings and configurations',
            'Oversee affiliate and team member activities'
          ]
        };
      case 'client':
        return {
          title: 'Client',
          description: 'Access to your personal funding dashboard and progress tracking.',
          permissions: [
            'View your credit reports and scores',
            'Track dispute progress and results',
            'Upload documents and communicate with your team',
            'Access educational resources and tools',
            'Manage your account settings and preferences'
          ]
        };
      case 'affiliate':
        return {
          title: 'Affiliate Partner',
          description: 'Access to affiliate dashboard with commission tracking and marketing tools.',
          permissions: [
            'Track referrals and commission earnings',
            'Access marketing materials and resources',
            'View detailed performance analytics',
            'Manage affiliate account settings',
            'Generate custom referral links'
          ]
        };
      case 'meeting':
        return {
          title: 'Meeting Participant',
          description: 'Invitation to join an important meeting or consultation session.',
          permissions: [
            'Access meeting room and materials',
            'Participate in discussions and Q&A',
            'View shared documents and presentations',
            'Receive meeting recordings and notes',
            'Connect with other participants and organizers'
          ]
        };
      default:
        return {
          title: 'User',
          description: 'Access to the Score Machine platform.',
          permissions: ['Access to platform features']
        };
    }
  }

  private generateInvitationHTML(data: {
    recipientName: string;
    recipientEmail: string;
    roleTitle: string;
    roleDescription: string;
    permissions: string[];
    invitationUrl: string;
    invitedBy: string;
    expiresIn: string;
    meetingLink?: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to Score Machine</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
        }
        .role-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .permissions {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .permissions h4 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 16px;
        }
        .permissions ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .permissions li {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
            position: relative;
            padding-left: 25px;
        }
        .permissions li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #48bb78;
            font-weight: bold;
        }
        .permissions li:last-child {
            border-bottom: none;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
            color: #718096;
            font-size: 14px;
        }
        .security-notice {
            background: #fef5e7;
            border: 1px solid #f6ad55;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .security-notice h4 {
            color: #c05621;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .security-notice p {
            color: #744210;
            font-size: 13px;
            margin: 0;
        }
        :root { color-scheme: light dark; }
        @media (prefers-color-scheme: dark) {
            body {
                color: #e5e7eb !important;
                background-color: #0f172a !important;
            }
            .container {
                background: #0f172a !important;
                box-shadow: none !important;
            }
            .greeting { color: #e5e7eb !important; }
            .permissions { background: #0b1324 !important; }
            .permissions h4 { color: #e5e7eb !important; }
            .permissions li { border-bottom-color: #334155 !important; color: #cbd5e1 !important; }
            .footer { background: #0b1324 !important; border-top: 1px solid #334155 !important; }
            .footer p { color: #94a3b8 !important; }
            a { color: #7dd3fc !important; }
            .security-notice { background: #1f2937 !important; border-color: #f59e0b !important; }
            .security-notice h4 { color: #fbbf24 !important; }
            .security-notice p { color: #fde68a !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CR</div>
            <h1>You're Invited!</h1>
            <p>Join Score Machine</p>
        </div>
        
        <div class="content">
            <h2 class="greeting">Hello ${data.recipientName}!</h2>
            
            <p>You have been invited to join <strong>Score Machine</strong> as a <span class="role-badge">${data.roleTitle}</span></p>
            
            <p>${data.roleDescription}</p>
            
            <div class="permissions">
                <h4>Your Access Includes:</h4>
                <ul>
                    ${data.permissions.map(permission => `<li>${permission}</li>`).join('')}
                </ul>
            </div>
            
            ${data.meetingLink ? `
            <div style="background: #e6fffa; border: 1px solid #38b2ac; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #2c7a7b; margin-bottom: 10px; font-size: 16px;">📅 Meeting Details</h4>
                <p style="margin: 10px 0; color: #2d3748;">Join the meeting using the link below:</p>
                <a href="${data.meetingLink}" style="display: inline-block; background: #38b2ac; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0;">Join Meeting</a>
                <p style="font-size: 13px; color: #4a5568; margin-top: 10px;">Meeting Link: ${data.meetingLink}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.invitationUrl}" class="cta-button">Accept Invitation</a>
            </div>
            
            <div class="security-notice">
                <h4>🔒 Security Notice</h4>
                <p>This invitation expires in ${data.expiresIn}. If you didn't expect this invitation, please ignore this email. Never share your login credentials with anyone.</p>
            </div>
            
            <p><strong>Invited by:</strong> ${data.invitedBy}</p>
            <p><strong>Email:</strong> ${data.recipientEmail}</p>
        </div>
        
        <div class="footer">
            <p><strong>Score Machine</strong></p>
            <p>Professional Funding Management System</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateInvitationText(data: {
    recipientName: string;
    roleTitle: string;
    invitationUrl: string;
    expiresIn: string;
  }): string {
    return `
Hello ${data.recipientName}!

You have been invited to join Score Machine as a ${data.roleTitle}.

To accept this invitation and set up your account, please visit:
${data.invitationUrl}

This invitation expires in ${data.expiresIn}.

If you didn't expect this invitation, please ignore this email.

Best regards,
Score Machine Team
    `.trim();
  }

  async sendVerificationCode(email: string, code: string, firstName?: string): Promise<boolean> {
    const subject = 'Email Verification Code - Score Machine';
    
    const html = this.getEmailTemplate(`
      <div style="text-align: center; margin-bottom: 30px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="80" height="80" style="margin: 0 auto 20px auto;">
          <tr>
            <td align="center" valign="middle" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%); border-radius: 50%; text-align: center;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; line-height: 1; color: #ffffff;">🔑</span>
            </td>
          </tr>
        </table>
        <h1 style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 28px; font-weight: 700; margin: 0;">Verify Your Email</h1>
        <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Complete your registration to get started</p>
      </div>
      
      <div class="details-card" style="background: #ffffff; border: 2px solid #0ea5e9; border-radius: 16px; padding: 40px 30px; text-align: center; margin: 30px 0;">
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 600; margin-bottom: 15px;">
          ${firstName ? `Welcome ${firstName}!` : 'Welcome!'}
        </h2>
        <p style="color: #475569; font-size: 16px; margin-bottom: 30px; line-height: 1.6;">
          Thank you for joining Score Machine as an affiliate partner. Please enter the verification code below to activate your account:
        </p>
        
        <div class="code-box" style="background: white; border: 3px solid #0ea5e9; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);">
          <div style="font-size: 36px; font-weight: 800; color: #0ea5e9; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 14px; margin: 15px 0 0 0;">Enter this code to verify your email</p>
        </div>
        
        <div class="details-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="color: #0369a1; font-size: 14px; margin: 0; font-weight: 500;">
            ⏰ This code expires in 15 minutes for your security
          </p>
        </div>
      </div>
      
      <div class="details-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #0f172a; font-size: 18px; font-weight: 600; margin-bottom: 15px;">🚀 What's Next?</h3>
        <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Complete your profile setup</li>
          <li>Access your affiliate dashboard</li>
          <li>Start earning commissions</li>
          <li>Get marketing materials and tools</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          If you didn't request this verification, please ignore this email.
        </p>
      </div>
    `, 'Email Verification - Score Machine');

    const text = `
      Score Machine - Email Verification
      
      ${firstName ? `Welcome ${firstName}!` : 'Welcome!'}
      
      Thank you for joining Score Machine as an affiliate partner!
      
      Your verification code is: ${code}
      
      This code will expire in 15 minutes for your security.
      
      If you didn't request this verification, please ignore this email.
      
      Best regards,
      Score Machine Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  async sendAdminLoginNotification(data: AdminLoginData): Promise<boolean> {
    try {
      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="80" height="80" style="margin: 0 auto 20px auto;">
            <tr>
              <td align="center" valign="middle" style="background: linear-gradient(135deg, #0ea5e9, #06b6d4); border-radius: 50%; text-align: center;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; line-height: 1; color: #ffffff;">🔐</span>
              </td>
            </tr>
          </table>
          <h2 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700;">Admin Login Alert</h2>
          <p style="color: #64748b; margin: 10px 0 0 0; font-size: 16px;">New administrator login detected</p>
        </div>

        <div class="admin-details" style="background: #ffffff; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #0ea5e9;">
          <h3 class="admin-details-title" style="color: #0f172a; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
            <span style="margin-right: 10px;">👤</span> Login Details
          </h3>
          
          <div style="display: grid; gap: 16px;">
            <div class="admin-details-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span class="label" style="font-weight: 600; color: #475569;">Administrator:</span>
              <span class="value" style="color: #0f172a;">${data.adminName}</span>
            </div>
            
            <div class="admin-details-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span class="label" style="font-weight: 600; color: #475569;">Email:</span>
              <span class="value" style="color: #0f172a;">${data.email}</span>
            </div>
            
            <div class="admin-details-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span class="label" style="font-weight: 600; color: #475569;">Login Time:</span>
              <span class="value" style="color: #0f172a;">${data.loginTime}</span>
            </div>
            
            <div class="admin-details-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span class="label" style="font-weight: 600; color: #475569;">IP Address:</span>
              <span class="value mono" style="color: #0f172a; font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${data.ipAddress}</span>
            </div>
            
            <div class="admin-details-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span class="label" style="font-weight: 600; color: #475569;">Location:</span>
              <span class="value" style="color: #0f172a;">${data.location}</span>
            </div>
            
            <div class="admin-details-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span class="label" style="font-weight: 600; color: #475569;">Device:</span>
              <span class="value" style="color: #0f172a;">${data.deviceInfo}</span>
            </div>
            
            <div class="admin-details-row" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 0;">
              <span class="label" style="font-weight: 600; color: #475569;">User Agent:</span>
              <span class="value" style="color: #0f172a; font-size: 14px; max-width: 300px; word-break: break-all;">${data.userAgent}</span>
            </div>
          </div>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
            <span style="margin-right: 8px;">⚠️</span> Security Notice
          </h4>
          <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.5;">
            If this login was not authorized by you, please contact the system administrator immediately and change your password.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3001/admin/security" 
             style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
            Review Security Settings
          </a>
        </div>
      `;

      return await this.sendEmail({
        to: data.email,
        subject: `🔐 Admin Login Alert - ${data.adminName}`,
        html: this.getEmailTemplate(content, 'Admin Login Notification')
      });
    } catch (error) {
      console.error('Failed to send admin login notification:', error);
      return false;
    }
  }

  async sendPasswordResetCode(email: string, code: string, firstName?: string): Promise<boolean> {
    const subject = 'Password Reset Code - Score Machine';
    
    const html = this.getEmailTemplate(`
      <div style="text-align: center; margin-bottom: 30px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="80" height="80" style="margin: 0 auto 20px auto;">
          <tr>
            <td align="center" valign="middle" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); border-radius: 50%; text-align: center;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; line-height: 1; color: #ffffff;">🔐</span>
            </td>
          </tr>
        </table>
        <h1 style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 28px; font-weight: 700; margin: 0;">Reset Your Password</h1>
        <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Secure password reset for your account</p>
      </div>
      
      <div class="details-card" style="background: #ffffff; border: 2px solid #dc2626; border-radius: 16px; padding: 40px 30px; text-align: center; margin: 30px 0;">
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 600; margin-bottom: 15px;">
          ${firstName ? `Hello ${firstName}!` : 'Hello!'}
        </h2>
        <p style="color: #475569; font-size: 16px; margin-bottom: 30px; line-height: 1.6;">
          We received a request to reset your password for your Score Machine account. Please enter the verification code below to proceed:
        </p>
        
        <div class="code-box" style="background: white; border: 3px solid #dc2626; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 4px 20px rgba(220, 38, 38, 0.15);">
          <div style="font-size: 36px; font-weight: 800; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 14px; margin: 15px 0 0 0;">Enter this code to reset your password</p>
        </div>
        
        <div class="details-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 500;">
            ⏰ This code expires in 15 minutes for your security
          </p>
        </div>
      </div>
      
      <div class="details-card" style="background: #ffffff; border: 1px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #92400e; font-size: 18px; font-weight: 600; margin-bottom: 15px;">🔒 Security Notice</h3>
        <ul style="color: #78350f; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>If you didn't request this password reset, please ignore this email</li>
          <li>Never share this verification code with anyone</li>
          <li>This code will expire automatically for your security</li>
          <li>Contact support if you need assistance</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          If you continue to have problems, please contact our support team.
        </p>
      </div>
    `, 'Password Reset - Score Machine');

    const text = `
      Score Machine - Password Reset
      
      ${firstName ? `Hello ${firstName}!` : 'Hello!'}
      
      We received a request to reset your password for your Score Machine account.
      
      Your verification code is: ${code}
      
      This code will expire in 15 minutes for your security.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      Score Machine Team
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const roleInfo = this.getRoleInfo(data.userType);
      
      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="80" height="80" style="margin: 0 auto 20px auto;">
            <tr>
              <td align="center" valign="middle" style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; text-align: center;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; line-height: 1; color: #ffffff;">🎉</span>
              </td>
            </tr>
          </table>
          <h2 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Score Machine!</h2>
          <p style="color: #64748b; margin: 10px 0 0 0; font-size: 16px;">Your account has been successfully verified</p>
        </div>

        <div class="details-card" style="background: #ffffff; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #10b981;">
          <h3 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            Hello ${data.firstName}! 👋
          </h3>
          
          <p style="color: #374151; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
            Congratulations! Your ${roleInfo.title} account has been successfully created and verified. 
            You now have access to our comprehensive funding management system.
          </p>

          <div class="details-card" style="background: #ffffff; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #d1fae5;">
            <h4 style="color: #065f46; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              🚀 What's Next?
            </h4>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li style="margin-bottom: 8px;">Complete your profile setup</li>
              <li style="margin-bottom: 8px;">Explore the dashboard features</li>
              <li style="margin-bottom: 8px;">Connect with your assigned team</li>
              <li style="margin-bottom: 0;">Start your funding journey</li>
            </ul>
          </div>
        </div>

        <div class="details-card" style="background: #ffffff; border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
            <span style="margin-right: 8px;">💡</span> Getting Started Tips
          </h4>
          <p style="color: #1e3a8a; margin: 0; font-size: 14px; line-height: 1.5;">
            Take a few minutes to familiarize yourself with the platform. Our intuitive interface is designed to make funding management simple and effective.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3001/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); margin-right: 12px;">
            Access Dashboard
          </a>
          <a href="http://localhost:3001/help" 
             style="display: inline-block; background: transparent; color: #10b981; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; border: 2px solid #10b981;">
            Get Help
          </a>
        </div>
      `;

      return await this.sendEmail({
        to: data.email,
        subject: `🎉 Welcome to Score Machine - Account Verified!`,
        html: this.getEmailTemplate(content, 'Welcome to Score Machine')
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendAffiliateAccountCreatedEmail(data: AffiliateCreatedEmailData): Promise<boolean> {
    try {
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      const loginUrl = `${baseUrl}/affiliate/login`;

      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-size: 32px; font-weight: bold;">✅</span>
          </div>
          <h2 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700;">Affiliate Pro Account Created</h2>
          <p style="color: #64748b; margin: 10px 0 0 0; font-size: 16px;">Your affiliate dashboard is ready to use</p>
        </div>

        <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #10b981;">
          <h3 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            Hello ${data.firstName}! 👋
          </h3>
          <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
            Your Affiliate Pro account has been created successfully. Here is your temporary password:
          </p>
          <div style="background: #111827; color: #fff; padding: 16px 20px; border-radius: 12px; font-family: monospace; font-size: 16px; letter-spacing: 0.5px; text-align: center;">
            ${data.password}
          </div>
          <p style="color: #374151; margin: 16px 0 0 0; font-size: 14px;">
            You can reset this password anytime from the affiliate dashboard.
          </p>
        </div>

        <div style="text-align: center;">
          <a href="${loginUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            Go to Affiliate Login
          </a>
        </div>
      `;

      return await this.sendEmail({
        to: data.email,
        subject: 'Your Affiliate Pro Account Is Ready',
        html: this.getEmailTemplate(content, 'Affiliate Account Created')
      });
    } catch (error) {
      console.error('Failed to send affiliate account creation email:', error);
      return false;
    }
  }

  async sendAdminAccountCreatedEmail(data: AdminCreatedEmailData): Promise<boolean> {
    try {
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      const loginUrl = `${baseUrl}/login`;

      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #1d4ed8, #1e40af); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-size: 32px; font-weight: bold;">🛠️</span>
          </div>
          <h2 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700;">Admin Account Created</h2>
          <p style="color: #64748b; margin: 10px 0 0 0; font-size: 16px;">Your admin dashboard is ready</p>
        </div>

        <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #3b82f6;">
          <h3 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            Welcome ${data.firstName}! 👋
          </h3>
          <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
            Your Admin account has been created successfully. Use this temporary password to log in:
          </p>
          <div style="background: #111827; color: #fff; padding: 16px 20px; border-radius: 12px; font-family: monospace; font-size: 16px; letter-spacing: 0.5px; text-align: center;">
            ${data.password}
          </div>
          <p style="color: #374151; margin: 16px 0 0 0; font-size: 14px;">
            You will be prompted to verify your email and sign the admin agreement after login.
          </p>
        </div>

        <div style="text-align: center;">
          <a href="${loginUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #1d4ed8, #1e40af); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
            Go to Admin Login
          </a>
        </div>
      `;

      return await this.sendEmail({
        to: data.email,
        subject: 'Your Admin Account Is Ready',
        html: this.getEmailTemplate(content, 'Admin Account Created')
      });
    } catch (error) {
      console.error('Failed to send admin account creation email:', error);
      return false;
    }
  }

  async sendPurchaseNotification(data: PurchaseNotificationData): Promise<boolean> {
    try {
      const customerName = `${data.firstName} ${data.lastName}`.trim();
      const content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="80" height="80" style="margin: 0 auto 20px auto;">
            <tr>
              <td align="center" valign="middle" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 50%; text-align: center;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; line-height: 1; color: #ffffff;">💳</span>
              </td>
            </tr>
          </table>
          <h2 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 700;">Purchase Confirmation</h2>
          <p style="color: #64748b; margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase!</p>
        </div>

        <div class="details-card" style="background: #ffffff; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #8b5cf6;">
          <h3 style="color: #0f172a; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
            <span style="margin-right: 10px;">📋</span> Order Details
          </h3>
          
          <div style="display: grid; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 600; color: #475569;">Customer:</span>
              <span style="color: #0f172a;">${customerName}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 600; color: #475569;">Email:</span>
              <span style="color: #0f172a;">${data.email}</span>
            </div>
            
            ${data.companyName ? `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 600; color: #475569;">Company:</span>
              <span style="color: #0f172a;">${data.companyName}</span>
            </div>
            ` : ''}
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 600; color: #475569;">Plan:</span>
              <span style="color: #0f172a; font-weight: 600;">${data.planName}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 600; color: #475569;">Plan Type:</span>
              <span style="color: #0f172a; text-transform: capitalize;">${data.planType}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 600; color: #475569;">Amount:</span>
              <span style="color: #10b981; font-weight: 700; font-size: 18px;">USD $${Number(data.amount).toFixed(2)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
              <span style="font-weight: 600; color: #475569;">Purchase Date:</span>
              <span style="color: #0f172a;">${data.purchaseDate}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
              <span style="font-weight: 600; color: #475569;">Transaction ID:</span>
              <span style="color: #0f172a; font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${data.transactionId}</span>
            </div>
          </div>
        </div>

        <div class="details-card" style="background: #ffffff; border: 1px solid #10b981; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h4 style="color: #065f46; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
            <span style="margin-right: 8px;">✅</span> Payment Successful
          </h4>
          <p style="color: #047857; margin: 0; font-size: 14px; line-height: 1.5;">
            Your payment has been processed successfully. You now have full access to your selected plan features.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3001/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); margin-right: 12px;">
            Access Your Account
          </a>
          <a href="http://localhost:3001/billing" 
             style="display: inline-block; background: transparent; color: #8b5cf6; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; border: 2px solid #8b5cf6;">
            View Invoice
          </a>
        </div>
      `;

      return await this.sendEmail({
        to: data.email,
        subject: `💳 Purchase Confirmation - ${data.planName}`,
        html: this.getEmailTemplate(content, 'Purchase Confirmation')
      });
    } catch (error) {
      console.error('Failed to send purchase notification:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;