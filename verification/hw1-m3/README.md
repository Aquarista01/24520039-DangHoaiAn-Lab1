# HW1 M3 — Enforced Content Security Policy

Ngày thực hiện: 07/10/2026 (Asia/Ho_Chi_Minh). Người chạy: AI assistant.
Nhánh `hw-atomic-rebuild`; baseline trước sửa: `42bd2f6` (M2).

## Phạm vi

Source baseline đã dùng JS/CSS external cùng origin, không có inline script, inline style hoặc event-handler attribute. Tuy nhiên baseline không có CSP meta hay vercel.json để thực thi policy.

- Thêm CSP meta trong index.html, trước mọi resource.
- Thêm CSP response header trong vercel.json cho `/(.*)`.
- Chỉ cho phép resource cùng origin; cấm inline script/style/handler, unsafe-eval và object embedding.
- Chỉ cho phép base và form-action cùng origin.
- Header thêm `frame-ancestors 'none'` để không cho trang bị nhúng. Directive này không được hỗ trợ trong meta nên không đưa vào meta.
- Không thay đổi JS, CSS hoặc logic ứng dụng của M1/M2.

`script-src 'self'` là allowlist cùng origin, không phải nonce/hash CSP. Nhánh này đáp ứng contract trong WBS: same-origin và không có inline handler. Không tuyên bố CSP tự loại bỏ mọi dạng XSS.

## Kiểm tra local thực tế

Chromium 153.0.8010.0, Playwright 1.62.1. Hai server trong audit:
- 127.0.0.1:5500: đọc nguyên header từ vercel.json và gửi trong HTTP response.
- 127.0.0.1:5501: không gửi header, kiểm tra CSP meta khi chạy server tĩnh thông thường.

375×900 và 1440×900, light/dark, hai cách phân phối CSP: 8 cấu hình, 108 checks.

| Check | Trước sửa | Sau sửa |
| --- | --- | --- |
| CSP meta và response header | Không có | Có, đúng policy cấu hình |
| 108 checks ứng dụng | 28 checks về policy thất bại | 108/108 đạt |
| Inline script/style/handler trong source ứng dụng | 0 | 0 |
| CSS, SVG và JS module cùng origin | Hoạt động | Hoạt động dưới CSP |
| Theme, event-state actions, Retry, form, reload | Hoạt động | Hoạt động dưới CSP |
| CSP violations do hoạt động ứng dụng | 0, nhưng baseline chưa có policy | 0 dưới policy được thực thi |
| Page errors / console errors của ứng dụng | 0 | 0 |
| Thử chèn inline script/handler/style ở trang probe riêng | Được thực thi | Bị chặn |
| Thử tải script example.com ở trang probe riêng | Không bị CSP chặn | Bị CSP chặn |
| Thử iframe từ origin 5501 nhúng trang được bảo vệ ở 5500 | Nhúng được | Bị frame-ancestors chặn |

`before.json` và `after.json` giữ thời điểm chạy, response CSP thực tế của server local, resource requests, từng check và kết quả security probes. Probe cố ý gây violations được tách khỏi luồng ứng dụng bình thường. Hai policy header/meta có thể tạo hai violation events cho cùng một probe; đây là kết quả enforcement mong đợi.

Chưa lấy số liệu kiểm tra trên máy sinh viên. Lighthouse thuộc M4.

## Vercel: kiểm tra riêng sau khi publish

GitHub integration đang tự tạo deployment Preview cho nhánh này. Preview của baseline M2 trả HTTP 302 tới Vercel SSO khi đọc không đăng nhập. Header CSP của ứng dụng không xuất hiện trên redirect đăng nhập; không được coi redirect này là response của portfolio.

Kiểm tra header CSP thực tế trên deployment M3 còn chờ truy cập Preview được bảo vệ. Local pass không được ghi thành Vercel pass. Không thay đổi main, deployment production hoặc cấu hình bảo vệ Preview để vượt qua bước này.

Nếu mở Preview bằng tài khoản được cấp quyền: DevTools → Network → reload → chọn request Document của portfolio → Response Headers. Kiểm tra `content-security-policy` chứa `frame-ancestors 'none'`, không chứa unsafe-inline/unsafe-eval; kiểm tra Console và các tương tác sau reload. Ghi kết quả mới kèm URL, commit và thời điểm; không ghi là sinh viên đã kiểm tra nếu chưa có bằng chứng.

## Chạy lại local

Website không thêm dependency. Cài QA riêng, ví dụ Bash:

```bash
npm install --prefix /tmp/hw1-m3-qa playwright@1.62.1
/tmp/hw1-m3-qa/node_modules/.bin/playwright install chromium
QA_NODE_MODULES=/tmp/hw1-m3-qa/node_modules node verification/hw1-m3/audit.mjs after
```

Nếu có Chromium sẵn, đặt CHROMIUM_PATH trỏ tới executable. Script tự phục vụ source local và đóng server/browser khi hoàn tất. Lượt after trả exit code khác 0 nếu check/probe thất bại. JSON bị ghi đè khi chạy lại; xem diff trước khi commit.

Để đo baseline: tạo worktree tại 42bd2f6, sao chép thư mục verification/hw1-m3 vào đó, chạy audit.mjs before. Không lấy baseline trên code đã sửa.

Nguồn kỹ thuật chính thức, đọc ngày 07/10/2026:
- https://vercel.com/docs/project-configuration/vercel-json#headers
- https://www.w3.org/TR/CSP/#directive-frame-ancestors
- https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-http-equiv-content-security-policy
