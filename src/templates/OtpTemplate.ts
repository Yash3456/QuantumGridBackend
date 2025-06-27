export const otpEmailTemplate = (otp: string, name: string = "User") => `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
    <h2 style="color: #2c3e50;">Hello ${name},</h2>
    <p style="font-size: 16px;">Your One-Time Password (OTP) is:</p>
    <div style="font-size: 28px; font-weight: bold; color: #2980b9; margin: 20px 0;">${otp}</div>
    <p style="font-size: 14px; color: #555;">Please use this OTP to complete your verification process. It is valid for 5 minutes.</p>
    <p style="font-size: 14px; color: #888;">If you did not request this, please ignore this email.</p>
    <br/>
    <p style="font-size: 14px; color: #888;">Thanks,<br/>Quantum Grid Team</p>
  </div>
`;
