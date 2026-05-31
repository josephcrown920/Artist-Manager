import { Router } from "express";
import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const CAPI_URL = "https://capi.spotify.com/capi-direct/events/";

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

async function sendCapiEvent(token: string, connectionId: string, payload: object) {
  const res = await fetch(CAPI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ connection_id: connectionId, ...payload }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Spotify CAPI error ${res.status}: ${text}`);
  return text ? JSON.parse(text) : { success: true };
}

// POST /api/spotify-capi/event  — send an arbitrary conversion event
router.post("/event", async (req, res) => {
  const token        = await getSetting("spotifyCapiToken");
  const connectionId = await getSetting("spotifyCapiConnectionId");

  if (!token || !connectionId) {
    res.status(400).json({ error: "Spotify CAPI not configured — add token and connection ID in Settings." });
    return;
  }

  const { event_type, user_data, event_data } = req.body;
  if (!event_type || !user_data) {
    res.status(400).json({ error: "event_type and user_data are required." });
    return;
  }

  try {
    const result = await sendCapiEvent(token, connectionId, {
      data: [{ event_type, user_data, event_time: Math.floor(Date.now() / 1000), ...(event_data || {}) }],
    });
    res.json({ success: true, result });
  } catch (err: any) {
    req.log.error({ err }, "Spotify CAPI event failed");
    res.status(502).json({ error: err.message });
  }
});

// POST /api/spotify-capi/test  — send a test page_view to confirm credentials
router.post("/test", async (req, res) => {
  const token        = await getSetting("spotifyCapiToken");
  const connectionId = await getSetting("spotifyCapiConnectionId");

  if (!token || !connectionId) {
    res.status(400).json({ error: "Spotify CAPI not configured — add token and connection ID in Settings." });
    return;
  }

  try {
    const result = await sendCapiEvent(token, connectionId, {
      data: [{
        event_type: "PAGE_VIEW",
        event_time: Math.floor(Date.now() / 1000),
        user_data: { client_ip_address: req.ip || "0.0.0.0" },
        event_data: { event_source_url: "https://autopilot.app/test" },
      }],
    });
    res.json({ success: true, message: "Test event sent to Spotify CAPI ✓", result });
  } catch (err: any) {
    req.log.error({ err }, "Spotify CAPI test failed");
    res.status(502).json({ error: err.message });
  }
});

// GET /api/spotify-capi/status — check if configured
router.get("/status", async (_req, res) => {
  const token        = await getSetting("spotifyCapiToken");
  const connectionId = await getSetting("spotifyCapiConnectionId");
  res.json({ configured: !!(token && connectionId) });
});

export default router;
