import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) { }

  /**
   * Send OTP code to user's email
   * @param email Recipient email
   * @param otpCode 6-digit OTP code
   * @param purpose Purpose (REGISTER_VERIFY, PASSWORD_RESET)
   */
  async sendOtpEmail(email: string, otpCode: string, purpose: string): Promise<void> {
    let subject = 'Your OTP Verification Code';
    let actionText = 'verify your account';

    if (purpose === 'PASSWORD_RESET') {
      subject = 'Account Password Reset';
      actionText = 'reset your password';
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f5f7fb;
  font-family: Arial, 'Hanuman', sans-serif;
">

  <div style="
    width: 100%;
    padding: 40px 15px;
    box-sizing: border-box;
  ">

    <div style="
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.06);
    ">

      <!-- Header -->
      <div style="
        padding: 32px 30px;
        text-align: center;
        background: linear-gradient(135deg, #2563eb, #4f46e5);
      ">

        <div style="
          width: 52px;
          height: 52px;
          line-height: 52px;
          margin: 0 auto 15px;
          border-radius: 14px;
          background-color: rgba(255,255,255,0.18);
          color: #ffffff;
          font-size: 24px;
          font-weight: bold;
        ">
          CE
        </div>

        <h1 style="
          margin: 0;
          color: #ffffff;
          font-size: 22px;
          font-weight: 700;
        ">
          Cambodia E-Commerce
        </h1>

        <p style="
          margin: 8px 0 0;
          color: rgba(255,255,255,0.85);
          font-size: 13px;
        ">
          Secure account verification
        </p>

      </div>

      <!-- Content -->
      <div style="
        padding: 38px 35px;
        color: #1f2937;
      ">

        <p style="
          margin: 0 0 10px;
          font-size: 16px;
          font-weight: 600;
        ">
          Hello,
        </p>

        <p style="
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.7;
        ">
          You requested a verification code to
          <strong style="color: #111827;">
            ${actionText}
          </strong>
          in E-Commerce.
        </p>

        <!-- OTP Section -->
        <div style="
          margin: 32px 0;
          padding: 25px;
          text-align: center;
          background-color: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        ">

          <p style="
            margin: 0 0 12px;
            color: #6b7280;
            font-size: 13px;
          ">
            Your verification code
          </p>

          <div style="
            display: inline-block;
            padding: 14px 25px;
            background-color: #ffffff;
            border: 2px solid #2563eb;
            border-radius: 12px;
            color: #2563eb;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 7px;
          ">
            ${otpCode}
          </div>

          <p style="
            margin: 14px 0 0;
            color: #9ca3af;
            font-size: 12px;
          ">
            This code will expire in 5 minutes.
          </p>

        </div>

        <!-- Security Notice -->
        <div style="
          padding: 15px 17px;
          background-color: #fff7ed;
          border-left: 4px solid #f97316;
          border-radius: 8px;
        ">

          <p style="
            margin: 0;
            color: #9a3412;
            font-size: 12px;
            line-height: 1.6;
          ">
            <strong>Security notice:</strong>
            Never share this verification code with anyone.
            Our team will never ask you for your OTP.
          </p>

        </div>

        <p style="
          margin: 28px 0 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.6;
        ">
          If you did not request this code, you can safely ignore this email.
        </p>

      </div>

      <!-- Footer -->
      <div style="
        padding: 22px 30px;
        text-align: center;
        background-color: #f8fafc;
        border-top: 1px solid #eef0f3;
      ">

        <p style="
          margin: 0;
          color: #9ca3af;
          font-size: 11px;
          line-height: 1.6;
        ">
          This is an automated message from
          <strong>Cambodia E-Commerce System</strong>.
          <br>
          Please do not reply to this email.
        </p>

        <p style="
          margin: 10px 0 0;
          color: #c0c4cc;
          font-size: 10px;
        ">
          © ${new Date().getFullYear()} E-Commerce
        </p>

      </div>

    </div>

  </div>

</body>
</html>
`;


    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        html: htmlContent,
      });
      this.logger.log(`[EMAIL DISPATCH] Sent OTP for ${purpose} to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw new InternalServerErrorException('Failed to send OTP email! Please try again.');
    }
  }
}
