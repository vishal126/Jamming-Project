// ============================================================================
// Spotify Authentication (PKCE)
// This file:
// 1. Generates a PKCE Code Verifier
// 2. Generates a PKCE Code Challenge
// 3. Redirects the user to Spotify Login
// 4. Receives the Authorization Code after login

const API_BASE_URL = "https://api.spotify.com/v1";
const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";


// Stores the access token after it is received from Spotify.
let accessToken = '';
let tokenExpirationTime = 0;

// Spotify Application Client ID
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

// Redirect URI
// Must exactly match the Redirect URI configured
// in the Spotify Developer Dashboard.
const redirectUri = 'http://127.0.0.1:5173';


// ============================================================================
// Generates a random string.

// Spotify requires a secret string called the "Code Verifier".
// Later, this verifier is sent back to Spotify to prove that
// the application exchanging the authorization code is the same
// application that started the login.
//
// Length should be between 43 and 128 characters.
// ============================================================================
function generateRandomString(length) {

  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return Array.from(
    crypto.getRandomValues(new Uint8Array(length))
  )
    .map(value => possible[value % possible.length])
    .join("");
}


// ============================================================================
// Generates a SHA-256 hash of the verifier.
//
// Spotify does NOT receive the verifier initially.
// Instead, it receives a hashed version called the
// "Code Challenge".
//
// Later, Spotify compares:
//
// SHA256(Code Verifier)
//            ==
// Stored Code Challenge
//
// to verify authenticity.
// ============================================================================
async function generateCodeChallenge(verifier) {

  const data = new TextEncoder().encode(verifier);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return btoa(
    String.fromCharCode(...new Uint8Array(digest))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ============================================================================
// Exchange Authorization Code for Access Token
// ============================================================================

async function exchangeCodeForToken(code) {

  const codeVerifier = localStorage.getItem(
    "spotify_code_verifier"
  );

  const response = await fetch(
    `${TOKEN_URL}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },

      body: new URLSearchParams({

        client_id: clientId,

        grant_type: "authorization_code",

        code: code,

        redirect_uri: redirectUri,

        code_verifier: codeVerifier

      })

    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || "Failed to get access token");
  }

  return data;
}

function saveAccessToken(token, expiresIn) {
  accessToken = token;

  tokenExpirationTime = Date.now() + expiresIn * 1000;

  sessionStorage.setItem(
    "spotify_access_token",
    accessToken
  );

  sessionStorage.setItem(
    "spotify_token_expiration",
    tokenExpirationTime
  );
}

function getHeaders(token, isJson = false) {
  const headers = {
    Authorization: `Bearer ${token}`
  };

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

// ============================================================================
// Spotify Utility Object
// ============================================================================
const Spotify = {

  // ========================================================================
  // Starts Spotify Authentication.
  //
  // Flow:
  //
  // App
  //   ↓
  // Generate Verifier
  //   ↓
  // Generate Challenge
  //   ↓
  // Redirect to Spotify Login
  //   ↓
  // User logs in
  //   ↓
  // Spotify redirects back
  //      ?code=XXXXXXXX
  // ========================================================================
  async getAccessToken() {

    // --------------------------------------------------------------------
    // If we already have an access token,
    // return it immediately.
    //
    // (Will become useful after Part 2.)
    // --------------------------------------------------------------------
    const storedToken = sessionStorage.getItem("spotify_access_token");
    const expiration = Number(
      sessionStorage.getItem("spotify_token_expiration")
    );

    if (storedToken && Date.now() < expiration) {
      accessToken = storedToken;
      tokenExpirationTime = expiration;
      return accessToken;
    }

    if (storedToken && Date.now() >= expiration) {
      sessionStorage.removeItem("spotify_access_token");
      sessionStorage.removeItem("spotify_token_expiration");
    }

    // --------------------------------------------------------------------
    // Check whether Spotify redirected us back with
    // an Authorization Code.
    //
    // Example URL:
    //
    // http://127.0.0.1:5173/?code=AQDt8.....
    // --------------------------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");


    // --------------------------------------------------------------------
    // If a code exists,
    // authentication succeeded.
    //
    // For now,
    // simply print it.
    //
    // Next step:
    // We'll exchange this code for an Access Token.
    // --------------------------------------------------------------------
    if (code) {

      const tokenData =
        await exchangeCodeForToken(code);

      saveAccessToken(
        tokenData.access_token,
        tokenData.expires_in
      );

      window.setTimeout(() => {
        accessToken = '';

        sessionStorage.removeItem("spotify_access_token");
        sessionStorage.removeItem("spotify_token_expiration");

      }, tokenData.expires_in * 1000);

      localStorage.removeItem("spotify_code_verifier");

      window.history.replaceState({}, document.title, "/");

      return accessToken;
    }


    // --------------------------------------------------------------------
    // No Authorization Code exists.
    //
    // User has not logged in yet.
    //
    // Generate PKCE credentials.
    // --------------------------------------------------------------------
    const codeVerifier =
      generateRandomString(64);

    const codeChallenge =
      await generateCodeChallenge(codeVerifier);


    // --------------------------------------------------------------------
    // Save the verifier.
    //
    // After Spotify redirects back,
    // we'll need this exact verifier
    // to exchange the Authorization Code
    // for an Access Token.
    // --------------------------------------------------------------------
    localStorage.setItem(
      "spotify_code_verifier",
      codeVerifier
    );


    // --------------------------------------------------------------------
    // Build Spotify Authorization URL.
    //
    // Required parameters:
    //
    // client_id
    // response_type
    // redirect_uri
    // scope
    // code_challenge_method
    // code_challenge
    // --------------------------------------------------------------------
    const authUrl =
      `${AUTH_URL}?` +
      new URLSearchParams({

        client_id: clientId,

        response_type: "code",

        redirect_uri: redirectUri,

        scope: "playlist-modify-public",

        code_challenge_method: "S256",

        code_challenge: codeChallenge

      });


    // --------------------------------------------------------------------
    // Redirect the user to Spotify Login.
    // --------------------------------------------------------------------
    window.location.assign(authUrl);

  },


  // ============================================================================
  // Search Songs from Spotify
  //
  // Input:
  //   search term entered by the user
  //
  // Process:
  //   1. Get Access Token
  //   2. Call Spotify Search API
  //   3. Convert Spotify response into our own Track objects
  //
  // Output:
  //   [
  //      {
  //          id,
  //          title,
  //          artist,
  //          album,
  //          uri
  //      }
  //   ]
  // ============================================================================

  async search(term) {

    if (!term.trim()) {
      return [];
    }

    // Get valid access token
    const token = await this.getAccessToken();

    const searchResponse = await fetch(

      `${API_BASE_URL}/search?type=track&q=${encodeURIComponent(term)}`,

      {
        headers: getHeaders(token)
      }

    );

    if (!searchResponse.ok) {

      const errorBody = await searchResponse.text();

      throw new Error(errorBody);
    }

    const jsonResponse = await searchResponse.json();

    if (!jsonResponse.tracks) {
      return [];
    }

    return jsonResponse.tracks.items.map(track => ({

      id: track.id,

      title: track.name,

      artist: track.artists
        .map(artist => artist.name)
        .join(", "),

      album: track.album.name,

      uri: track.uri

    }));

  },

  // ============================================================================
  // Save Playlist to Spotify
  //
  // Steps:
  // 1. Validate playlist name and tracks.
  // 2. Get access token.
  // 3. Get current Spotify user.
  // 4. Create a new playlist.
  // 5. Add tracks to the playlist.
  // ============================================================================

  async savePlaylist(name, trackUris) {

    // Don't proceed if playlist name or tracks are missing
    if (!name.trim() || trackUris.length === 0) {
      return;
    }

    // Get valid access token
    const token = await this.getAccessToken();

    // Authorization header
    const headers = getHeaders(token, true);

    // ------------------------------------------------------------------------
    // Step 1 : Get current user
    // ------------------------------------------------------------------------

    const userResponse = await fetch(
      `${API_BASE_URL}/me`,
      {
        headers
      }
    );

    if (!userResponse.ok) {
      throw new Error("Unable to fetch current Spotify user.");
    }

    const user = await userResponse.json();

    const userId = user.id;

    // ------------------------------------------------------------------------
    // Step 2 : Create playlist
    // ------------------------------------------------------------------------

    const playlistResponse = await fetch(
      `${API_BASE_URL}/users/${userId}/playlists`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name
        })
      }
    );

    if (!playlistResponse.ok) {
      throw new Error("Unable to create playlist.");
    }

    const playlist = await playlistResponse.json();

    const playlistId = playlist.id;

    // ------------------------------------------------------------------------
    // Step 3 : Add tracks
    // ------------------------------------------------------------------------

    const addTracksResponse = await fetch(
      `${API_BASE_URL}/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          uris: trackUris
        })
      }
    );

    if (!addTracksResponse.ok) {
      throw new Error("Unable to add songs.");
    }
  }

};


export default Spotify;