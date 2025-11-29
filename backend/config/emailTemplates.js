export const emailTemplates = {
    verifyEmail: (verificationUrl, firstName) => {
        return {
            subject: "Activate your LinkUps Protocol",
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - LinkUps</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #020410; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #0fffc6 100%); padding: 40px 20px; text-align: center; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .content { padding: 40px 30px; }
            .greeting { font-size: 24px; font-weight: 600; color: #0b0f2a; margin-bottom: 20px; }
            .message { font-size: 16px; color: #555; margin-bottom: 30px; line-height: 1.6; }
            .cta-button { display: inline-block; background: #8b5cf6; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); transition: transform 0.2s ease; }
            .cta-button:hover { transform: translateY(-2px); background: #7c3aed; }
            .alternative-link { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #8b5cf6; }
            .alternative-link p { margin: 0 0 10px 0; font-size: 14px; color: #666; }
            .alternative-link code { background-color: #e9ecef; padding: 2px 6px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #495057; font-family: monospace; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
            .footer-text { font-size: 14px; color: #666; margin: 0 0 10px 0; }
            .social-links { margin: 20px 0; }
            .social-links a { display: inline-block; margin: 0 10px; color: #8b5cf6; text-decoration: none; font-weight: bold; }
            .expiry-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .expiry-notice p { margin: 0; font-size: 14px; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">🚀 LinkUps</h1>
            </div>
            
            <div class="content">
              <h2 class="greeting">Hi ${firstName}! 👋</h2>
              
              <p class="message">
                Welcome to <strong>LinkUps</strong> - the professional neural network! 
                We're excited to have you join our grid.
              </p>
              
              <p class="message">
                To fully activate your node and establish secure connections, please verify your email address:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="cta-button">
                  ✅ Verify Identity
                </a>
              </div>
              
              <div class="alternative-link">
                <p><strong>Button not working?</strong> Copy this link:</p>
                <code>${verificationUrl}</code>
              </div>
              
              <div class="expiry-notice">
                <p>⏰ <strong>Security Notice:</strong> This uplink expires in 24 hours.</p>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                If you did not initiate this request, please ignore this transmission.
              </p>
              <p style="font-size: 12px; color: #999; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} LinkUps Inc. System Online.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `Hi ${firstName}! Welcome to LinkUps. Please verify your email: ${verificationUrl}`,
        };
    },

    welcomeEmail: (firstName, dashboardUrl) => {
        return {
            subject: "🎉 LinkUps Node Activated!",
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to LinkUps</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #020410; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #0fffc6 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; }
            .logo { color: #000; font-size: 28px; font-weight: bold; margin: 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 24px; font-weight: 600; color: #0b0f2a; margin-bottom: 20px; }
            .message { font-size: 16px; color: #555; margin-bottom: 20px; line-height: 1.6; }
            .cta-button { display: inline-block; background: #0fffc6; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 15px rgba(15, 255, 198, 0.4); }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">🎉 System Online</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Congratulations, ${firstName}!</h2>
              <p class="message">
                Your identity has been verified. You are now fully connected to the LinkUps neural network.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" class="cta-button">
                  🚀 Enter Dashboard
                </a>
              </div>
              <p class="message">
                Start connecting with peers, sharing updates, and building your professional legacy.
              </p>
            </div>
            <div class="footer">
              <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} LinkUps Inc.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `Welcome ${firstName}! Your account is verified. Login here: ${dashboardUrl}`,
        };
    },

    passwordReset: (resetLink, resetToken, firstName) => {
        return {
            subject: "🔐 LinkUps Password Reset",
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Reset Password</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #020410; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; }
            .header { background: #0b0f2a; padding: 40px 20px; text-align: center; border-bottom: 4px solid #8b5cf6; }
            .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 24px; font-weight: 600; color: #333; }
            .message { font-size: 16px; color: #666; margin-bottom: 30px; }
            .cta-button { display: inline-block; background: #8b5cf6; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }
            .token-section { background-color: #f8f9fa; border-left: 4px solid #8b5cf6; padding: 20px; margin: 30px 0; }
            .token { font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #0b0f2a; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">🔐 LinkUps Security</h1>
            </div>
            <div class="content">
              <div class="greeting">Hi ${firstName},</div>
              <p class="message">
                We received a request to reset your access credentials. Click below to proceed:
              </p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="cta-button">Reset Password</a>
              </div>
              <div class="token-section">
                <div style="font-size: 12px; text-transform: uppercase; color: #8b5cf6;">Manual Token</div>
                <div class="token">${resetToken}</div>
              </div>
              <p style="font-size: 14px; color: #999;">This link expires in 1 hour.</p>
            </div>
            <div class="footer">
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `Reset your password here: ${resetLink}`,
        };
    },

    passwordResetConfirmation: (firstName) => {
        return {
            subject: "✅ Password Reset Successful",
            html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; text-align: center;">
                    <h1 style="color: #059669;">Success</h1>
                    <p>Hi ${firstName}, your password has been successfully updated.</p>
                    <p>You can now log in with your new credentials.</p>
                </div>
            </body>
            </html>
            `,
            text: `Hi ${firstName}, your password has been successfully reset.`,
        };
    },
};
