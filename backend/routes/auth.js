const router = require('express').Router();
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Admin } = require('../models');

router.post('/login', async (req, res) => {
  try {
    const { email, password, token } = req.body;
    const admin = await Admin.findOne({ email: email?.toLowerCase() });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    if (admin.mfaEnabled) {
      if (!token) return res.status(206).json({ error: 'MFA_REQUIRED' });
      const valid = speakeasy.totp.verify({
        secret: admin.mfaSecret,
        encoding: 'base32',
        token,
        window: 1,
      });
      if (!valid) return res.status(401).json({ error: 'Invalid MFA code' });
    }

    const jwtToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, email: admin.email, mfaEnabled: admin.mfaEnabled });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/seed', async (req, res) => {
  try {
    if (await Admin.findOne({})) return res.status(400).json({ error: 'Admin already exists' });
    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    res.json({ message: 'Admin created', email: admin.email });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mfa/setup', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const secret = speakeasy.generateSecret({ name: `BYDASAM Admin (${admin.email})` });
    admin.mfaSecret = secret.base32;
    admin.mfaEnabled = false;
    await admin.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ qrCode, secret: secret.base32 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mfa/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const valid = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: 'base32',
      token: req.body.token,
      window: 1,
    });

    if (!valid) return res.status(401).json({ error: 'Invalid code' });
    admin.mfaEnabled = true;
    await admin.save();
    res.json({ message: 'MFA enabled successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mfa/disable', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    admin.mfaEnabled = false;
    admin.mfaSecret = '';
    await admin.save();
    res.json({ message: 'MFA disabled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
