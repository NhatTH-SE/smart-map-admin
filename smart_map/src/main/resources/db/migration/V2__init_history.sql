-- =============================================================================
-- V2__init_history.sql
-- Module 4: Lịch sử Check-in (Passport History) & Dwell Time
-- =============================================================================

IF OBJECT_ID('dbo.check_in_history', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.check_in_history (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        device_id           BIGINT          NOT NULL,
        station_id          BIGINT          NOT NULL,
        map_id              BIGINT          NOT NULL,
        check_in_at         DATETIME2       NOT NULL,
        check_out_at        DATETIME2       NULL,            -- NULL = đang ở đó
        dwell_time_seconds  INT             NULL,            -- Tính khi check_out
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_history_device  FOREIGN KEY (device_id)  REFERENCES dbo.devices(id),
        CONSTRAINT fk_history_station FOREIGN KEY (station_id) REFERENCES dbo.stations(id),
        CONSTRAINT fk_history_map     FOREIGN KEY (map_id)     REFERENCES dbo.maps(id)
    );

    -- Truy vấn theo thiết bị (xem hành trình của 1 hộp)
    CREATE INDEX idx_history_device  ON dbo.check_in_history(device_id, check_in_at DESC);

    -- Truy vấn theo trạm (tính dwell time, lượt ghé)
    CREATE INDEX idx_history_station ON dbo.check_in_history(station_id, check_in_at DESC);

    -- Truy vấn theo bản đồ
    CREATE INDEX idx_history_map     ON dbo.check_in_history(map_id, check_in_at DESC);

    -- Lọc các bản ghi chưa check-out (đang ở đó)
    CREATE INDEX idx_history_active  ON dbo.check_in_history(device_id) WHERE check_out_at IS NULL;
END
GO
