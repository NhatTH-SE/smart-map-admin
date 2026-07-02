-- Cho phép stations.mac_address NULL.
-- Map Editor chỉ vẽ dot (không gắn trạm phát vật lý), nên MAC chưa cần tại thời điểm tạo.
-- Stations Page mới bắt buộc MAC khi gán trạm phát cho dot.
--
-- 1. Bỏ UNIQUE constraint trên mac_address.
--    Lý do: SQL Server UNIQUE INDEX tính NULL = NULL (khác MySQL/PostgreSQL),
--    không thể có nhiều dot cùng mac=NULL. Map Editor giờ cho phép nhiều dot
--    chưa gắn MAC, nên cần bỏ UNIQUE.
--    Check trùng MAC vẫn do application (StationService.create) đảm nhiệm
--    trên những row có giá trị MAC thực sự.
--
-- 2. Cho phép column NULL.
--    Hibernate ddl-auto=update không tự ALTER nullable → phải ALTER thủ công.

ALTER TABLE dbo.stations DROP CONSTRAINT IF EXISTS uq_stations_mac;
ALTER TABLE dbo.stations ALTER COLUMN mac_address VARCHAR(50) NULL;