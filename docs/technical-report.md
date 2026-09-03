# VKU Field Survey: Technical Report

## Feature checklist

| Requirement | Status | Implementation |
|---|---|---|
| Standalone PWA | Complete | Manifest, theme `#0284c7`, cache-first Service Worker |
| Offline form and persistence | Complete | Four steps, `idb` stores drafts and surveys |
| Sync queue | Complete | UUID, timestamp, `PENDING_SYNC`, sequential POST dispatch |
| Automatic sync | Complete | `window.ononline`, Background Sync `sync-surveys`, Capacitor Network |
| Native app | Configured | Camera, Network, Geolocation plugins and Android build instructions |

## Architecture and data flow

The form autosaves to the `drafts` object store after input. Submit creates a UUID-keyed survey with a timestamp, status and optional GPS coordinates. The Service Worker caches the app shell for offline startup. Pending records are posted sequentially to the Worker. A successful response changes the record to `SYNCED`; network errors leave it pending.

## Evidence to attach

Capture screenshots of steps A, B, C and D; queue states `PENDING_SYNC` and `SYNCED`; activated Service Worker; manifest theme/icons; registered `sync-surveys` tag; signed release APK running on a device; and `apksigner verify --print-certs` output. Add the two-to-three-minute demo video URL and final Pages URL here.

## Limitations and risks

Background Sync is not consistently available outside Chromium. The app keeps the required Background Sync implementation while also listening for `window.ononline` and Capacitor Network changes. GPS may be unavailable indoors or denied; submission remains valid and stores null coordinates. Cloudflare Worker persistence beyond request logging would require adding a durable storage binding if long-term server-side records are required.