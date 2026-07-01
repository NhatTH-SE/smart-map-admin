-- =============================================================================
-- V3__init_sos.sql
-- Module 5: Cảnh báo khẩn cấp (Real-time SOS Alerts)
-- =============================================================================

IF OBJECT_ID('dbo.sos_alerts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sos_alerts (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        device_id       BIGINT          NOT NULL,
        station_id      BIGINT          NULL,                 -- Vị trí lúc phát SOS (nếu xác định được)
        map_id          BIGINT          NULL,
        message         NVARCHAR(500)   NULL,
        status          NVARCHAR(20)    NOT NULL DEFAULT 'PENDING', -- PENDING / ACKNOWLEDGED / RESOLVED
        triggered_at    DATETIME2       NOT NULL DEFAULT GETDATE(),
        resolved_at     DATETIME2       NULL,
        resolved_by     NVARCHAR(100)   NULL,
        CONSTRAINT fk_sos_device  FOREIGN KEY (device_id)  REFERENCES dbo.devices(id),
        CONSTRAINT fk_sos_station FOREIGN KEY (station_id) REFERENCES dbo.stations(id),
        CONSTRAINT fk_sos_map     FOREIGN KEY (map_id)     REFERENCES dbo.maps(id)
    );

    -- Dashboard admin: lấy các alert chưa xử lý, sắp mới nhất
    CREATE INDEX idx_sos_status_time ON dbo.sos_alerts(status, triggered_at DESC);

    -- Tra cứu theo thiết bị
    CREATE INDEX idx_sos_device ON dbo.sos_alerts(device_id, triggered_at DESC);
END
GO
