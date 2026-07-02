-- Cho phép stations.mac_address NULL.
-- Map Editor chỉ vẽ dot (không gắn trạm phát vật lý), nên MAC chưa cần tại thời điểm tạo.
-- Stations Page mới bắt buộc MAC khi gán trạm phát cho dot.
--
-- Hibernate ddl-auto=update KHÔNG tự sửa NOT NULL → NULL trên column đã tồn tại,
-- nên phải ALTER thủ công. Chạy 1 lần trên môi trường đã có data cũ.

ALTER TABLE dbo.stations ALTER COLUMN mac_address VARCHAR(50) NULL;