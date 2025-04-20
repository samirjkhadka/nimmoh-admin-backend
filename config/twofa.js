const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const generate2FASecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `Nimmoh Admin 2FA - ${email}`,
  }); // Generate a secret key with a name based on the email address of the user` });
  return secret;
};

const verify2FAToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1,
  });
};

const generateQRCode = async (otpauthUrl) => {
  return await qrcode.toDataURL(otpauthUrl);
};

module.exports = {
  generate2FASecret,
  verify2FAToken,
  generateQRCode,
};
