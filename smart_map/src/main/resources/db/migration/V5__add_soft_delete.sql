-- =============================================================================
-- V5__add_soft_delete.sql
-- Thêm cột deleted_at cho maps + stations để hỗ trợ soft delete.
-- deleted_at = NULL  → đang hoạt động
-- deleted_at != NULL → đã bị xóa (có thể khôi phục)
-- =============================================================================

ALTER TABLE dbo.maps     ADD deleted_at DATETIME2 NULL;
ALTER TABLE dbo.stations ADD deleted_at DATETIME2 NULL;

CREATE INDEX idx_maps_deleted_at     ON dbo.maps(deleted_at);
CREATE INDEX idx_stations_deleted_at ON dbo.stations(deleted_at);