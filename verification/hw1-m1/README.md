# HW1 M1 — Accessibility audit

Ngày thực hiện: 07/10/2026 (Asia/Ho_Chi_Minh). Người chạy: AI assistant.
Nhánh: `hw-atomic-rebuild`. Nguồn trước sửa: commit kế hoạch `c62400a`, code ứng dụng giống baseline `8aa4676`.

## Phạm vi và lỗi thực tế

- Bốn liên kết có accessible name không chứa chữ hiển thị: thương hiệu `HA.`, hai `Explore`, một `Try demo` (WCAG 2.5.3).
- Hero ngoài và phần About dùng cùng tên landmark. Bỏ tên landmark ở wrapper ngoài; About vẫn dùng tiêu đề h1.
- Viền input, textarea, theme toggle và các nút demo/Retry dùng màu đường trang trí quá nhạt. Thêm token `--control-line` cho control, giữ riêng token đường trang trí (WCAG 1.4.11).
- Chỉ sửa code ứng dụng trong `index.html` và `styles.css`. Các file kiểm tra và nhật ký đi cùng milestone này.

## Kiểm tra đã chạy

URL local: `http://127.0.0.1:5500/`. Chromium 153.0.8010.0, axe-core 4.14.0, Node 24.19.0, Playwright 1.62.1.
Viewport: 375×900 và 1440×900; theme light/dark; trạng thái loading/ready/empty/error. Tổng cộng 16 cấu hình cho mỗi lượt trước/sau.
Tags axe: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice.

| Check | Trước sửa | Sau sửa |
| --- | --- | --- |
| Nhóm lỗi axe | label-content-name-mismatch; landmark-unique | 0 violations trong 16 cấu hình |
| Chữ thường: tỷ lệ thấp nhất trong bảng token | 4.61:1 | 4.61:1 (ngưỡng 4.5:1) |
| Viền input / surface, light | 1.66:1 | 4.82:1 |
| Viền input / surface, dark | 2.43:1 | 5.41:1 |
| Focus / nền: tỷ lệ thấp nhất | 5.59:1 | 5.59:1 (ngưỡng 3:1) |
| Một h1, không div | Đạt | Đạt |
| Tràn ngang ở 375px và 1440px | Không | Không |
| JavaScript page errors trong các lượt này | 0 | 0 |

`before.json` và `after.json` chứa thời điểm chạy, từng cấu hình, node lỗi, màu computed và tỷ lệ chưa làm tròn. Control đang chọn có nền đặc được đo với nền bên ngoài; không yêu cầu viền tương phản với chính màu tô giống hệt nó. Các input dùng viền được đo cả phía trong và ngoài.

Axe còn đánh dấu `color-contrast` cần đánh giá thủ công trên glyph: icon theme, mũi tên liên kết, hai icon skill và state-symbol. Đã xem ảnh toàn trang của cả bốn cấu hình theme/viewport; đo màu token icon với các nền tương ứng. Các tỷ lệ kiểm tra đạt ngưỡng. Kết quả này không phải chứng nhận toàn bộ WCAG 2.2 AA; kiểm tra bàn phím thuộc M2 và thử với trình đọc màn hình/người dùng thật chưa thực hiện.

Không ghi nhận kiểm tra nào của sinh viên trong lượt này. M2, CSP và Lighthouse chưa chạy cho nhánh này.

## Chạy lại

Website không có phụ thuộc mới. Công cụ QA cài ở thư mục riêng. Ví dụ Bash, Node 20+:

```bash
npm install --prefix /tmp/hw1-m1-qa playwright@1.62.1 axe-core@4.14.0
/tmp/hw1-m1-qa/node_modules/.bin/playwright install chromium
QA_NODE_MODULES=/tmp/hw1-m1-qa/node_modules node verification/hw1-m1/audit.mjs after
```

Nếu có Chromium sẵn, đặt `CHROMIUM_PATH` trỏ tới executable. Tùy chọn `SCREENSHOTS_DIR` để lưu ảnh toàn trang. Script tự phục vụ source local, kiểm tra trạng thái đang được chọn, rồi đóng browser/server. Lượt `after` trả exit code khác 0 nếu có axe violations, lỗi cấu trúc/overflow, màu dưới ngưỡng hoặc page errors. Các mục axe `incomplete` vẫn phải đọc và đánh giá riêng.

Các lần chạy lại ghi đè `after.json`; xem diff trước khi commit. Để đo baseline, dùng worktree riêng tại `c62400a`, sao chép thư mục kiểm tra vào đó và chạy `audit.mjs before`; không chạy `before` trên code đã sửa rồi coi đó là số liệu baseline.
