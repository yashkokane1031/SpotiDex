# Graph Report - SpotiDex  (2026-09-07)

## Corpus Check
- 49 files · ~111,825 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 250 nodes · 485 edges · 19 communities (14 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0307d783`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- package.json
- react
- extractPalette.js
- spotifyApi.js
- DepthCarousel.jsx
- useDex.js
- LibraryPanel.jsx
- 💽 SpotiDex
- AudioVisualizer.jsx
- lyricsApi.js
- Q: Trace the complete authentication flow: Spotify login -> PKCE code generation -> Spotify authorization -> callback -> access token/session -> authenticated application state.
- .oxlintrc.json
- Synced Lyrics UI Screenshot
- Now Playing View UI Screenshot
- Playlists Grid UI Screenshot
- Playlists Tracklist UI Screenshot
- Recently Played History UI Screenshot
- Q: create a Spotify playlist from current queue

## God Nodes (most connected - your core abstractions)
1. `react` - 29 edges
2. `useAuth()` - 20 edges
3. `💽 SpotiDex` - 17 edges
4. `usePlaybackControls()` - 13 edges
5. `NowPlayingView()` - 11 edges
6. `extractPalette()` - 11 edges
7. `controlRequest()` - 11 edges
8. `refreshAccessToken()` - 11 edges
9. `✨ What Makes SpotiDex Different?` - 9 edges
10. `ErrorBoundary` - 8 edges

## Surprising Connections (you probably didn't know these)
- `SpotiDex Hero Image` --conceptually_related_to--> `💽 SpotiDex`  [INFERRED]
  src/assets/hero.png → README.md
- `Playing Next Queue Carousel UI Screenshot` --conceptually_related_to--> `QueueCarousel()`  [INFERRED]
  Misc/PlayingNext.png → src/components/QueueCarousel.jsx
- `💽 SpotiDex` --references--> `Application HTML Entrypoint`  [EXTRACTED]
  README.md → index.html
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.jsx → src/context/AuthContext.jsx
- `NowPlayingView()` --calls--> `useDex()`  [EXTRACTED]
  src/App.jsx → src/hooks/useDex.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Dynamic Album Palette Theming Flow** — src_lib_extractpalette_extractpalette, src_context_themecontext_themeprovider, src_context_themecontext_applypalette, src_lib_extractpalette_ensurecontrast [INFERRED 0.85]
- **Client-Side PKCE OAuth Flow** — src_lib_pkce_generatecodeverifier, src_lib_spotifyauth_redirecttospotifyauth, src_context_authcontext_authprovider, src_pages_callback_callback [INFERRED 0.85]
- **Tactile Turntable & Playback Controls Flow** — src_components_vinylrecord_vinylrecord [INFERRED 0.85]

## Communities (19 total, 5 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.07
Nodes (17): App(), ControlModule(), ErrorBoundary, LyricsPanel(), OfflineFallback(), PageFrame(), RecentlyPlayedRail(), ReloadPrompt() (+9 more)

### Community 1 - "package.json"
Cohesion: 0.07
Nodes (30): dependencies, gsap, node-vibrant, react, react-dom, react-router-dom, devDependencies, oxlint (+22 more)

### Community 2 - "react"
Cohesion: 0.12
Nodes (29): react, react-router-dom, NowPlayingView(), AuthContext, AuthProvider(), rehydrate(), STORAGE_KEYS, useAuth() (+21 more)

### Community 3 - "extractPalette.js"
Cohesion: 0.24
Nodes (18): applyPalette(), DEFAULT_PALETTE, ThemeContext, ThemeProvider(), anyAvailableRgb(), contrastRatio(), darken(), ensureContrast() (+10 more)

### Community 4 - "spotifyApi.js"
Cohesion: 0.50
Nodes (11): usePlaybackControls(), controlRequest(), pausePlayback(), playContext(), playTracks(), resumePlayback(), setRepeat(), setShuffle() (+3 more)

### Community 5 - "DepthCarousel.jsx"
Cohesion: 0.25
Nodes (7): Playing Next Queue Carousel UI Screenshot, gsap, clamp(), DEFAULT_ITEMS, DepthCarousel(), normalizeItem(), QueueCarousel()

### Community 6 - "useDex.js"
Cohesion: 0.33
Nodes (9): ArtistDetailModal(), DexPanel(), formatDate(), NewEntryToast(), formatDexNumber(), getRarityTier(), useDex(), getArtistsBatch() (+1 more)

### Community 7 - "LibraryPanel.jsx"
Cohesion: 0.52
Nodes (5): formatDuration(), LibraryPanel(), useLibrary(), getCurrentUserId(), getUserPlaylists()

### Community 8 - "💽 SpotiDex"
Cohesion: 0.06
Nodes (33): Application HTML Entrypoint, 1. Register a Spotify Developer App, 2. Clone & Configure, 📊 36-Band Deterministic Audio Visualizer, 3. Install & Launch, 🎠 3D Depth Queue Carousel & 🎤 Synced Karaoke Lyrics, 🎠 3D Perspective Queue Carousel (With Click-to-Play), *A retro hi-fi pixel-art Spotify companion with dynamic album-art theming.* (+25 more)

### Community 9 - "AudioVisualizer.jsx"
Cohesion: 0.52
Nodes (5): AudioVisualizer(), applyLevels(), tick(), hashString(), mulberry32()

### Community 10 - "lyricsApi.js"
Cohesion: 0.42
Nodes (6): useLyrics(), cleanTrackName(), getLyrics(), safeFetchJson(), shapeResponse(), parseLrc()

### Community 11 - "Q: Trace the complete authentication flow: Spotify login -> PKCE code generation -> Spotify authorization -> callback -> access token/session -> authenticated application state."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trace the complete authentication flow: Spotify login -> PKCE code generation -> Spotify authorization -> callback -> access token/session -> authenticated application state., Source Nodes

### Community 12 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 18 - "Q: create a Spotify playlist from current queue"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: create a Spotify playlist from current queue, Source Nodes

## Knowledge Gaps
- **73 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 89 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.jsx`, `package.json`, `extractPalette.js`, `spotifyApi.js`, `DepthCarousel.jsx`, `useDex.js`, `LibraryPanel.jsx`, `AudioVisualizer.jsx`, `lyricsApi.js`?**
  _High betweenness centrality (0.265) - this node is a cross-community bridge._
- **Why does `💽 SpotiDex` connect `💽 SpotiDex` to `App.jsx`, `react`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `💽 SpotiDex` (e.g. with `App.jsx` and `main.jsx`) actually correct?**
  _`💽 SpotiDex` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06533776301218161 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06653225806451613 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.12195121951219512 - nodes in this community are weakly interconnected._