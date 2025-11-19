// middleware/oauth2Auth.js
import { oAuth2Client } from '../googleClient.js';

export const oauth2Auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: no token provided' });
    }

    const idToken = authHeader.split(' ')[1];

    // Verify token with Google
    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // console.log(payload);

    // Attach user info to request
    req.user = {
      userId: payload.sub, // Google unique ID
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    next(); // token valid, proceed
  } catch (err) {
    console.error('OAuth2 middleware error:', err);
    res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
};
