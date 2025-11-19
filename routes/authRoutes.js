// routes/authRoutes.js
import express from 'express';
import cookieParser from 'cookie-parser';
import { oAuth2Client } from '../googleClient.js';

const router = express.Router();
router.use(cookieParser());
const credentials = JSON.parse(process.env.GOOGLE_SECRET_JSON);
const { client_id, client_secret, redirect_uris } = credentials.web;

// Step 1: Redirect user to Google's OAuth 2.0 consent screen
router.get('/google', (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['profile', 'email'],
  });
  res.redirect(url);
});

// Step 2: Handle OAuth callback
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send('No code provided');

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Decode user info from ID token
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: client_id,
    });

    const payload = ticket.getPayload();

    // Set HttpOnly cookie
    res.cookie('token', tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    // console.log("Token:", tokens); // Add this line to log the token
    // Redirect to frontend
    res.redirect(`${process.env.CLIENT_URL}/callback?token=${tokens.id_token}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Step 3: Get current user info
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    // console.log("Token:", token); // Add this line to log the toke
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: client_id,
    });
    const payload = ticket.getPayload();

    res.json({ user: payload });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Step 4: Expose token via backend (frontend can call this to get token)
router.get('/token', (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'No token found' });

    // Return token safely (even though it's HttpOnly in the cookie)
    res.json({ token });
  } catch (err) {
    console.error('Failed to fetch token:', err);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

export default router;
