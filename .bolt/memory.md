# Project memory

## Product intent & audience

- Tactical coaching app for a 5v5 shooter (Valorant-like): AI Coach gives round-by-round strategy on a Live Match page.
- Target users are on mobile networks; reliability and fast load matter more than fancy AI responses.
- Core features: 2D map with callout coordinates, per-agent commands for 5 agents, side (attack/defense) and round-tag (retake, eco, etc.) selection.

## Brand personality & voice

- Assistant communicates in Thai.
- Practical, reliability-first tone; prioritizes working over perfect.

## Visual design & UX direction

- 2D tactical map displays agent positions via X,Y callout coordinates.
- Per-agent command boxes, one per role.
- Yellow "Offline Tactical Mode" badge shown on map and command box when fallback is active.
- Avoid red error boxes; failures degrade silently to local fallback data.
- Fast initial render on mobile; avoid heavy SDK bundles on critical pages.

## Decisions, constraints & rationale

- Framework: Vite + React.
- AI Coach page no longer imports `@google/genai`; calls Gemini REST directly via `fetch` to reduce bundle size and speed up mobile load.
- Endpoint uses full domain `generativelanguage.googleapis.com` (not bare `googleapis.com`, which is not callable).
- API key via `VITE_GEMINI_API_KEY`; model referenced as `gemini-3.8-flash`.
- `AbortController` attached directly to `fetch` with 8-second timeout; replaced previous 60-second hang.
- Smart Fallback: on API failure or timeout, generate local advice in <0.1s from in-code database — per-agent commands by role (Duelist entry, Controller smoke, Sentinel hold, etc.), X,Y from real callouts matching selected side and tag.
- Fallback adapts wording to selected tag (retake, eco, etc.) and side (attack/defense).
- Changes passed type-check and build.

## Open questions & assumptions

- Model name `gemini-3.8-flash` may be non-standard; verify against available Gemini model identifiers.
- Exact REST endpoint path and request/response schema not yet captured; confirm format if further edits needed.
- Local fallback callout database is hardcoded; future map/agent updates will need manual sync.