import * as repl from 'repl';
import open from 'open';
import dotenv from "dotenv";
dotenv.config();

import SpotifyWebApi from "spotify-web-api-node";
import express from "express";

import { SCOPES } from "./config/scopes.ts";

console.log(process.env.CLIENT_ID);

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

const PORT = process.env.PORT || 8888;

const app = express();

app.get("/login", (_req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(SCOPES, "state"));
});

app.get("/callback", async (req, res) => {
  const { code, error, state } = req.query;

  if (error) {
    console.error("Callback Error:", error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  const {
    body: { access_token, expires_in, refresh_token, scope, token_type },
  } = await spotifyApi.authorizationCodeGrant(String(code));

  spotifyApi.setAccessToken(access_token);
  spotifyApi.setRefreshToken(refresh_token);

  res.send("Success! You can now close the window.");
  // Refresh the token a bit earlier than the actual expiration time

  // Refresh the token a bit earlier than the actual expiration time
  const refreshTime = (expires_in - 300) * 1000; // 300 seconds = 5 minutes

  setTimeout(async () => {
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body['access_token']);
  }, refreshTime);

  // Start a REPL
  const r = repl.start('> ');
  // Make spotifyApi available in the REPL
  r.context.spotifyApi = spotifyApi;
});


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  open(`http://localhost:${PORT}/login`);
});
