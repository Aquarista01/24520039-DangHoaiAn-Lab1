# HW1 M4 — Lighthouse 100 and module discovery

Ngày thực hiện: 07/10/2026 (Asia/Ho_Chi_Minh). Người chạy: AI assistant.
Nhánh `hw-atomic-rebuild`; baseline trước sửa: `e24f36a`.

## Đo trước, sửa theo kết quả

Lượt baseline mới đã đạt 100 ở Performance, Accessibility, Best Practices và SEO trên cả mobile và desktop. Không lấy điểm từ main hay các báo cáo của lần triển khai homework trước.

Lighthouse ghi nhận chuỗi request `index.html → app.js → events.js`. Thêm một dòng `link rel="modulepreload" href="events.js"` trong head để phát hiện dependency sớm. Đây là thay đổi duy nhất trong code ứng dụng của M4.

SVG portrait hiện có kích thước 580×660 khai báo rõ, file khoảng 1.8 KB; favicon khoảng 297 bytes; CLS đã bằng 0. Giữ các asset nhẹ hiện có. JS/CSS vẫn cùng origin và CSP giữ nguyên.

## Kết quả thực tế

URL local: `http://127.0.0.1:5510/`, server gửi nguyên CSP header từ vercel.json.
Lighthouse 13.5.0; Chromium 153.0.8010.0; Node 24.19.0, Chrome Launcher 1.2.2.
Mỗi phase chạy một lượt mobile và một lượt desktop; tổng cộng bốn lượt Lighthouse, không chọn lại lượt có điểm đẹp hơn.

| Profile | Trước: P / A / BP / SEO | Sau: P / A / BP / SEO | LCP trước → sau | TBT trước → sau | CLS trước → sau |
| --- | --- | --- | --- | --- | --- |
| Mobile | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 1.227 s → 0.915 s | 0 ms → 0 ms | 0 → 0 |
| Desktop | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 0.366 s → 0.249 s | 0 ms → 0 ms | 0 → 0 |

P = Performance, A = Accessibility, BP = Best Practices.
Category raw score trong cả bốn báo cáo đều bằng 1.0; con số 100 không đến từ làm tròn 99.x.
Longest network chain được đo: mobile 88 → 56 ms; desktop 111 → 33 ms.

Đây là số liệu của từng lượt local trong điều kiện lab. Một lượt mỗi profile không đủ để khẳng định mức tăng tốc cố định cho mọi thiết bị hoặc mạng. Chưa có Lighthouse run trên Vercel hay máy sinh viên cho M4.

## Cấu hình đo và bằng chứng

- Mobile dùng preset mặc định Lighthouse: 412×823, DPR 1.75, simulated Slow 4G, CPU slowdown 4×.
- Desktop dùng preset desktop chính thức của Lighthouse: 1350×940, DPR 1, simulated Dense 4G, CPU slowdown 1×.
- Giữ nguyên mặc định audit; không skip audit hoặc dùng throttle dễ hơn để tăng điểm.
- before-mobile.json, before-desktop.json, after-mobile.json và after-desktop.json là LHR đầy đủ từ lần chạy thật, gồm fetchTime, environment, configSettings, categories, metrics, audit details và screenshot data.
- before-summary.json / after-summary.json giữ điểm raw, cấu hình, metrics và các findings dưới 1 để đối chiếu nhanh.
- Các diagnostics về cache/compression của local server và stylesheet chặn render vẫn được giữ trong báo cáo. Category score 100 không có nghĩa mọi diagnostic đều hết.

Kiểm tra bổ sung sau thay đổi, trên 375/1440px và light/dark:
- events.js chỉ có một request và một Resource Timing entry.
- Request events.js bắt đầu trước khi response app.js hoàn tất: dependency được phát hiện sớm.
- Event hub khởi tạo ba event; zero page/console errors và zero CSP violations.
- Một h1, không div, không tràn ngang.

`preload-check.json` giữ kết quả của cả bốn cấu hình. Script ghi cả Resource Timing và CDP initiator để có thể đọc dấu vết thực tế; assertion dựa trên thời điểm request và số request, không suy diễn từ tên initiator.

## Chạy lại

Website không thêm dependency. Cài công cụ riêng, cần Node >=22.19:

```bash
npm install --prefix /tmp/hw1-m4-qa lighthouse@13.5.0 chrome-launcher@1.2.2 playwright@1.62.1
/tmp/hw1-m4-qa/node_modules/.bin/playwright install chromium
QA_NODE_MODULES=/tmp/hw1-m4-qa/node_modules CHROMIUM_PATH=/path/to/chromium node verification/hw1-m4/audit.mjs after
QA_NODE_MODULES=/tmp/hw1-m4-qa/node_modules CHROMIUM_PATH=/path/to/chromium node verification/hw1-m4/verify-preload.mjs
```

Thay CHROMIUM_PATH bằng executable thực tế. Audit.mjs dùng Chrome Launcher; không cần npm dependency cho website. Script tự mở server, đọc response headers và đóng Chrome/server sau kiểm tra. Lượt after trả exit code khác 0 nếu có category raw score dưới 1.0. Báo cáo bị ghi đè khi chạy lại; xem diff trước khi commit.

Để đo baseline, tạo worktree tại e24f36a, sao chép thư mục verification/hw1-m4 vào đó rồi chạy audit.mjs before. Không chạy before trên code đã có modulepreload rồi xem đó là baseline.

Nguồn chính thức: https://html.spec.whatwg.org/multipage/links.html#link-type-modulepreload. Preset và constants được đọc trực tiếp từ package Lighthouse 13.5.0 cài trong môi trường đo.
