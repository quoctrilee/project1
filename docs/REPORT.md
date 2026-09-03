# MINI-PROJECT SHORT TECHNICAL REPORT

**Course:** Cross-Platform Mobile App Development (VKU)
**Mini-Project Title:** Mini-Project 1 — VKU Field Survey (Offline-First Campus Inspection App)
**Team / Student Name:** Lê Quốc Trí
**Submission Date:** 03/09/2026

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS

* **🔗 Live Demo URL:** https://vku-field-survey.pages.dev *(cập nhật sau khi deploy Pages)*
* **💻 GitHub Repository:** [https://github.com/username/vku-field-survey] *(cập nhật link thực tế)*
* **🎥 Video Demo (Optional):** [https://youtu.be/xxx]

---

## 2. FEATURE IMPLEMENTATION CHECKLIST

| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | Standalone PWA — Manifest & Offline Shell | ✅ Complete | `manifest.json` với `theme_color: #0284c7`, icon 192×512 px, `display: standalone`. Service Worker `sw.js` (cache-first, `vku-v3`) pre-cache shell tại install, serve offline 100%. Hỗ trợ iOS `apple-mobile-web-app-capable`. |
| 2 | Multi-Step Survey Form (4 bước) | ✅ Complete | Bước 1: Vị trí (Tòa nhà / Tầng / Phòng). Bước 2: Danh mục (Hardware, Projector, AC, Electrical, Furniture). Bước 3: Đánh giá 1–5 sao + Ghi chú. Bước 4: Ảnh bằng chứng + GPS. Validation per-step, progress bar cập nhật thời gian thực. |
| 3 | Local Offline Persistence (IndexedDB) | ✅ Complete | Thư viện `idb` quản lý 2 object store: `drafts` (tự lưu nháp sau 700ms debounce) và `surveys` (key = UUID, index `by-status`). Dữ liệu tồn tại qua reload và airplane mode. |
| 4 | Draft Auto-Save & Restore | ✅ Complete | `scheduleDraft()` debounce 700ms ghi vào IndexedDB sau mỗi input. Khi mở lại app, `boot()` khôi phục toàn bộ trường, rating, ảnh từ bản nháp đã lưu. |
| 5 | UUID + Timestamp + GPS per Record | ✅ Complete | Mỗi bản ghi tạo `crypto.randomUUID()`, `Date.now()` và tọa độ GPS (`latitude`, `longitude`, `accuracy`) qua Capacitor Geolocation. Nếu GPS bị từ chối, ghi `null` và form vẫn submit bình thường. |
| 6 | Automatic Background Sync | ✅ Complete | 3 cơ chế song song: (1) Background Sync API tag `sync-surveys` — SW nhận `sync` event, postMessage `TRIGGER_SYNC` về client; (2) `window.ononline` fallback cho non-Chromium; (3) Capacitor `Network.addListener` cho native Android. Tối đa 5 lần thử lại, có nút Retry thủ công. |
| 7 | Sync Queue UI (PENDING / SYNCED / FAILED) | ✅ Complete | Section "Hàng đợi đồng bộ" hiển thị danh sách record dạng card, badge trạng thái màu, bộ đếm attempt `x/5`, nút xóa và retry từng bản ghi, sắp xếp theo thời gian giảm dần. |
| 8 | Cloudflare Worker API (Backend) | ✅ Complete | `POST /api/surveys` validate đầy đủ (UUID, building, floor, room, notes là string; timestamp là number; category trong enum; rating 1–5 integer). `GET /api/health` trả `{ok:true}`. CORS headers cho tất cả origin. Đã deploy tại `vku-field-survey-api.trilq-05.workers.dev`. |
| 9 | Native Android App (Capacitor) | ✅ Complete | Capacitor 7, `appId: vn.edu.vku.fieldsurvey`. Plugin Camera (native + web fallback `<input capture>`), Geolocation, Network. Build debug/release APK qua `gradlew assembleRelease`. |
| 10 | PWA Install Prompt (A2HS) | ✅ Complete | Banner cài đặt xuất hiện khi browser phát `beforeinstallprompt`, gọi `deferredInstallPrompt.prompt()` khi nhấn nút, tự ẩn sau khi cài đặt hoặc bỏ qua. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### Sơ đồ kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   HTML/CSS/TS (Vite)  ←→  main.ts (UI Logic)                   │
│         │                     │                                 │
│         ▼                     ▼                                 │
│   Service Worker          db.ts (idb)                           │
│   (cache-first)       ┌───────────────┐                         │
│         │             │  IndexedDB    │                         │
│         │             │  - drafts     │                         │
│         │             │  - surveys    │                         │
│         │             │    (by-status)│                         │
│         │             └───────────────┘                         │
│         │                     │                                 │
│         │             sync-queue.ts                             │
│         │          (processSyncQueue)                           │
│         │                     │                                 │
└─────────┼─────────────────────┼───────────────────────────────┘
          │                     │ POST /api/surveys
          ▼                     ▼
   Cloudflare Pages    Cloudflare Worker API
   (Static Hosting)   vku-field-survey-api.trilq-05.workers.dev
```

### Cấu trúc thư mục

```
project1/
├── frontend/
│   ├── src/
│   │   ├── index.html          # Shell HTML, 4-step form, queue UI
│   │   ├── main.ts             # Entry: DOM wiring, boot(), submit()
│   │   ├── db.ts               # IndexedDB schema & CRUD (idb)
│   │   ├── sync-queue.ts       # processSyncQueue(), initSyncListeners()
│   │   ├── capacitor-bridge.ts # Camera, Geolocation, Network (native/web)
│   │   └── sw-register.ts      # Service Worker registration
│   ├── public/
│   │   ├── sw.js               # Service Worker (cache-first + Background Sync)
│   │   ├── manifest.json       # PWA manifest
│   │   └── style.css           # Global styles
│   └── android/                # Capacitor Android project
│       └── app/src/main/java/vn/edu/vku/fieldsurvey/
│           └── MainActivity.java
├── worker/
│   └── src/index.ts            # Cloudflare Worker: validate + log surveys
└── docs/
    └── REPORT.md               # Báo cáo này
```

### Luồng dữ liệu chính

1. **Nhập liệu** → `form input` event → `scheduleDraft()` debounce 700ms → `saveDraft()` → IndexedDB `drafts`
2. **Nộp form** → `submit()` → `getCurrentLocation()` (GPS) → `addSurvey()` → IndexedDB `surveys` (status: `PENDING_SYNC`) → `deleteDraft()`
3. **Đồng bộ** → `processSyncQueue()` → `fetch POST /api/surveys` → success: `updateSurveyStatus('SYNCED')` / fail: `incrementSyncAttempts()`
4. **Trigger sync** → 3 nguồn: SW `sync` event, `window.ononline`, Capacitor `networkStatusChange`

### Xử lý ngoại lệ

| Tình huống | Xử lý |
|---|---|
| GPS bị từ chối / timeout | Lưu `latitude: null`, form vẫn nộp bình thường |
| Network lỗi khi sync | Tăng `syncAttempts`, giữ `PENDING_SYNC`, toast lỗi |
| Quá 5 lần thử | Badge chuyển `FAILED`, hiện nút Retry thủ công |
| Background Sync không hỗ trợ | Fallback `window.ononline` + Capacitor Network listener |
| App mở lại sau crash | `boot()` restore từ `drafts` store, toast thông báo |
| Camera từ chối (native) | `try/catch`, trả `null`, ảnh là tùy chọn |
| Request JSON không hợp lệ | Worker trả HTTP 400 kèm message lỗi cụ thể |

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

> **Hướng dẫn:** Chụp và đính kèm 4 ảnh sau vào mục này.

**Ảnh 1 — Form đa bước trên thiết bị / emulator**
- Chụp màn hình bước 1 (Vị trí) với progress bar hiển thị "BƯỚC 1/4"
- Cho thấy layout responsive trên mobile viewport

**Ảnh 2 — Trạng thái đồng bộ hàng đợi**
- Chụp section "Hàng đợi đồng bộ" với ít nhất 1 bản ghi `PENDING_SYNC` và 1 bản `SYNCED`
- Cho thấy badge màu, thông tin tòa/tầng/phòng, rating sao, thời gian

**Ảnh 3 — Offline mode (Airplane mode)**
- Chụp màn hình pill "Ngoại tuyến" (màu đỏ/xám) và bản ghi đang ở `PENDING_SYNC`
- Chứng minh form vẫn nộp được khi không có mạng

**Ảnh 4 — Service Worker & Manifest trong DevTools**
- Chụp tab Application → Service Workers (status: Activated)
- Chụp tab Application → Manifest (theme color, icon, display: standalone)
- Hoặc: APK chạy trên thiết bị Android thực / Android Emulator

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### Thách thức 1: Background Sync API không đồng nhất giữa các nền tảng

**Vấn đề:** Background Sync API chỉ được hỗ trợ đầy đủ trên Chromium (Chrome, Edge). Safari và Firefox không hỗ trợ, khiến `registration.sync.register('sync-surveys')` throw exception. Nếu chỉ dựa vào một cơ chế sync duy nhất, app sẽ không tự đồng bộ trên iOS hoặc Firefox.

**Giải pháp:** Triển khai kiến trúc sync **3 tầng dự phòng**:
1. **Background Sync API** (Chromium): Service Worker lắng nghe event `sync`, postMessage `TRIGGER_SYNC` về main thread
2. **`window.ononline`** (tất cả trình duyệt): Fallback khi tab đang mở và kết nối phục hồi
3. **Capacitor `Network.addListener`** (native Android/iOS): API native chính xác hơn, không phụ thuộc browser event

Tất cả 3 đều gọi cùng `processSyncQueue()`, đảm bảo hoạt động nhất quán trên mọi môi trường.

---

### Thách thức 2: Quản lý trạng thái sync và retry logic

**Vấn đề:** Khi backend lỗi tạm thời (503, timeout), app cần phân biệt "đang chờ sync" vs "sync thất bại vĩnh viễn" để tránh vòng lặp retry vô hạn gây tốn băng thông và pin thiết bị. Đồng thời cần cho người dùng kiểm soát việc retry thủ công.

**Giải pháp:** Thiết kế state machine cho mỗi bản ghi trong IndexedDB:
- Trường `syncAttempts` tăng dần sau mỗi lần thất bại (`incrementSyncAttempts()`)
- Khi `syncAttempts >= 5`: bỏ qua trong vòng lặp tự động, đổi badge thành `FAILED`
- Nút **Retry** trong UI gọi `resetSyncAttempts()` đặt lại về 0 và kích hoạt sync ngay lập tức
- Worker trả thông điệp lỗi cụ thể trong HTTP 400 body, hiển thị toast cho người dùng

---

*Báo cáo này được tạo dựa trên source code thực tế của project. Cần bổ sung: tên sinh viên, MSSV, link GitHub public, link Pages đã deploy, link video demo, và 4 ảnh màn hình vào các mục tương ứng.*
