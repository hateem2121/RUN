/**
 * EMAIL SERVICE MODULE
 * Handles email notifications via Google Workspace SMTP
 * Created: October 22, 2025
 */

import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { logger } from "./smart-logger.js";

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

interface InquiryEmailData {
	id: number;
	name: string;
	email: string;
	company?: string;
	phone?: string;
	country?: string;
	message: string;
	preferredPlatform?: string;
	submittedAt: Date;
}

class EmailService {
	private transporter: Transporter | null = null;
	private isConfigured: boolean = false;

	constructor() {
		this.initialize();
	}

	private initialize(): void {
		const gmailUser = process.env.GMAIL_USER;
		const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

		if (!gmailUser || !gmailAppPassword) {
			logger.warn(
				"[Email] Gmail credentials not configured - email notifications disabled",
			);
			this.isConfigured = false;
			return;
		}

		try {
			this.transporter = nodemailer.createTransport({
				host: "smtp.gmail.com",
				port: 587,
				secure: false,
				auth: {
					user: gmailUser,
					pass: gmailAppPassword,
				},
			});

			this.isConfigured = true;
			logger.info("[Email] Email service initialized successfully");

			this.transporter.verify((error: Error | null) => {
				if (error) {
					logger.error("[Email] SMTP verification failed:", error);
					this.isConfigured = false;
				} else {
					logger.info("[Email] SMTP server ready to send emails");
				}
			});
		} catch (error) {
			logger.error("[Email] Failed to initialize email service:", error);
			this.isConfigured = false;
		}
	}

	private async sendEmail(options: EmailOptions): Promise<boolean> {
		if (!this.isConfigured || !this.transporter) {
			logger.warn("[Email] Email service not configured - skipping email send");
			return false;
		}

		try {
			const info = await this.transporter.sendMail({
				from: `"RUN APPAREL" <${process.env.GMAIL_USER}>`,
				to: options.to,
				subject: options.subject,
				html: options.html,
				text: options.text || options.html.replace(/<[^>]*>/g, ""),
			});

			logger.info(`[Email] Email sent successfully: ${info.messageId}`);
			return true;
		} catch (error) {
			logger.error("[Email] Failed to send email:", error);
			return false;
		}
	}

	async sendAdminNotification(inquiry: InquiryEmailData): Promise<boolean> {
		const adminEmail = process.env.GMAIL_USER;
		if (!adminEmail) {
			logger.warn("[Email] Admin email not configured");
			return false;
		}

		const subject = `New Contact Inquiry from ${inquiry.name}`;
		const html = this.generateAdminEmailTemplate(inquiry);

		logger.info(
			`[Email] Sending admin notification for inquiry #${inquiry.id}`,
		);
		return await this.sendEmail({
			to: adminEmail,
			subject,
			html,
		});
	}

	async sendCustomerConfirmation(inquiry: InquiryEmailData): Promise<boolean> {
		const subject = "Thank you for contacting RUN APPAREL";
		const html = this.generateCustomerEmailTemplate(inquiry);

		logger.info(`[Email] Sending customer confirmation to ${inquiry.email}`);
		return await this.sendEmail({
			to: inquiry.email,
			subject,
			html,
		});
	}

	private generateAdminEmailTemplate(inquiry: InquiryEmailData): string {
		const dashboardUrl = process.env.REPLIT_DEV_DOMAIN
			? `https://${process.env.REPLIT_DEV_DOMAIN}/admin/inquiries/${inquiry.id}`
			: `http://localhost:5000/admin/inquiries/${inquiry.id}`;

		return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Contact Inquiry</h1>
              <p style="margin: 8px 0 0; color: #cccccc; font-size: 14px;">Received on ${new Date(inquiry.submittedAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Contact Information -->
              <h2 style="margin: 0 0 20px; color: #000000; font-size: 18px; font-weight: 600;">Contact Information</h2>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <strong style="color: #666666; font-size: 14px;">Name:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                    <span style="color: #000000; font-size: 14px;">${inquiry.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <strong style="color: #666666; font-size: 14px;">Email:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                    <a href="mailto:${inquiry.email}" style="color: #0066cc; font-size: 14px; text-decoration: none;">${inquiry.email}</a>
                  </td>
                </tr>
                ${
									inquiry.company
										? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <strong style="color: #666666; font-size: 14px;">Company:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                    <span style="color: #000000; font-size: 14px;">${inquiry.company}</span>
                  </td>
                </tr>
                `
										: ""
								}
                ${
									inquiry.phone
										? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <strong style="color: #666666; font-size: 14px;">Phone:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                    <a href="tel:${inquiry.phone}" style="color: #0066cc; font-size: 14px; text-decoration: none;">${inquiry.phone}</a>
                  </td>
                </tr>
                `
										: ""
								}
                ${
									inquiry.country
										? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <strong style="color: #666666; font-size: 14px;">Country:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                    <span style="color: #000000; font-size: 14px;">${inquiry.country}</span>
                  </td>
                </tr>
                `
										: ""
								}
                ${
									inquiry.preferredPlatform
										? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
                    <strong style="color: #666666; font-size: 14px;">Preferred Platform:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right;">
                    <span style="color: #000000; font-size: 14px;">${inquiry.preferredPlatform}</span>
                  </td>
                </tr>
                `
										: ""
								}
              </table>

              <!-- Message -->
              <h2 style="margin: 0 0 16px; color: #000000; font-size: 18px; font-weight: 600;">Message</h2>
              <div style="padding: 20px; background-color: #f9f9f9; border-radius: 6px; border-left: 4px solid #000000; margin-bottom: 30px;">
                <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${inquiry.message}</p>
              </div>

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 10px;">View in Admin Dashboard</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                This is an automated notification from your RUN APPAREL website contact form.<br>
                Inquiry ID: #${inquiry.id}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
	}

	private generateCustomerEmailTemplate(inquiry: InquiryEmailData): string {
		return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Thank You!</h1>
              <p style="margin: 12px 0 0; color: #cccccc; font-size: 16px;">We've received your inquiry</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${inquiry.name}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for contacting <strong>RUN APPAREL (PVT) LTD</strong>. We have received your inquiry and our team will review it shortly.
              </p>

              <div style="padding: 24px; background-color: #f9f9f9; border-radius: 6px; margin-bottom: 24px; border-left: 4px solid #000000;">
                <h2 style="margin: 0 0 12px; color: #000000; font-size: 16px; font-weight: 600;">What happens next?</h2>
                <ul style="margin: 0; padding-left: 20px; color: #333333; font-size: 14px; line-height: 1.8;">
                  <li>Our team will review your inquiry within 24-48 hours</li>
                  <li>We'll respond via ${inquiry.preferredPlatform || "email"} with the information you requested</li>
                  <li>For urgent matters, feel free to call us directly</li>
                </ul>
              </div>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                In the meantime, you can explore our product catalog and learn more about our B2B sportswear manufacturing services.
              </p>

              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>The RUN APPAREL Team</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 12px; color: #666666; font-size: 12px; text-align: center;">
                <strong>RUN APPAREL (PVT) LTD</strong><br>
                B2B Sportswear Manufacturing
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px; text-align: center;">
                This is an automated confirmation email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
	}
}

export const emailService = new EmailService();
export type { InquiryEmailData };
