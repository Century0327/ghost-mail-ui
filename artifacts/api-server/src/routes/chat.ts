import { Router } from "express";

const router = Router();

const MAX_LENGTH = 120;

const BURST_WINDOW_MS = 3_000;
const BURST_MAX = 2;
const SUSTAINED_WINDOW_MS = 60_000;
const SUSTAINED_MAX = 15;

const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const stamps = (hits.get(ip) ?? []).filter((t) => now - t < SUSTAINED_WINDOW_MS);
  const burst = stamps.filter((t) => now - t < BURST_WINDOW_MS);
  const limited = burst.length >= BURST_MAX || stamps.length >= SUSTAINED_MAX;
  if (!limited) {
    stamps.push(now);
    hits.set(ip, stamps);
  }
  if (hits.size > 5_000) {
    for (const [key, value] of hits) {
      if (value.every((t) => now - t >= SUSTAINED_WINDOW_MS)) hits.delete(key);
    }
  }
  return limited;
}

router.post("/chat/moderate", async (req, res) => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] as string ||
    req.socket?.remoteAddress ||
    "unknown";

  if (rateLimited(ip)) {
    res.status(429).json({ ok: false, reason: "rate_limited" });
    return;
  }

  const { text, kind: kindRaw } = req.body ?? {};

  if (typeof text !== "string") {
    res.status(400).json({ ok: false, reason: "bad_request" });
    return;
  }

  const kind: "chat" | "name" = kindRaw === "name" ? "name" : "chat";

  let clean: string;
  if (kind === "name") {
    clean = text
      .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\ufeff]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 18);
  } else {
    clean = text.trim().slice(0, MAX_LENGTH);
  }

  if (!clean) {
    res.status(400).json({ ok: false, reason: "bad_request" });
    return;
  }

  res.json({ ok: true, text: clean });
});

export default router;
