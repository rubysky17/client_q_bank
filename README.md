# Q Bank

Boilerplate React Native năm 2026, ưu tiên Android, **build hoàn toàn trên máy local** (không cần EAS hay tài khoản Expo).

| Mảng         | Thư viện                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------- |
| Framework    | Expo SDK 57 · React Native 0.86 · React 19.2 · New Architecture · Hermes · React Compiler |
| Điều hướng   | Expo Router (native stack, `NativeTabs`, typed routes, `Stack.Protected` cho auth)        |
| UI           | HeroUI Native + Uniwind (Tailwind v4), có sẵn dark mode                                   |
| Animation    | Reanimated 4 + Gesture Handler (chạy trên UI thread)                                      |
| Client state | Zustand 5 + `persist` lưu vào MMKV 4 (đồng bộ, không nháy UI khi mở app)                  |
| Server state | TanStack Query 5                                                                          |
| API          | ky 2 + zod 4 (kiểm tra mọi response)                                                      |
| Form         | react-hook-form + zod                                                                     |
| i18n         | i18next (vi / en), key được kiểm tra type                                                 |
| Debug        | React Native DevTools + Rozenite (panel TanStack Query, MMKV)                             |
| Chất lượng   | TypeScript strict, ESLint, Prettier, Jest (jest-expo)                                     |

App kết nối backend **Q Bank API** (`../back_q_bank`, chạy trên Cloudflare Workers):

- Đăng nhập bằng email/mật khẩu (tài khoản duy nhất cấu hình trên server). Access token tự refresh khi hết hạn; refresh token hỏng thì tự đăng xuất.
- **Đề thi**: danh sách đề đã publish → chi tiết đề → bắt đầu hoặc tiếp tục bài đang làm.
- **Làm bài**: đồng hồ đếm ngược theo giờ server, lưu đáp án ngay khi chọn, đánh dấu câu cần xem lại, dải số câu để nhảy nhanh, tự nộp khi hết giờ.
- **Kết quả**: điểm, đạt/chưa đạt, thống kê theo phần, lĩnh vực và độ khó; **xem lại đáp án** kèm giải thích.
- **Lịch sử** làm bài và **Cài đặt** (tài khoản, theme, ngôn ngữ, đăng xuất).

## 1. Chuẩn bị môi trường (chỉ làm một lần)

- **Node** 22.13+ / 24.3+ / 26+, **JDK 17**, **Android Studio** (đã có Android SDK 36, build-tools 36, NDK 27.1).
- Biến môi trường `ANDROID_HOME=~/Library/Android/sdk`, có `platform-tools` trong `PATH` (để dùng `adb`).
- **Thiết bị chạy thử**, chọn một trong hai:
  - Điện thoại Android: bật _Tùy chọn nhà phát triển_ → _Gỡ lỗi USB_, cắm cáp, rồi chạy `adb devices` để kiểm tra máy đã nhận.
  - Máy ảo: Android Studio → _Device Manager_ → _Create Virtual Device_ → Pixel → image **API 36** (arm64-v8a trên Mac Apple Silicon).
- Nên cài thêm `brew install watchman` để Metro theo dõi file nhanh hơn.

```bash
npm install
cp .env.example .env.local   # tùy chọn: trỏ EXPO_PUBLIC_API_URL vào backend local (mặc định: production)
```

## 2. Chạy khi phát triển

```bash
npm run android   # lần đầu: build dev client (vài phút), cài lên máy, rồi mở Metro
npm start         # các lần sau: chỉ cần chạy Metro, mở app "Q Bank" trên máy
```

Chỉ cần chạy lại `npm run android` khi thêm thư viện có native code hoặc sửa `app.config.ts`. Sửa code JS/TS thì Fast Refresh tự cập nhật.

## 3. Build file cài đặt

```bash
npm run build:apk   # → android/app/build/outputs/apk/release/app-release.apk
npm run build:aab   # → android/app/build/outputs/bundle/release/app-release.aab (cho Google Play)
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

APK chỉ build cho `arm64-v8a` (máy thật, emulator trên Apple Silicon) và `x86_64` (emulator trên Intel) để build nhanh gấp đôi. Muốn đổi thì sửa `buildArchs` trong [app.config.ts](app.config.ts).

### Ký bản release

Nếu chưa cấu hình, bản release được ký bằng **debug keystore**: cài thử được, nhưng không đưa lên Google Play được. Để ký thật:

```bash
npm run keystore   # tạo credentials/q-bank-upload.keystore (đã gitignore) và in ra 4 dòng cấu hình
```

Dán 4 dòng `QBANK_UPLOAD_*` được in ra vào `~/.gradle/gradle.properties` (**không** commit vào repo), rồi chạy lại `npm run build:apk`. Nhớ **sao lưu keystore**: mất file này thì không cập nhật được app trên Google Play nữa.

> Thư mục `android/` do `expo prebuild` sinh ra (CNG) và không được commit. Không sửa tay trong đó; mọi thay đổi native đi qua [app.config.ts](app.config.ts) hoặc một config plugin trong [plugins/](plugins/).

## 4. Debug

| Cần xem                                        | Cách làm                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Log, breakpoint, React tree, Profiler, Network | Đang chạy Metro, bấm **`j`** để mở React Native DevTools                                            |
| Cache của TanStack Query, dữ liệu MMKV         | Chạy `npm run devtools` thay cho `npm start`, bấm `j`, mở tab **TanStack Query** / **MMKV Storage** |
| Request API                                    | Log `[api] → GET …` / `← 200 …` trong console (chỉ có ở bản dev)                                    |
| Lỗi render                                     | Màn `ErrorBoundary` hiện message lỗi (chỉ ở bản dev) và nút _Thử lại_                               |
| Crash native                                   | `adb logcat '*:E' ReactNativeJS:V`, hoặc mở `android/` bằng Android Studio để xem Logcat            |
| Lệch version thư viện                          | `npm run doctor`                                                                                    |

## 5. Scripts

| Lệnh                                          | Tác dụng                                                 |
| --------------------------------------------- | -------------------------------------------------------- |
| `npm start` / `npm run devtools`              | Chạy Metro (bản devtools bật thêm Rozenite)              |
| `npm run android` / `npm run android:release` | Build và cài bản debug / release lên máy                 |
| `npm run build:apk` / `npm run build:aab`     | Build file release                                       |
| `npm run check`                               | Chạy typecheck, lint và test (nên chạy trước khi commit) |
| `npm run format`                              | Format toàn bộ code bằng Prettier                        |

## 6. Cấu trúc thư mục

```
src/
├── app/          # Route của Expo Router (mỗi file là một màn hình) — chỉ chứa route
├── screens/      # Phần thân của từng màn hình, kèm component riêng của nó
├── components/   # ui/ (HeroUI + view dùng chung), form/
├── api/          # ky client, schema zod, query hook cho từng resource, query-keys
├── stores/       # zustand (settings, auth) + MMKV storage
├── providers/    # AppProviders, query client, đồng bộ settings, DevTools
├── i18n/         # i18next + locales/{vi,en}.json
├── lib/          # env (kiểm tra bằng zod), logger
└── utils/        # hàm thuần, test đặt cạnh file
```

Quy ước code chi tiết (cho người và cho AI) nằm trong [AGENTS.md](AGENTS.md).

## 7. Thêm một màn hình gọi API (ví dụ)

1. Khai báo schema và hook trong `src/api/<resource>.ts`, theo mẫu [src/api/catalog.ts](src/api/catalog.ts).
2. Viết màn hình trong `src/screens/<tên>/index.tsx`.
3. Tạo route `src/app/(app)/<tên>.tsx` chỉ render màn hình đó.
4. Thêm chuỗi hiển thị vào **cả** `vi.json` và `en.json`.
