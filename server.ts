import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { 
  uploadFileToDrive, 
  deleteFileFromDrive, 
  getFileFromDrive,
  getIsGoogleConfigured
} from "./server/driveService";


dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints FIRST

  // 1. Get the Strava authorize URL
  app.get("/api/auth/strava/url", (req, res) => {
    const client_id = process.env.STRAVA_CLIENT_ID;
    if (!client_id) {
      return res.json({ 
        error: "NOT_CONFIGURED",
        message: "Strava Client ID is not configured in environment variables." 
      });
    }
    const redirectUri = req.query.redirectUri || `${req.protocol}://${req.headers.host}/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: client_id,
      redirect_uri: redirectUri as string,
      response_type: 'code',
      scope: 'activity:read,activity:read_all',
      approval_prompt: 'auto'
    });
    
    const authUrl = `https://www.strava.com/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // 2. Refresh Strava access token
  app.post('/api/auth/strava/refresh', async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh_token' });
    }
    try {
      const client_id = process.env.STRAVA_CLIENT_ID;
      const client_secret = process.env.STRAVA_CLIENT_SECRET;
      
      if (!client_id || !client_secret) {
        return res.status(400).json({ error: 'NOT_CONFIGURED', message: 'Strava is not configured.' });
      }
      
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id,
          client_secret,
          refresh_token,
          grant_type: 'refresh_token'
        })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: 'Failed to refresh token', details: errText });
      }
      
      const refreshData = await response.json();
      res.json(refreshData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Get Strava activities proxy
  app.get('/api/strava/activities', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    try {
      const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
        headers: {
          'Authorization': authHeader
        }
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: 'Strava API error', details: errText });
      }
      const activities = await response.json();
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Handle the OAuth callback
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
      return res.send(`
        <html>
          <head>
            <title>Mosta Run Club - Authentification</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px; text-align: center; }
              .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 450px; margin: 0 auto; }
              .error-icon { font-size: 48px; color: #ef4444; margin-bottom: 16px; }
              h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
              p { font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 24px; }
              button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
              button:hover { background: #2563eb; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="error-icon">⚠️</div>
              <h1>Erreur d'authentification</h1>
              <p>${error}</p>
              <button onclick="window.close()">Fermer cette fenêtre</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error}' }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }
    
    if (!code) {
      return res.send(`
        <html>
          <body>
            <p>Code de vérification non reçu. Veuillez fermer cette fenêtre et réessayer.</p>
            <button onclick="window.close()">Fermer</button>
          </body>
        </html>
      `);
    }
    
    try {
      const client_id = process.env.STRAVA_CLIENT_ID;
      const client_secret = process.env.STRAVA_CLIENT_SECRET;
      
      if (!client_id || !client_secret) {
        throw new Error("Les identifiants Strava ne sont pas configurés sur le serveur.");
      }
      
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id,
          client_secret,
          code,
          grant_type: 'authorization_code'
        })
      });
      
      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Impossible d'échanger le code : ${errText}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      // Return a clean HTML page that sends the tokenData to the React client
      res.send(`
        <html>
          <head>
            <title>Mosta Run Club - Connexion Réussie</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px; text-align: center; }
              .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 450px; margin: 0 auto; }
              .success-icon { font-size: 48px; color: #10b981; margin-bottom: 16px; animation: scale 0.3s ease-out; }
              h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
              p { font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 24px; }
              .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              @keyframes scale { 0% { transform: scale(0.5); } 100% { transform: scale(1); } }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="success-icon">⚡</div>
              <h1>Connexion Strava Réussie !</h1>
              <p>Votre compte a été connecté avec succès. Synchronisation de vos activités en cours...</p>
              <div class="spinner"></div>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  tokenData: ${JSON.stringify(tokenData)} 
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Error during token exchange:", err);
      res.send(`
        <html>
          <head>
            <title>Mosta Run Club - Erreur</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px; text-align: center; }
              .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 450px; margin: 0 auto; }
              .error-icon { font-size: 48px; color: #ef4444; margin-bottom: 16px; }
              h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
              p { font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 24px; }
              button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="error-icon">❌</div>
              <h1>Échec de la connexion</h1>
              <p>${err.message}</p>
              <button onclick="window.close()">Fermer cette fenêtre</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_ERROR', 
                  error: ${JSON.stringify(err.message)} 
                }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }
  });

  // --- GOOGLE DRIVE STORAGE PROXY API ---

  // Map of pending file IDs -> creation timestamp
  const pendingFiles = new Map<string, number>();

  // Interval to automatically clean up unconfirmed/orphaned files
  setInterval(async () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    for (const [fileId, createdAt] of pendingFiles.entries()) {
      if (createdAt < fiveMinutesAgo) {
        console.log(`[Storage Cleanup] Deleting unconfirmed file: ${fileId}`);
        pendingFiles.delete(fileId);
        try {
          await deleteFileFromDrive(fileId);
        } catch (err: any) {
          console.error(`[Storage Cleanup] Failed to delete ${fileId}:`, err.message || err);
        }
      }
    }
  }, 60 * 1000);

  // 1. Upload file (Base64) to Google Drive (or local fallback)
  app.post("/api/storage/upload", async (req, res) => {
    const { fileData, fileName, folderPath } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, message: "Missing fileData" });
    }

    try {
      let mimeType = "application/octet-stream";
      let base64Content = fileData;
      
      if (fileData.startsWith("data:")) {
        const parts = fileData.split(";base64,");
        mimeType = parts[0].split(":")[1];
        base64Content = parts[1];
      }

      const buffer = Buffer.from(base64Content, "base64");
      const name = fileName || `file_${Date.now()}`;
      
      // Determine folder path if not provided
      let finalFolderPath = folderPath || "Documents";
      if (!folderPath) {
        const nameLower = name.toLowerCase();
        if (nameLower.includes("voice_") || mimeType.startsWith("audio/")) {
          finalFolderPath = "VoiceMessages";
        } else if (nameLower.includes("mrc_") || nameLower.includes("support_")) {
          finalFolderPath = "ChatMedia";
        } else if (nameLower.includes("report_")) {
          finalFolderPath = "Reports";
        } else if (nameLower.includes("certificate_")) {
          finalFolderPath = "Certificates";
        } else if (mimeType.startsWith("video/")) {
          finalFolderPath = "Events/Default/Videos";
        } else if (mimeType.startsWith("image/")) {
          finalFolderPath = "Events/Default/Images";
        }
      }

      console.log(`Uploading file '${name}' to '${finalFolderPath}'...`);
      const fileInfo = await uploadFileToDrive(buffer, name, mimeType, finalFolderPath);
      
      // Register file in pending files list (unconfirmed)
      pendingFiles.set(fileInfo.id, Date.now());

      // Generate the secure proxy file access URL
      const secureUrl = `/api/storage/file/${fileInfo.id}`;

      res.json({
        success: true,
        fileId: fileInfo.id,
        url: secureUrl,
        name: fileInfo.name,
        mimeType: fileInfo.mimeType
      });
    } catch (error: any) {
      console.error("Storage upload handler failed:", error.message || error);
      res.status(500).json({ success: false, message: error.message || "Upload failed" });
    }
  });

  // 2. Confirm file upload (DB write succeeded)
  app.post("/api/storage/confirm", (req, res) => {
    const { fileIds } = req.body;
    if (!Array.isArray(fileIds)) {
      return res.status(400).json({ success: false, message: "fileIds must be an array" });
    }

    console.log(`Confirming file uploads:`, fileIds);
    for (const id of fileIds) {
      pendingFiles.delete(id);
    }

    res.json({ success: true });
  });

  // 3. Delete files from Google Drive / local fallback
  app.post("/api/storage/delete", async (req, res) => {
    const { fileIds } = req.body;
    if (!Array.isArray(fileIds)) {
      return res.status(400).json({ success: false, message: "fileIds must be an array" });
    }

    console.log(`Deleting files:`, fileIds);
    try {
      for (const id of fileIds) {
        pendingFiles.delete(id);
        await deleteFileFromDrive(id);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Deletion failed" });
    }
  });

  // 4. Stream secure file content to the client
  app.get("/api/storage/file/:fileId", async (req, res) => {
    const { fileId } = req.params;
    try {
      const { stream, mimeType } = await getFileFromDrive(fileId);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache
      stream.pipe(res);
    } catch (err: any) {
      console.error(`Error streaming file ${fileId}:`, err.message || err);
      res.status(404).send("File not found");
    }
  });

  // Serve Vite in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
