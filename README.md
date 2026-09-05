# SpotiDex

> **SpotiDex — a pixel-art Spotify now-playing companion**

A retro hi-fi pixel-art Spotify desktop player and streaming companion featuring spinning vinyl records, dynamic album palette extraction, responsive audio visualizers, synchronized lyrics, queue management, and an OBS-ready overlay mode.

<!-- add screenshots here -->

---

## Features

- **Live Now-Playing Display**: Pixel-art turntable featuring a spinning vinyl record, moving tonearm, and smooth local progress ticker.
- **Album-Art Dynamic Theming**: Real-time palette extraction dynamically shifts ambient accents and highlights to match current album artwork.
- **Stylized Audio Visualizer**: Chunky, responsive frequency visualizer dancing in sync with track playback.
- **Full Hardware Playback Controls**: Interactive deck with play/pause, next/previous, shuffle, repeat mode cycling, continuous volume slider, and live device switching.
- **Interactive Queue View**: 3D carousel and list view of upcoming queued songs with direct click-to-play support.
- **Locally-Tracked Listening History**: Persistent playback log stored locally in the browser, showing recent tracks with one-click replay.
- **Synced & Plain Lyrics**: Real-time line-by-line synced lyrics highlighting and plain lyrics fallback powered by the community.
- **OBS Studio Overlay Mode**: Transparent, low-overhead overlay mode (`?obs=true`) designed specifically for stream setups.

---

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Spotify Integration**: Spotify Web API via client-side **PKCE OAuth Authorization Code Flow** (no backend server or client secret required)
- **Palette Extraction**: [`node-vibrant`](https://github.com/Vibrant-Colors/node-vibrant) for extracting dynamic color swatches from album art
- **Lyrics Provider**: [LRCLIB](https://lrclib.net/) (public, community-maintained lyrics API)
- **Styling**: Handcrafted retro pixel CSS design system with custom scanlines, LCD badges, and CRT effects

---

## Getting Started

Follow these steps to run SpotiDex locally:

### 1. Create a Spotify Developer App
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in with your Spotify account.
2. Click **Create app**.
3. Fill in the App name (e.g. `SpotiDex`) and description.
4. Set **Redirect URI** to:
   ```
   http://127.0.0.1:5173/callback
   ```
   *(Ensure you use `127.0.0.1` and NOT `localhost`, as Spotify's OAuth flow strictly matches URIs).*
5. Check **Web API** under "Which API/SDKs are you planning to use?" and save.
6. Under app settings, copy your **Client ID**.

### 2. Configure Environment Variables
Create a `.env` file in the root directory (you can copy `.env.example`):

```bash
cp .env.example .env
```

Set your Client ID and redirect URI:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
```

### 3. Install & Run
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open `http://127.0.0.1:5173` in your browser and click **CONNECT SPOTIFY** to begin!

---

## OBS Studio Overlay Setup

SpotiDex includes a native overlay mode designed specifically for OBS Studio (and Streamlabs) browser sources, allowing you to embed a transparent vinyl widget directly into your stream.

### ⚠️ Important: First-Time Authentication
> **OAuth redirects do NOT work reliably inside OBS Studio's internal browser source.**
> 
> You **must** authenticate once in your primary web browser (Chrome, Edge, Firefox, Brave, etc.) before adding the overlay to OBS:
> 1. Open `http://127.0.0.1:5173` in your normal web browser.
> 2. Click **CONNECT SPOTIFY** and authorize access.
> 3. Start playing any song on Spotify to verify your connection.
> 4. Once connected, your credentials are saved in your browser storage. You can now add the OBS Browser Source.

### Adding to OBS Studio
1. In OBS Studio, go to your **Sources** dock, click **`+`**, and choose **Browser**.
2. Name the source (e.g., `SpotiDex Overlay`).
3. Set the **URL** to:
   ```
   http://127.0.0.1:5173/?obs=true
   ```
4. Set dimensions:
   - **Width**: `760` (or `800`)
   - **Height**: `400`
5. Keep OBS default Custom CSS (`body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }`).
6. Click **OK**.

### Overlay URL Options
- **Minimal Transparent Overlay (Passive)**:
  ```
  http://127.0.0.1:5173/?obs=true
  ```
  Renders the spinning vinyl record, tonearm, track information, progress bar, and audio visualizer with a 100% transparent background.
- **Overlay with Control Strip**:
  ```
  http://127.0.0.1:5173/?obs=true&controls=true
  ```
  Renders the player along with interactive playback controls and tab toggles.

---

## Known Limitations

- **No "Save to Library" (Heart) Button**: Spotify now requires enterprise-level *Extended Quota* approval for the library write scope (`user-library-modify`). Because personal developer apps are restricted at the platform level, this feature cannot be supported.
- **Locally-Tracked Listening History**: Rather than relying on Spotify's inconsistent recently-played endpoint, SpotiDex builds an audio log locally in your browser storage. As a result, history only reflects tracks played while SpotiDex is open.
- **Lyrics Availability**: Lyrics are fetched from the free, community-maintained [LRCLIB](https://lrclib.net/) database. While coverage is extensive for mainstream releases, indie tracks, rare singles, or instrumentals may not have synchronized lyrics available.

---

## License

MIT License. Feel free to fork and customize!
