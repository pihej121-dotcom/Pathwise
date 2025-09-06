import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailVerificationData {
  email: string;
  token: string;
  institutionName: string;
}

export interface InvitationEmailData {
  email: string;
  token: string;
  institutionName: string;
  inviterName: string;
  role: string;
}

export interface LicenseNotificationData {
  adminEmail: string;
  institutionName: string;
  usedSeats: number;
  totalSeats: number;
  usagePercentage: number;
}

export class EmailService {
  private getBaseUrl(): string {
    return process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
      : 'http://localhost:5000';
  }

  async sendEmailVerification(data: EmailVerificationData): Promise<boolean> {
    try {
      const verificationUrl = `${this.getBaseUrl()}/verify-email?token=${data.token}`;
      
      await resend.emails.send({
        from: 'Pathwise <noreply@pathwiseinstitutions.org>',
        to: data.email,
        subject: `Verify your email for ${data.institutionName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Email</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Pathwise</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${data.institutionName}</p>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                <h2 style="color: #2d3748; margin-top: 0;">Verify Your Email Address</h2>
                <p style="color: #4a5568; margin-bottom: 20px;">
                  Thank you for joining Pathwise! Please verify your email address to complete your account setup and start building your career roadmap.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            text-decoration: none; 
                            padding: 15px 30px; 
                            border-radius: 8px; 
                            font-weight: 600; 
                            display: inline-block;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #718096; font-size: 14px; margin-top: 25px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all; color: #4299e1;">${verificationUrl}</span>
                </p>
              </div>
              
              <div style="text-align: center; color: #a0aec0; font-size: 12px;">
                <p>This verification link will expire in 24 hours for security reasons.</p>
                <p>&copy; 2025 Pathwise Institution Edition. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send email verification:', error);
      return false;
    }
  }

  async sendInvitation(data: InvitationEmailData): Promise<boolean> {
    try {
      const invitationUrl = `${this.getBaseUrl()}/register?token=${data.token}`;
      
      const result = await resend.emails.send({
        from: 'Pathwise <noreply@pathwiseinstitutions.org>',
        to: data.email,
        subject: `You're invited to join ${data.institutionName} on Pathwise`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>You're Invited to Pathwise</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Join ${data.institutionName} on Pathwise</p>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                <h2 style="color: #2d3748; margin-top: 0;">Welcome to Your Career Journey</h2>
                <p style="color: #4a5568; margin-bottom: 20px;">
                  <strong>${data.inviterName}</strong> has invited you to join <strong>${data.institutionName}</strong> on Pathwise as a <strong>${data.role}</strong>.
                </p>
                
                <p style="color: #4a5568; margin-bottom: 25px;">
                  Pathwise helps you build personalized career roadmaps, optimize your resume with AI analysis, find the perfect job matches, and track your application progress - all in one comprehensive platform.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            text-decoration: none; 
                            padding: 15px 30px; 
                            border-radius: 8px; 
                            font-weight: 600; 
                            display: inline-block;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    Accept Invitation & Join
                  </a>
                </div>
                
                <p style="color: #718096; font-size: 14px; margin-top: 25px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all; color: #4299e1;">${invitationUrl}</span>
                </p>
              </div>
              
              <div style="text-align: center; color: #a0aec0; font-size: 12px;">
                <p>This invitation will expire in 7 days for security reasons.</p>
                <p>&copy; 2025 Pathwise Institution Edition. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      });
      
      console.log(`✅ Invitation email sent successfully to ${data.email}. Resend ID: ${result.data?.id}`);
      return true;
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Log the full error details for debugging
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      return false;
    }
  }

  async sendLicenseUsageNotification(data: LicenseNotificationData): Promise<boolean> {
    try {
      await resend.emails.send({
        from: 'Pathwise <noreply@pathwiseinstitutions.org>',
        to: data.adminEmail,
        subject: `License Usage Alert: ${data.usagePercentage}% of seats used at ${data.institutionName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>License Usage Alert</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">License Usage Alert</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${data.institutionName}</p>
              </div>
              
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                <h2 style="color: #dc2626; margin-top: 0;">High License Usage Detected</h2>
                <p style="color: #7f1d1d; margin-bottom: 20px;">
                  Your institution is currently using <strong>${data.usedSeats} out of ${data.totalSeats} licensed seats</strong> (${data.usagePercentage}%).
                </p>
                
                <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 600; color: #374151;">Current Usage:</span>
                    <span style="font-weight: 600; color: #dc2626;">${data.usagePercentage}%</span>
                  </div>
                  <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: ${data.usagePercentage >= 90 ? '#dc2626' : '#f59e0b'}; height: 100%; width: ${data.usagePercentage}%; transition: width 0.3s ease;"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px; color: #6b7280;">
                    <span>${data.usedSeats} used</span>
                    <span>${data.totalSeats - data.usedSeats} remaining</span>
                  </div>
                </div>
                
                <p style="color: #7f1d1d;">
                  ${data.usagePercentage >= 95 
                    ? 'You have very few seats remaining. Consider upgrading your license to ensure continuous access for new users.'
                    : 'Please monitor your usage closely and consider upgrading your license if you need additional seats.'
                  }
                </p>
              </div>
              
              <div style="text-align: center; color: #a0aec0; font-size: 12px;">
                <p>This is an automated notification sent when license usage exceeds 80%.</p>
                <p>&copy; 2025 Pathwise Institution Edition. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send license usage notification:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();