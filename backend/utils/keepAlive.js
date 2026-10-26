import https from "https";
import http from "http";

/**
 * Automatically pings the Render backend URL every 10 minutes to prevent
 * Render free tier instances from going to sleep after 15 minutes of inactivity.
 */
export function startKeepAlive(port = 4000) {
  // Render automatically provides RENDER_EXTERNAL_URL (e.g., https://your-service.onrender.com)
  // or users can specify BACKEND_URL / SERVER_URL in .env
  const targetUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.SERVER_URL ||
    process.env.API_URL ||
    (process.env.RENDER_EXTERNAL_HOSTNAME
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
      : null);

  const intervalMs = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10) || 10 * 60 * 1000; // 10 minutes default

  if (!targetUrl) {
    console.log(
      `[Render Keep-Alive] Notice: No RENDER_EXTERNAL_URL or BACKEND_URL detected. In Render Web Service Environment, Render sets RENDER_EXTERNAL_URL automatically. Alternatively, set BACKEND_URL in your .env or Render dashboard.`
    );
    return;
  }

  const pingUrl = targetUrl.replace(/\/+$/, "") + "/api/ping";
  console.log(`[Render Keep-Alive] Initialized self-ping service targeting: ${pingUrl} (every ${intervalMs / 60000} mins)`);

  const pingBackend = () => {
    try {
      const client = pingUrl.startsWith("https") ? https : http;
      const req = client.get(pingUrl, { timeout: 15000 }, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            console.log(`[Render Keep-Alive] Keep-alive ping successful at ${new Date().toLocaleTimeString()} (Status: ${res.statusCode})`);
          } else {
            console.warn(`[Render Keep-Alive] Ping returned status ${res.statusCode}`);
          }
        });
      });

      req.on("error", (err) => {
        console.warn(`[Render Keep-Alive] Ping warning: ${err.message}`);
      });

      req.on("timeout", () => {
        req.destroy();
        console.warn("[Render Keep-Alive] Ping timed out after 15s");
      });
    } catch (err) {
      console.warn(`[Render Keep-Alive] Failed to execute self-ping: ${err.message}`);
    }
  };

  // Initial delay of 2 minutes after startup before first ping, then recurring every intervalMs
  setTimeout(() => {
    pingBackend();
    setInterval(pingBackend, intervalMs);
  }, 2 * 60 * 1000);
}
