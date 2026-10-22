# Q Bank — agent & contributor guide

Expo SDK 57 (React Native 0.86, React 19.2, New Architecture, React Compiler) app, Android-first, built locally (no EAS cloud).

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS or React Native API:

1. Read the major version of `expo` in `package.json` (currently 57).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v57.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt and follow its links; never answer from memory.

Same for libraries with recent majors: ky 2 (hooks take `({ request })`, `baseUrl`), zod 4, MMKV 4 (`createMMKV`, `.remove()`), HeroUI Native 1, Uniwind (Tailwind v4), TypeScript 6 (`types` defaults to `[]`), Testing Library 14 (`await render(...)`, `await fireEvent.press(...)`).

## Commands

```bash
npx expo install <pkg>   # ALWAYS instead of npm install — picks SDK-compatible versions
npm start                # Metro for the dev client
npm run devtools         # Metro + Rozenite DevTools panels (press j)
npm run android          # build + install debug dev client on device/emulator
npm run build:apk        # release APK → android/app/build/outputs/apk/release/
npm run check            # typecheck + lint + test — run before declaring work done
```

If `expo install` times out reaching the Expo API, prefix it with `EXPO_OFFLINE=1`
(it then resolves versions from the local `expo/bundledNativeModules.json`).

## Layout

- `src/app/` — Expo Router routes ONLY (every file is a route). Route files render a screen from `src/screens/`.
- `src/screens/<name>/` — screen bodies + their private components.
- `src/components/ui/` — design system: re-exports `heroui-native` + shared views. App code imports UI from `@/components/ui`, never from `heroui-native` directly.
- `src/api/` — ky client, zod schemas, query options and hooks per resource. All query keys in `query-keys.ts`.
- `src/stores/` — zustand stores (client state only). Server data belongs in TanStack Query, not zustand.
- `src/attempt-engine/` — sectioned attempts played on the device (pure, tested): events + reducer (`reducer.ts`), section clock on `performance.now()` (`section-clock.ts`), MMKV keys (`local-store.ts`). `src/stores/attempt-sessions.ts` holds the live sessions; `src/api/attempt-sync.ts` uploads them in the background (`POST /attempts/:id/sync`). The device is the source of truth while such an attempt is open: never measure time with `Date.now()` differences, and record every user action through `dispatchAttempt`.
- `src/vocab/` — vocabulary notes (pure, tested): term keys and word tokens (`term.ts`, the same code as the server's `src/modules/vocab/term.ts`), the matcher that finds noted terms in text (`matcher.ts`), merge rules with the server (`merge.ts`), per-user storage keys (`local-store.ts`). `src/stores/vocab-store.ts` holds the signed-in user's notes (offline-first, user id read from the access token); `src/api/vocab-sync.ts` syncs them in the background (`POST /vocab/sync`). Change notes only through the store's functions (`noteTerm`, `deleteVocabNote`, …), never through TanStack Query.
- `src/sync/coordinator.ts` — the only place that follows the signed-in user: it loads their data everywhere it is kept (`activate*User`; every store keeps each user under their own keys: `u:<userId>:attempt:*`, `u:<userId>:legacy-outbox`, `u:<userId>:sync-status`, `user-state:<userId>:*`, `vocab:<userId>:*`, so accounts never mix on a device), syncs everything on sign-in / foreground / connection back, and polls `GET /me/sync-status` every 20 s while the app is open to sync what another device changed. Logout first calls `flushBeforeSignOut()`; what could not be sent waits for the user to sign in again. `src/sync/account-settings.ts` brings the synced account settings into `settings-store.ts`.
- `src/user-state/` — practice answers and account settings (language, daily goal, reminder) as `PRACTICE` / `SETTING` items (pure, tested: `merge.ts`, `local-store.ts`, `practice.ts`). `src/stores/user-state-store.ts` holds them offline-first; `src/api/user-state-sync.ts` syncs them (`POST /me/sync`). Change them only through the store's functions (`savePracticeAnswer`, the settings setters…).
- `src/api/legacy-outbox.ts` — LEGACY answers are kept on the device and sent at once (again when the connection returns); never call `PATCH /answers` directly.
- `src/components/vocab/` — the vocabulary layer of question screens: `VocabScope` (mount it on a screen to underline noted terms and allow note mode; it hosts the `TermTooltip`), `VocabText` (nested RN `Text`, used by `Paragraphs`/`AnswerView` when given a `vocabId`), `NoteToggle` + `NoteModeHint`, `NoteSelectionBar` (wraps the screen's ActionBar). UI state lives in the non-persisted `vocab-ui-store.ts` (a store, not a context: the tooltip renders in a HeroUI `Portal`). Noting words is never an attempt action (no `dispatchAttempt`).
- `src/providers/` — app-wide providers, query client, settings sync, DevTools.
- `src/i18n/locales/{vi,en}.json` — add every new string to both files; keys are type-checked (`locales.test.ts` checks that `en` has the same keys).
- Shared with the web app (`../web_b_bank`, same paths under `src/`): `api/*`, `attempt-engine/*`, `vocab/*`, `user-state/*`, `sync/*` (except their platform listeners), `stores/vocab-store.ts`, `stores/user-state-store.ts`, `stores/attempt-sessions.ts`, `stores/sync-status-store.ts`, `utils/*` and the locale files (merge keys; the web has a few of its own). Change both sides together.
- `plugins/` — local config plugins. `android/` is generated by `expo prebuild` and gitignored: never edit it by hand, change `app.config.ts` or a plugin instead.

## Rules

- State: server data → TanStack Query; UI/client state that must survive restarts → zustand + `persist` (MMKV); secrets/tokens → `expo-secure-store`. Read zustand with one selector per value: `useSettingsStore((s) => s.theme)`.
- API: validate every response with a zod schema: `api.get('x').json(XSchema)`. Show errors with `describeError(error, t)`; branch on the server's stable code with `toApiError(error).serverCode` (e.g. `ATTEMPT_EXPIRED`).
- Backend: Q Bank API (`../back_q_bank`). `EXPO_PUBLIC_API_URL` includes `/api/v1` (env.ts appends the trailing `/` ky needs). The client refreshes an expired access token once and replays the request (`src/api/client.ts`); keep `retry: { limit: 1, methods: [] }`, it is what allows that replay. Shapes of server responses live next to their hooks in `src/api/<resource>.ts`.
- Styling: Uniwind `className` with HeroUI tokens (`bg-background`, `text-foreground`, `text-muted`, `bg-accent`…). No hard-coded colors; use `useThemeColor('token')` when a prop needs a raw color.
- Lists: `FlashList`, never `ScrollView` + `map` for data. List items take primitive props and do no fetching.
- Rendering: never `{value && <X/>}` with a possibly falsy number/string — use a ternary (lint enforced).
- Animation: Reanimated, animate `transform`/`opacity` only; use `.get()`/`.set()` on shared values (React Compiler).
- React Compiler is on: no manual `useMemo`/`useCallback`/`memo`; destructure hook results early (`const { push } = useRouter()`).
- Tests sit next to the file: `foo.ts` + `foo.test.ts`.
