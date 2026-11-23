# Frequency Atlas: Live Source Expansion Prompt

Copy everything below the line into a new session. Attach or link the current `sources.json` so the model knows what is already in the catalogue.

---

You are helping expand **The Frequency Atlas**, a curated web observatory of unusual radio hosted on GitHub Pages (`nickcarbone/frequency-atlas`). This round is **live broadcasts only**. I want truly niche, interesting stations and transmissions that most people would never find, and every one must play inside the Atlas's own audio player.

I'm a journalist. Accuracy and sourcing matter more than volume. Never invent a station, stream URL, frequency, schedule, location or fact. If you can't verify something, leave it out and say so. Ask clarifying questions before you start if anything here is ambiguous.

## 1. What counts as a candidate

A source qualifies only if **all** of these hold:

- **Live and continuous.** It's on air now, not a podcast, recording or on-demand file. Note any regular off-air hours.
- **HTTPS.** The Atlas runs on HTTPS, and browsers silently block HTTP audio on an HTTPS page. An HTTP-only stream is disqualified, even if it's wonderful.
- **Direct audio.** An Icecast or Shoutcast stream (MP3, AAC or Ogg), or an HLS playlist (`.m3u8`). Web players, iframes, apps and pages that wrap the stream don't count.
- **HLS needs CORS for desktop.** iPhone Safari plays HLS natively. Desktop Chrome plays it through hls.js, which needs `Access-Control-Allow-Origin` on both the playlist and its segments. Send an `Origin` header when you check, because many CDNs only return the CORS header when one is present.
- **No sign-in, token or paywall.** URLs with expiring tokens (signed query strings that change per session) are disqualified because they break within hours.
- **Allowed to be played elsewhere.** Exclude services whose terms forbid third-party use:
  - LiveATC's homepage states that third-party use of its live streams is prohibited.
  - Broadcastify has retired its embedded player, and its fixed stream URLs need a paid Premium account.

  Volunteer relays of public broadcasts (for example NOAA Weather Radio relays) are acceptable when the relay presents itself as a public listening service. Name the relay in the credit.
- **Not available only through a web SDR.** KiwiSDR and WebSDR receivers can't feed an external audio element, so they're out of scope for live entries.

## 2. What counts as niche

Score each candidate 1–5 on each axis and explain the score in one line:

- **Rarity:** how hard it would be for a curious listener to find on their own. Big national networks score low unless the specific service is unusual (for example a polar or Indigenous-language service).
- **Place:** remoteness or significance of where it comes from (polar regions, small islands, contested borders, research stations, forces postings).
- **Purpose:** functional and utility broadcasting (weather, maritime, time, navigation, forces, emergency, Morse, science) and transmission art score higher than general entertainment.
- **Sound:** whether the audio itself is unusual (synthetic voices, tones, data, hydrophones, natural radio, minority languages, field sound).
- **Story:** whether there is a fascinating, verifiable reason it exists.

Only propose candidates with a total of 15 or more out of 25. Prefer breadth: new countries, new languages and new kinds of signal over more of what's already in the catalogue.

## 3. Where to look (run these as experiments)

I want to learn which discovery methods produce the best yield. Try each method separately and report how many candidates it found, how many passed verification, and the best example. Methods to test:

1. **Radio Browser API** (`https://de1.api.radio-browser.info`), free and keyless. Filter with `is_https=true` and `hidebroken=true`. Sort by **ascending** click count to surface the obscure. Search by tag (shortwave, weather, maritime, military, ham radio, sound art, experimental, field recordings, indigenous, community, university), by remote country codes (GL, FO, SJ, FK, SH, PN, TV, KI, NR, MH, AQ and similar) and by language.
2. **Broadcasters' own "listen live" pages.** Read the page source for the direct stream URL. Prefer the broadcaster's own CDN URL over one resolved through an aggregator.
3. **Streaming-host patterns used by art and community radio**, such as airtime.pro, radio.co, radiocult.fm and streamguys. Find stations through their own sites, then confirm the stream.
4. **Thematic hunts:**
   - Indigenous and minority-language public services (Sámi, Inuit, Greenlandic, Aboriginal Australian, Māori, Pacific)
   - forces broadcasters
   - weather and maritime relays
   - live hydrophone and nature-sound streams (for example Orcasound)
   - live natural VLF radio
   - religious and international broadcasters with shortwave heritage
   - university and student stations in unusual places
   - transmission art stations
5. **Directories:** the Icecast directory (`dir.xiph.org`) searched by keyword and genre.

Log every method you tried, including the ones that found nothing.

## 4. Verification protocol (mandatory for every candidate)

Run these checks and report the raw results:

1. **Fetch the start of the stream.** Download the first ~200 KB. For a live stream, accept partial content and don't wait for it to end. Record the HTTP status, `Content-Type`, final URL after redirects, and whether `Access-Control-Allow-Origin` comes back when an `Origin` header is sent.
2. **Decode it.** Run `ffprobe` on the bytes and record the codec, sample rate and channels. For HLS, fetch the playlist, follow any variant playlist, fetch one segment and decode that.
3. **Play it in a real browser.** Use headless Chrome or my connected Chrome. Create an audio element (hls.js for HLS on Chrome), play for at least 8 seconds, and confirm `currentTime` advances with no `error`. Watch for silence or a looping "station offline" message.
4. **Recheck later.** Repeat the fetch at a different time of day, ideally 6–12 hours later, to catch overnight shutdowns and rotating URLs.
5. **Check ports.** Note any non-443 port (such as `:8000` or `:8443`). These often fail behind corporate networks and proxies, so flag them as a risk, and only include them if they pass every check from more than one network.
6. **Check geo-blocking.** Note whether the stream is geo-restricted (test from the US). Exclude it if it doesn't play from the US.

Anything that fails a step is rejected. Keep the rejection and its reason, because I want to learn from the failures.

## 5. Editorial rules

- **Frequency:** include one only if the broadcaster, a regulator (FCC, Ofcom, CRTC, ITU and so on) or a reliable reference publishes it for that transmitter. Otherwise give only the band (VLF, LW, MW, SW, VHF) or leave it empty. Never estimate.
- **Location:** give coordinates at city level for the studio or transmitter, and say which in `geoNote`. If an attribution is contested, say so.
- **Blurb:** two or three sentences on what it is, why it exists and where it comes from, in plain British English. Avoid niche vocabulary. No "not X but Y" constructions, and no reflexive lists of three.
- **What you're hearing:** one or two sentences describing what a listener will actually hear, based on your own playback.
- **Citations:** cite the source for every factual claim in your working notes, with a link for each.

## 6. Output format

Return four things:

1. **Experiment report:** a table of discovery method → candidates found → passed → pass rate → best find, plus a short note on what worked and why.
2. **Accepted candidates:** a table with name, place, language, frequency (if published), niche score breakdown, stream URL, format, CORS status, port, checks passed, and source links.
3. **Ready-to-paste JSON:** one object per accepted source in the exact `sources.json` schema:

   ```
   id, title, kind ("live" for on-air simulcasts | "stream" for internet-only),
   cat (international | maritime | weather | utility | aviation | military |
        numbers | amateur | scientific | art | field | archive),
   place, country, region (Arctic | Europe | North America | Caribbean |
        South Atlantic | Asia | Pacific | Antarctica | Africa | Middle East |
        South America | Online), lat, lon, tz (IANA), geoNote (optional),
   lang, freq (optional, e.g. "1230 kHz"), band (optional), mode (optional),
   character (array from: voice, music, tone, data, synthetic, noise, nature,
        texture, experimental, collage, coded, scheduled, continuous),
   schedule (optional {tz, times[], label}), url,
   fmt ("mp3" | "aac" | "hls"), credit, licence ("Broadcaster stream" or the
        stated terms), src (official page), collections (array of existing
        collection ids or a proposed new one), blurb, hear
   ```

   Add any new `region` or `collections` values to the lists above.
4. **Rejected candidates:** a table with name, URL tried, the step it failed and the exact reason.

If fewer than 10 candidates pass, say so plainly. Don't lower the bar to reach a number.
