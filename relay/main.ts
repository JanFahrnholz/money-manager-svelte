const kv = await Deno.openKv();
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RATE_LIMIT = 100;
const PORT = parseInt(Deno.env.get("PORT") || "8090");

const rateLimits = new Map<string, { count: number; reset: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.reset) {
    rateLimits.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (!checkRate(ip)) {
    return new Response("Rate limit exceeded", { status: 429, headers: cors });
  }

  if (req.method === "PUT" && url.pathname === "/messages") {
    const body = await req.json();
    const { pairId, sender, payload } = body;
    if (!pairId || !sender || !payload) {
      return new Response("Missing fields", { status: 400, headers: cors });
    }
    const id = crypto.randomUUID();
    const created = new Date().toISOString();
    await kv.set(["messages", pairId, id], { id, pairId, sender, payload, created }, { expireIn: TTL_MS });
    return Response.json({ id, created }, { headers: cors });
  }

  if (req.method === "GET" && url.pathname === "/messages") {
    const pairId = url.searchParams.get("pair");
    const exclude = url.searchParams.get("exclude");
    if (!pairId) {
      return new Response("Missing pair param", { status: 400, headers: cors });
    }
    const messages: unknown[] = [];
    for await (const entry of kv.list({ prefix: ["messages", pairId] })) {
      const msg = entry.value as Record<string, unknown>;
      if (exclude && msg.sender === exclude) continue;
      messages.push(msg);
    }
    (messages as { created: string }[]).sort((a, b) => a.created.localeCompare(b.created));
    return Response.json(messages, { headers: cors });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/messages/")) {
    const id = url.pathname.split("/")[2];
    const pairId = url.searchParams.get("pair");
    if (!id || !pairId) {
      return new Response("Missing id or pair", { status: 400, headers: cors });
    }
    await kv.delete(["messages", pairId, id]);
    return new Response("OK", { headers: cors });
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return Response.json({ status: "ok" }, { headers: cors });
  }

  return new Response("Not found", { status: 404, headers: cors });
});
