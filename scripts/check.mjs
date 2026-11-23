// Weekly signal check for The Frequency Atlas.
// Fetches the start of every source and confirms it is audio (or a working HLS playlist with a segment).
// Writes status.json. Runs on GitHub Actions with Node 20+, no dependencies.
import { readFile, writeFile } from "node:fs/promises";

const TIMEOUT = 15000;
const UA = "FrequencyAtlas-check/1.0 (+https://github.com)";

async function grab(url, max = 16384) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: "follow", headers: { "User-Agent": UA, Range: "bytes=0-" + (max - 1), "Icy-MetaData": "0" } });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    let got = 0; const chunks = [];
    if (r.body) {
      const reader = r.body.getReader();
      while (got < max) { const { value, done } = await reader.read(); if (done) break; chunks.push(value); got += value.length; }
      try { await reader.cancel(); } catch {}
    }
    return { status: r.status, ct, bytes: Buffer.concat(chunks.map(c => Buffer.from(c))), url: r.url };
  } finally { clearTimeout(t); }
}

const looksAudio = (b) => {
  if (b.length < 1024) return false;
  const s = b.subarray(0, 4);
  if (s.toString("latin1", 0, 3) === "ID3") return true;           // mp3 with tag
  if (s.toString("latin1", 0, 4) === "OggS") return true;           // ogg
  for (let i = 0; i < Math.min(b.length - 1, 4096); i++) {          // mpeg / adts frame sync
    if (b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0) return true;
  }
  return false;
};

async function checkHls(url, depth = 0) {
  const r = await grab(url, 200000);
  const txt = r.bytes.toString("utf8");
  if (!txt.startsWith("#EXTM3U")) return { ok: false, why: "not a playlist" };
  const lines = txt.split(/\r?\n/).filter(l => l && !l.startsWith("#"));
  if (!lines.length) return { ok: false, why: "empty playlist" };
  const next = new URL(lines[lines.length - 1], r.url).toString();
  if (/\.m3u8(\?|$)/.test(next) && depth < 2) return checkHls(next, depth + 1);
  const seg = await grab(next, 65536);
  return { ok: seg.status < 400 && seg.bytes.length > 1024, why: "segment " + seg.status };
}

const data = JSON.parse(await readFile("sources.json", "utf8"));

// Some sources publish a rotating path (e.g. Orcasound's latest.txt). Resolve it first.
async function resolveUrl(s) {
  if (!s.resolve) return s.url;
  const r = await grab(s.resolve.latest, 256);
  return s.url.replace("{latest}", r.bytes.toString("utf8").trim());
}
// Stations with set broadcast hours may serve nothing outside them.
function inHours(s, d = new Date()) {
  if (!s.onAir) return true;
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: s.onAir.tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(d).split(":").map(Number);
  const n = (h % 24) * 60 + m, hm = t => { const [a, b] = t.split(":").map(Number); return a * 60 + b; };
  const a = hm(s.onAir.from), b = hm(s.onAir.to);
  return a < b ? n >= a && n < b : n >= a || n < b;
}
const results = {};
let i = 0;
async function worker() {
  while (i < data.sources.length) {
    const s = data.sources[i++];
    const t0 = Date.now();
    try {
      let res;
      const url = await resolveUrl(s);
      if (s.fmt === "hls") res = await checkHls(url);
      else {
        const r = await grab(url);
        if (r.status === 401 || r.status === 403 || /sverigesradio\.se\/reserv/.test(r.url)) { res = { ok: null, why: `${r.status}: blocked from the checker's network, not judged` }; results[s.id] = { ok: null, ms: Date.now() - t0, note: res.why }; console.log("SKIP  " + s.id + "  " + res.why); continue; }
        res = { ok: r.status < 400 && (r.ct.startsWith("audio/") || r.ct.includes("mpeg") || r.ct.includes("aac") || r.ct.includes("ogg") || looksAudio(r.bytes)) && r.bytes.length > 1024, why: `${r.status} ${r.ct}` };
      }
      if (!res.ok && !inHours(s)) res = { ok: null, why: "outside broadcast hours: " + res.why };
      results[s.id] = { ok: res.ok, ms: Date.now() - t0, note: res.why };
    } catch (e) {
      results[s.id] = { ok: inHours(s) ? false : null, ms: Date.now() - t0, note: String(e.name || e) };
    }
    console.log((results[s.id].ok ? "OK  " : "FAIL") + "  " + s.id + "  " + results[s.id].note);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
const out = {
  checked: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  method: "Weekly automated check: fetched the start of each source and confirmed audio (HLS: playlist and a segment).",
  results,
};
await writeFile("status.json", JSON.stringify(out, null, 1) + "\n");
const bad = Object.entries(results).filter(([, r]) => r.ok === false).map(([k]) => k);
console.log(`\n${data.sources.length - bad.length}/${data.sources.length} passing${bad.length ? " — failing: " + bad.join(", ") : ""}`);
