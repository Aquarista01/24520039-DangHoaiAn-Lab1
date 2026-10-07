# Hướng dẫn Homework 1, 2, 3

Đặng Hoài An - 24520039 - MSIS207.R11.CTTT

## 1. Mở bài trên máy

1. Mở thư mục repo bằng VS Code.
2. Nhấp phải `index.html` -> **Open with Live Server**.
3. Ở mục Projects, chọn **Play** để mở Drum Kit và **Visit** để mở Event Hub.
4. Chỉ cần Live Server; website không cần cài thêm thư viện hay chạy npm.

Trong gói bàn giao, `Source` là bản code để xem ngay. Nếu chuẩn bị cập nhật GitHub, dùng `homework.bundle` theo file `BAT_DAU.md` để giữ nguyên lịch sử commit.

## 2. Demo từng bài cho thầy

| Bài | Thao tác | Kết quả cần thấy |
| --- | --- | --- |
| HW1 | Bấm Tab, rồi Enter ở Skip to content | Focus chuyển vào main |
| HW1 | Bấm Theme, tải lại trang | Theme đã chọn vẫn được giữ |
| HW1 | Chỉ dùng Tab/Shift+Tab/Enter đi hết trang | Không kẹt focus ở một vùng |
| HW1 | DevTools -> chế độ thiết bị -> 375px | Không có cuộn ngang |
| HW2 | Bấm A S D hoặc nhấn chuột vào pad | Các âm trống tương ứng phát lên |
| HW2 | Giữ A | Chỉ phát một hit, không bị spam |
| HW2 | Record -> chơi vài nhịp -> Stop -> Replay | Phát lại theo khoảng cách thời gian đã ghi |
| HW2 | See recorded beats | Danh sách key và thời điểm ms theo FIFO |
| HW2 | Stop hoặc Space khi focus ngoài nút | Dừng âm thanh và phát lại |
| HW3 | Quan sát countdown | Đếm đến 09:00 ngày 21/11/2026 giờ Việt Nam |
| HW3 | Điền form và gửi | Idle -> Submitting -> Success |
| HW3 | Mở Preview an unavailable service, chọn checkbox rồi gửi | Hiện Error, giữ nội dung để thử lại |
| HW3 | Bỏ checkbox rồi gửi lại | Đăng ký mô phỏng thành công |
| HW3 | Nhấn gửi liên tục khi đang Submitting | Không tạo thêm lần gửi |

Sự kiện là ví dụ học tập, không phải thông báo thật của UIT. Form chỉ mô phỏng; không gửi email và không lưu dữ liệu.

## 3. File nào dùng để giải thích?

| File | Vai trò |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | Portfolio HW1: cấu trúc, giao diện, theme và form liên hệ |
| `events.js` | Component 4 trạng thái của Lab 1 cũ, vẫn giữ hoạt động |
| `vercel.json` | Header CSP và các header bảo mật khi deploy Vercel |
| `homework/drum-kit/index.html` | Contract: mỗi nút có data-key và data-sound |
| `homework/drum-kit/audio-engine.js` | Quản lý các voice; mỗi hit dùng một Audio riêng |
| `homework/drum-kit/drum.js` | Nối input với audio và recorder; không đưa logic âm thanh vào HTML |
| `homework/drum-kit/recorder.js` | Hàng đợi nhịp và lập lịch phát lại |
| `homework/event-hub/event-data.js` | Tên, ngày UTC và múi giờ sự kiện mẫu |
| `homework/event-hub/countdown.js` | Tính thời gian còn lại từ mốc tuyệt đối |
| `homework/event-hub/registration.js` | Máy trạng thái form, chặn gửi trùng |
| `homework/event-hub/registration-service.js` | Dịch vụ mô phỏng thành công/lỗi; có hủy tác vụ |
| `homework/event-hub/validation.js` | Chuẩn hóa, kiểm tra input, tạo snapshot bất biến |
| `homework/TASK_DECOMPOSITION.md` | WBS và contract đã ghi trước khi code |
| `AI_FAILURE_AUDIT.md` | 3 lỗi thật đã phát hiện, cách kiểm tra và sửa |
| `homework/CHECKS.md` | Kết quả đo và kiểm tra thực tế |

## 4. Giải thích ngắn khi vấn đáp

**Vì sao countdown không bị trôi?** Mỗi lần cập nhật lấy `target - Date.now()`, không giảm biến đếm đi 1. Nếu tab bị trì hoãn 10 giây, lần cập nhật tiếp theo vẫn tính từ giờ thực tế. `Date.now()` và target đều có đơn vị millisecond. `Math.ceil(remaining / 1000)` chuyển thành số giây còn lại. Sau đó tách ngày (86400 giây), giờ (3600), phút (60), giây. Mốc `2026-11-21T02:00:00Z` là 02:00 UTC, tức 09:00 ở Việt Nam. Đổi thời điểm trong event-data.js thì cũng sửa các thẻ time và lịch trình trong HTML cho khớp.

**FIFO là gì?** Nhịp vào trước nằm trước trong mảng. Mỗi record có `{key, at}`; `at` là số ms từ khi bắt đầu ghi. Dùng `performance.now()` vì nó là đồng hồ đơn điệu, không bị ảnh hưởng khi giờ hệ thống bị chỉnh. Khi Replay, lập lịch từng key theo `at`. Snapshot giúp phát lại không làm thay đổi hàng đợi.

**Polyphonic là gì?** Nhiều âm được phát cùng lúc. Mỗi hit tạo một voice Audio riêng; không tua lại một Audio dùng chung. Set giữ các voice đang chạy để Stop dừng tất cả. Giới hạn 48 voice tránh tăng tài nguyên không kiểm soát.

**Vì sao giữ phím không spam?** Handler keydown bỏ qua `event.repeat`. Chỉ dùng `event.key`, không dùng keyCode. Bỏ qua input đang nhập, các phím modifier và sự kiện composing.

**Chặn gửi trùng ở đâu?** Handler kiểm tra state trước, rồi đổi sang submitting trước lần await đầu tiên. Các lần submit sau thấy submitting nên thoát ngay. Input bị khóa trong thời gian gửi; submit vẫn nằm trong luồng Tab, dùng aria-disabled và state guard.

**Vì sao chống XSS?** Dữ liệu người dùng không được đưa vào innerHTML. Status được viết bằng textContent nên chuỗi `<img ...>` chỉ là chữ. Trim/kiểm tra độ dài giải quyết tính hợp lệ của dữ liệu; textContent giải quyết cách render an toàn.

**CSP làm gì?** Chỉ cho tải tài nguyên cùng origin; không dùng inline JavaScript, CDN, object, hay base tự thêm. Meta CSP áp dụng khi chạy local; frame-ancestors được cấu hình qua response header trong vercel.json vì meta không hỗ trợ directive này.

**Nếu thầy đổi data-sound thành data-audio-src?** Đổi attribute của 9 nút trong HTML, rồi đổi `pad.dataset.sound` thành `pad.dataset.audioSrc` ở drum.js. Audio engine không cần sửa vì chỉ nhận URL.

**Nếu thầy đổi key?** Đổi data-key và chữ kbd trong HTML; Map được dựng từ contract nên không cần viết switch-case mới. Bộ ghi vẫn lưu key tương ứng.

## 5. Trước khi nộp

- Cập nhật repo bằng Git bundle; xem `git log --oneline` để kiểm tra các commit tách biệt.
- Sau khi Vercel deploy xong, mở `/`, `/homework/drum-kit/`, `/homework/event-hub/`.
- Nghe thử cả 9 âm trên laptop; kiểm tra loa, trình duyệt và trình tự ghi/phát lại.
- Trên bản Vercel, chạy DevTools -> Lighthouse với Mobile và chụp điểm thật. Điểm local đã có trong CHECKS.md, không thay cho kiểm tra bản deploy.
- DevTools -> Network -> document -> Response Headers: kiểm tra Content-Security-Policy từ vercel.json.
- Nộp link GitHub/Vercel, WBS, audit và bằng chứng theo yêu cầu mới nhất của thầy. Nếu thầy có mẫu PDF riêng, điền vào mẫu đó; slide HW hiện không chỉ định một mẫu PDF.
