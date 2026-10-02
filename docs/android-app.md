# Android app

MoonCellar ships as an installable PWA and as an Android APK published in the GitHub releases of
`alexgrist14/MoonCellar`. The APK is a Trusted Web Activity (TWA): a thin Android shell, generated
by [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap), that opens `mooncellar.space` full
screen in Chrome. Content ships with the website; a new APK is needed only when the shell changes
(name, icons, colours, shortcuts, `targetSdk`).

## Pieces

| Piece | Where | What it does |
| ----- | ----- | ------------ |
| Web app manifest | `apps/web/src/app/manifest.ts`, served as `/manifest.webmanifest` | Name, colours, icons and shortcuts for installing the site |
| Icons | `apps/web/public/images/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | `logo-icon.png` placed on a square; the maskable one sits on `--color-bg-primary` inside the safe zone |
| Theme colour | `viewport` export in `apps/web/src/app/layout.tsx` | Colours the status bar of the installed app |
| Service worker | `apps/web/public/worker.js`, registered from `apps/web/src/app/providers.tsx` | Push notifications and the offline fallback |
| Offline page | `apps/web/public/offline.html` | Static page served by the worker when a navigation fails |
| TWA config | `apps/android/twa-manifest.json` | Everything Bubblewrap generates the Android project from |
| Asset Links | `apps/web/public/.well-known/assetlinks.json` | Proves the app and the site belong together; without it the app shows an address bar |
| Release notes | `apps/android/RELEASE.md` | Text of every GitHub release; CI appends the APK's SHA-256 |
| Build | `.github/workflows/android.yml` | Builds, signs and publishes the APK on an `android-v*` tag |

Only `twa-manifest.json`, `RELEASE.md` and `.gitignore` are committed in `apps/android`; the Gradle
project is regenerated from `twa-manifest.json` on every build.

## Offline fallback

The worker answers only page navigations (`request.mode === "navigate"`), with navigation preload
on so the worker's start-up does not delay the page. When the network fails it serves
`offline.html` from the `offline-v1` cache, filled at install with the page and `logo-icon.png`.
The page is plain HTML with inline styles, because a Next page needs its JS and CSS chunks, which
are not cached. Rename the cache when `offline.html` changes, or installed workers keep the old
copy.

## Signing key (once)

The key is the app's identity: an update signed with a different key does not install over the
old app. Keep it out of the repository, in a password manager and a backup.

```sh
keytool -genkeypair -v -keystore android.keystore -alias mooncellar \
  -keyalg RSA -keysize 2048 -validity 10000
keytool -list -v -keystore android.keystore -alias mooncellar
```

The alias must stay `mooncellar` (`signingKey.alias` in `twa-manifest.json`). Repository secrets
for the workflow:

| Secret | Value |
| ------ | ----- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 android.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_PASSWORD` | Key password |

Then publish the key's SHA-256 (`keytool -list` prints it as `SHA256:`) in
`apps/web/public/.well-known/assetlinks.json` and deploy the site:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "space.mooncellar.app",
      "sha256_cert_fingerprints": ["AA:BB:…"]
    }
  }
]
```

Also add it to `fingerprints` in `twa-manifest.json`. If the app ever goes to Google Play, Play
re-signs it with its own key: add that fingerprint (Play Console → App integrity) next to ours,
and keep both.

## Releasing a version

1. Raise `appVersionCode` by one and set `appVersion` in `apps/android/twa-manifest.json`.
   Android refuses an update whose version code is not higher.
2. Deploy the site first if the manifest or icons changed: the build downloads the icons and the
   web manifest from `mooncellar.space`.
3. Push a tag that matches `appVersion`:

   ```sh
   git tag android-v1.0.1 && git push origin android-v1.0.1
   ```

The workflow fails when the tag and `appVersion` differ. It regenerates the project with
`bubblewrap update --skipVersionUpgrade`, builds with `bubblewrap build --skipPwaValidation`
(passwords come from the environment, so nothing prompts), and creates the release with
`mooncellar.apk`. The file name never changes, so
`https://github.com/alexgrist14/MoonCellar/releases/latest/download/mooncellar.apk` always points
at the newest build. `workflow_dispatch` builds the APK as a run artifact without a release.

`ci.yml` listens to branch pushes only, so a release tag does not redeploy the site.

## Testing a build

```sh
adb install -r mooncellar.apk
```

- No address bar at the top: Asset Links are verified. An address bar means the fingerprint in
  `assetlinks.json` does not match the signing key, or the file is not served as JSON without a
  redirect.
- The session survives a restart (the app shares Chrome's cookies with the browser).
- Push notifications arrive; Android 13+ asks for the permission once.
- Links to other sites (Steam, YouTube) open in a Custom Tab.

## Requirements to watch

- **`targetSdk`.** Bubblewrap 1.25 targets API 36. Google Play raises its minimum every August;
  bump `BUBBLEWRAP_VERSION` in the workflow when a newer Bubblewrap targets a newer API.
- **Android developer verification.** From 30 September 2026 in Brazil, Indonesia, Singapore and
  Thailand, and worldwide in 2027, certified devices install apps outside Google Play only from
  verified developers; anything else needs ADB or the advanced install flow. Register the
  developer and `space.mooncellar.app` with this signing key in the Android Developer Console
  before the global rollout.
