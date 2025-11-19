// googleClient.js
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';

const credentials = JSON.parse(fs.readFileSync('./client_secret.json', 'utf8'));
const { client_id, client_secret, redirect_uris } = credentials.web;

export const oAuth2Client = new OAuth2Client(
  client_id,
  client_secret,
  redirect_uris[0] // typically "http://localhost:5000/auth/google/callback"
);
