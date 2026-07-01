-- =============================================================================
-- V1__init_schema.sql
-- Module 1 (Map) + Module 2 (Station) + Module 3 (Device)
-- Tác giả: cả team review trước khi merge
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Bảng MAPS - Quản lý nhiều bản đồ / nhiều tầng
-- -----------------------------------------------------------------------------
IF OBJECT_ID('dbo.maps', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.maps (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        name            NVARCHAR(100)   NOT NULL,
        description     NVARCHAR(500)   NULL,
        image_url       NVARCHAR(MAX)   NOT NULL,
        width           INT             NOT NULL,
        height          INT             NOT NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX idx_maps_active ON dbo.maps(is_active);
END
GO

-- -----------------------------------------------------------------------------
-- 2. Bảng STATIONS - Quản lý trạm phát (Beacon/iTag)
-- -----------------------------------------------------------------------------
IF OBJECT_ID('dbo.stations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.stations (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        map_id          BIGINT          NOT NULL,
        name            NVARCHAR(100)   NOT NULL,
        mac_address     NVARCHAR(50)    NOT NULL,
        coord_x         DECIMAL(10,2)   NOT NULL,
        coord_y         DECIMAL(10,2)   NOT NULL,
        notes           NVARCHAR(500)   NULL,
        status          NVARCHAR(20)    NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / MAINTENANCE / LOST
        last_seen_at    DATETIME2       NULL,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_stations_map FOREIGN KEY (map_id) REFERENCES dbo.maps(id) ON DELETE CASCADE,
        CONSTRAINT uq_stations_mac UNIQUE (mac_address)
    );

    CREATE INDEX idx_stations_map    ON dbo.stations(map_id);
    CREATE INDEX idx_stations_status ON dbo.stations(status);
END
GO

-- -----------------------------------------------------------------------------
-- 3. Bảng DEVICES - Quản lý hộp ESP32 (thiết bị dẫn đường)
-- -----------------------------------------------------------------------------
IF OBJECT_ID('dbo.devices', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.devices (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        device_code         NVARCHAR(50)    NOT NULL,
        name                NVARCHAR(100)   NOT NULL,
        current_map_id      BIGINT          NULL,
        current_station_id  BIGINT          NULL,
        status              NVARCHAR(20)    NOT NULL DEFAULT 'OFFLINE', -- ONLINE / OFFLINE
        last_seen_at        DATETIME2       NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_devices_code UNIQUE (device_code),
        CONSTRAINT fk_devices_map FOREIGN KEY (current_map_id) REFERENCES dbo.maps(id),
        CONSTRAINT fk_devices_station FOREIGN KEY (current_station_id) REFERENCES dbo.stations(id)
    );

    CREATE INDEX idx_devices_status ON dbo.devices(status);
    CREATE INDEX idx_devices_map    ON dbo.devices(current_map_id);
END
GO
