const { BASE_URL } = require('../config/jwt');

// Password reset email template
exports.passwordResetEmail = (name, resetLink) => {
  return {
    subject: 'Password Reset Request - Nimmoh Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your Nimmoh Admin account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `
  };
};

// Password changed notification template
exports.passwordChangedEmail = (name) => {
  return {
    subject: 'Password Changed - Nimmoh Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>Hello ${name},</p>
        <p>Your Nimmoh Admin account password has been successfully changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `
  };
};

// 2FA setup email template
exports.twoFASetupEmail = (name) => {
  return {
    subject: '2FA Setup Required - Nimmoh Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Two-Factor Authentication Setup</h2>
        <p>Hello ${name},</p>
        <p>Two-factor authentication (2FA) has been enabled for your Nimmoh Admin account.</p>
        <p>Please complete the 2FA setup process during your next login.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `
  };
}; 