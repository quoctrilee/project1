# VKU Field Survey

Offline-first campus inspection app for recording room equipment with notes, photos and device location.

## Architecture

```text
PWA / Capacitor APK -> Service Worker (cache-first)
                    -> IndexedDB (idb: drafts + surveys)
                    -> Sync queue (PENDING_SYNC)
                    -> Cloudflare Worker API -> SYNCED
```

## Stack and features

- HTML5, TypeScript, Vite, Service Worker API and IndexedDB through `idb`
- Cloudflare Pages frontend and Cloudflare Workers API
- Multi-step location, category, 1-5 rating, notes and photo form
- Draft autosave and offline submission with UUID, timestamp and location
- Background Sync tag `sync-surveys`, `window.ononline`, and Capacitor Network listener
- Capacitor Camera, Network and Geolocation; location denial does not block submit
- Android debug and signed release APK support

## Local development

```sh
npm install
npm run typecheck
npm run dev
```

Update `frontend/src/sync-queue.ts` `API_URL` with the deployed Worker URL before a real sync test. The browser app uses `navigator.onLine` only as its web fallback; native builds use Capacitor Network.

## Deploy

```sh
npm run deploy:worker
npm run deploy:pages
```

Cloudflare login is required (`npx wrangler login`). Pages supplies HTTPS, required for Service Worker operation.

## Android APK

```sh
npm run build
npx cap add android
npx cap sync android
cd android
gradlew.bat assembleDebug
gradlew.bat assembleRelease
```

For release signing, create a keystore, add `android/keystore.properties` with `storeFile`, `storePassword`, `keyAlias`, and `keyPassword`, and configure the release signing block in `android/app/build.gradle`. Never commit the keystore or passwords. Grant Camera, Internet, Network State, Coarse Location and Fine Location permissions. If location is denied, coordinates are stored as `null` and the survey still submits.

## Offline test

Load once, enable airplane mode, submit several surveys, then restore connectivity. Confirm `PENDING_SYNC` changes to `SYNCED` and inspect Worker logs with `npx wrangler tail`. Background Sync is fully supported primarily in Chromium; the online event and native Network listener provide additional triggers on other environments.

## Submission checklist

- Live Demo URL: deploy with `npm run deploy:pages` and record the generated HTTPS URL.
- GitHub: publish this repository publicly with feature commits.
- Technical report: complete [docs/technical-report.md](docs/technical-report.md) with screenshots from the deployed PWA and signed APK.