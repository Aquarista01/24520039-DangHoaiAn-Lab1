# HW1 M2 — Keyboard, focus and optional storage

Ngày thực hiện: 07/10/2026 (Asia/Ho_Chi_Minh). Người chạy: AI assistant.
Nhánh `hw-atomic-rebuild`; baseline trước sửa: `cdc93ec` (M1).

## Lỗi và phạm vi sửa

1. `localStorage` hoặc `getItem()` ném SecurityError: module dừng trước khi gắn sự kiện và khởi tạo event hub. Theme không dùng được; event hub trống.
2. `setItem()` ném QuotaExceededError: theme CSS thay đổi nhưng `aria-pressed` chưa cập nhật; thao tác tiếp theo không đổi theme trở lại và có uncaught page error.
3. Giá trị theme không hợp lệ trong storage: trên hệ thống dark, màu giao diện theo dark nhưng nút báo trạng thái light.

Chỉ sửa `app.js`: đọc storage trong try/catch, chỉ nhận light/dark; cập nhật giao diện và trạng thái nút trước khi thử lưu; bỏ qua lỗi ghi vì lưu theme là tùy chọn.

Tab/Shift+Tab và skip link đã hoạt động ở baseline. Không phát hiện vòng lặp giữ focus trong các luồng được thử; không thêm JavaScript thay thế hành vi anchor native.

## Kết quả thực tế

Chromium 153.0.8010.0, Playwright 1.62.1; URL local `http://127.0.0.1:5500/`.
Viewport 375×900 và 1440×900, hệ thống light/dark.
Năm điều kiện storage: bình thường; chặn thuộc tính localStorage; chặn đọc; chặn ghi; giá trị theme không hợp lệ. Dùng browser context mới cho từng trường hợp.

| Check | Trước sửa | Sau sửa |
| --- | --- | --- |
| 20 cấu hình, tổng 160 checks | 54 checks thất bại, đều thuộc lỗi storage/theme | 160/160 đạt |
| Tab qua 22 điểm tương tác, focus-visible có outline | Đạt ở 4 cấu hình bình thường | Đạt ở 4 cấu hình bình thường |
| Shift+Tab từ footer về skip link | Đạt | Đạt |
| Skip link lần đầu và lặp lại cùng hash | Focus vào main; Tab tiếp bỏ qua header | Đạt như baseline |
| Enter: Contact, gửi form hợp lệ, thoát form tới footer | Đạt | Đạt |
| Enter: Error → Retry → event hub có dữ liệu | Đạt | Đạt |
| Enter/Space: theme và aria-pressed đồng bộ, giữ focus | Hỏng khi storage bị chặn; theme rác trên hệ thống dark cũng gây lệch | Đạt trong cả 20 cấu hình |
| Lưu theme hợp lệ rồi reload, storage bình thường | Đạt | Đạt |
| Khởi tạo event hub khi storage bị chặn đọc | Không khởi tạo | Khởi tạo bình thường |
| Uncaught page errors | Có khi chặn storage | 0 trong cả 20 cấu hình |
| Tràn ngang | Không | Không |

54 là số assertion thất bại lặp theo cấu hình, không phải 54 lỗi độc lập. `before.json` và `after.json` giữ trace từng mục tiêu focus, trạng thái theme, page errors và thời điểm thực tế.

Các luồng navigation/form/Retry sử dụng input bàn phím của Playwright. Kiểm tra toggle riêng dùng native focus() để đặt điểm bắt đầu, sau đó Enter và Space; khả năng Tab tới nút đã được kiểm tra riêng. Lần kích hoạt skip thứ hai dùng Shift+Tab quay về skip link và Enter khi URL vẫn có `#main`.

Đây là kiểm tra tự động trên Chromium; chưa có kiểm tra trên máy sinh viên, trình đọc màn hình, Firefox hoặc Safari. Không coi kiểm tra này là toàn bộ chứng nhận accessibility. CSP và Lighthouse thuộc các milestone sau.

## Chạy lại

Website không thêm dependency. Cài công cụ QA vào thư mục riêng, ví dụ Bash:

```bash
npm install --prefix /tmp/hw1-m2-qa playwright@1.62.1
/tmp/hw1-m2-qa/node_modules/.bin/playwright install chromium
QA_NODE_MODULES=/tmp/hw1-m2-qa/node_modules node verification/hw1-m2/audit.mjs after
```

Nếu dùng Chromium có sẵn, đặt `CHROMIUM_PATH` trỏ tới executable. Script tự mở server local và đóng sau khi chạy; `after` trả exit code khác 0 nếu có check thất bại. Báo cáo after.json sẽ bị ghi đè; xem diff trước khi commit.

Để kiểm tra trước sửa, tạo worktree riêng tại `cdc93ec`, sao chép thư mục `verification/hw1-m2` vào worktree đó rồi chạy `audit.mjs before`. Không lấy số liệu baseline bằng cách chạy before trên code đã sửa.
