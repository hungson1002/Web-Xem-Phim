# WatchParty Vấn Đáp Cheat Sheet

## 1) Bài nói mở đầu (30-45 giây)
- WatchParty của em tách làm 2 lớp.
- Lớp `REST API` xử lý vòng đời phòng: tạo phòng, join, leave, close và lấy dữ liệu ban đầu.
- Lớp `Socket.IO` xử lý realtime: đồng bộ play/pause/seek/episode-change và chat tức thời.
- Dữ liệu chính nằm ở `WatchRoom` (state phòng + sync state video) và `ChatMessage` (lịch sử chat).
- Khi user vào phòng, frontend gọi REST để lấy snapshot chuẩn, sau đó dùng socket để giữ đồng bộ realtime.

## 2) Kiến trúc ngắn gọn
- `WatchRoom.route.js`: quản lý phòng và nghiệp vụ host/participant.
- `Message.route.js`: API lấy/gửi message theo room code.
- `socketService.js`: event realtime video + chat.
- `WatchRoom.model.js`: `roomCode`, `participants`, `isActive`, `currentTime`, `isPlaying`, `currentServer`, `currentEpisode`.
- `ChatMessage.model.js`: lưu message theo `room`, có `sentAt` và giới hạn nội dung.

## 3) Luồng nghiệp vụ chính
1. Tạo phòng:
- `POST /api/watch-rooms`
- Validate movie info, sinh `roomCode`, gán người tạo làm host, tự thêm host vào participants.

2. Vào phòng:
- `POST /api/watch-rooms/:code/join`
- Kiểm tra room active, kiểm tra đã tham gia chưa, kiểm tra full phòng, sau đó add participant.

3. Lấy chi tiết phòng:
- `GET /api/watch-rooms/:code`
- Trả room + lịch sử chat gần nhất để user mới vào có bối cảnh.

4. Rời phòng:
- `POST /api/watch-rooms/:code/leave`
- User thường: chỉ remove khỏi participants.
- Host: đóng phòng (`isActive=false`) và xóa chat room.

5. Đóng phòng:
- `DELETE /api/watch-rooms/:code`
- Chỉ host mới có quyền đóng phòng.

## 4) Luồng realtime cần nhớ
1. `join-room`:
- Socket join vào room code.
- Server gửi `sync-state` để đồng bộ video state hiện tại.

2. Đồng bộ video:
- `video-play`, `video-pause`, `video-seek`, `episode-change`.
- Server update DB để state bền, rồi broadcast cho các client còn lại.

3. Chat realtime:
- Event `chat-message` lưu DB rồi emit cho cả phòng.
- Có trim lịch sử để giữ tối đa 200 tin gần nhất/room.

## 5) Vì sao cần lưu sync-state vào DB?
- User vào muộn vẫn nhận đúng trạng thái hiện tại.
- Nếu client reconnect, vẫn khôi phục được state.
- Không phụ thuộc hoàn toàn vào RAM của socket process.

## 6) Transaction/fallback (điểm cộng khi trả lời)
- Khi leave/close room có nhiều thao tác liên quan (sửa room + xóa chat), code ưu tiên chạy transaction.
- Nếu MongoDB không hỗ trợ transaction (standalone), hệ thống fallback chạy không transaction để không bị chết chức năng.

## 7) Các edge case quan trọng
1. User join lại:
- Nếu đã có trong participants thì không thêm trùng, trả room hiện tại.

2. Room full:
- Trả `400 Room is full`.

3. Room không tồn tại hoặc đã đóng:
- Trả `404 Room not found`.

4. Host rời phòng:
- Tự đóng phòng luôn thay vì chuyển host.

5. Message rỗng:
- Trả `400 Message text is required`.

## 8) Các điểm dễ bị hỏi xoáy (nên chủ động nói)
1. Socket chưa verify JWT trực tiếp ở từng event:
- Hiện có rủi ro giả `senderId` nếu client xấu.
- Hướng cải thiện: authenticate socket handshake + map socket->user server-side.

2. Race condition khi nhiều người join gần ngưỡng maxParticipants:
- Có thể xảy ra vượt giới hạn nếu không lock/atomic.
- Hướng cải thiện: dùng query update có điều kiện hoặc transaction chặt hơn.

3. Scale nhiều instance:
- `Map` in-memory cho room socket không chia sẻ liên tiến trình.
- Hướng cải thiện: Socket.IO Redis adapter để scale ngang.

## 9) 12 câu hỏi vấn đáp hay gặp + đáp ngắn
1. Vì sao tách REST và Socket?
- REST cho trạng thái bền và thao tác CRUD; Socket cho realtime latency thấp.

2. Tại sao join phải gọi REST trước rồi mới socket?
- REST trả snapshot chuẩn; socket chỉ xử lý delta realtime sau đó.

3. Vì sao cần `MAX_CHAT_HISTORY`?
- Giới hạn tăng trưởng dữ liệu và tăng tốc query.

4. Tại sao `reverse()` sau khi sort `sentAt: -1`?
- Query nhanh từ mới nhất, rồi đảo lại để UI hiển thị đúng thứ tự đọc.

5. Tại sao host leave là đóng phòng?
- Quy tắc nghiệp vụ hiện tại: room gắn với host tạo phòng.

6. Nếu DB không hỗ trợ transaction thì sao?
- Có fallback chạy thường để không gián đoạn tính năng.

7. Vì sao dùng `lean()` ở query chat?
- Giảm overhead Mongoose document, trả plain object nhanh hơn.

8. Có kiểm tra quyền đóng phòng không?
- Có, chỉ host mới được `DELETE /:code`.

9. Có chống spam message không?
- Hiện mới giới hạn độ dài và số lượng lưu; chưa có rate-limit user.

10. Có bảo vệ socket event khỏi client giả mạo chưa?
- Chưa đầy đủ, đây là điểm cần harden tiếp.

11. Khi user reconnect thì đồng bộ thế nào?
- Join room lại và nhận `sync-state` từ server.

12. Có thể mở rộng làm “chuyển host” không?
- Có, thêm rule chọn host mới khi host rời thay vì đóng phòng.

## 10) Câu chốt khi kết thúc vấn đáp
- Em ưu tiên tính đúng nghiệp vụ và trải nghiệm realtime trước.
- Các phần em xác định cần nâng cấp tiếp là: bảo mật socket, chống race join-room, và scale đa instance bằng Redis adapter.
