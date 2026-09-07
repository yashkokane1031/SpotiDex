---
type: "query"
date: "2026-09-07T13:39:25.578877+00:00"
question: "create a Spotify playlist from current queue"
contributor: "graphify"
outcome: "useful"
source_nodes: ["useAuth()", "getQueue()", "useQueue()", "QueueCarousel()", "useLibrary()", "getCurrentUserId()"]
---

# Q: create a Spotify playlist from current queue

## Answer

Expanded from original query via vocab: auth, spotify, playlist, playlists, queue, user, token, library, tracks. Traversed AuthContext, spotifyAuth, spotifyApi, useQueue, useLibrary, QueueCarousel. Requires playlist-modify scopes in spotifyAuth.js, new createPlaylist and addTracksToPlaylist API helpers in spotifyApi.js, queue integration in useQueue or dedicated hook, and UI trigger in QueueCarousel.

## Outcome

- Signal: useful

## Source Nodes

- useAuth()
- getQueue()
- useQueue()
- QueueCarousel()
- useLibrary()
- getCurrentUserId()