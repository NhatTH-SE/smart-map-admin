package com.fpt.edu.vn.smart_map.controller;

import com.fpt.edu.vn.smart_map.common.dto.ApiResponse;
import com.fpt.edu.vn.smart_map.dto.StationDto;
import com.fpt.edu.vn.smart_map.service.StationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API cho Module 2: Quản lý Trạm phát (Beacon/iTag).
 *
 * Endpoints:
 *   GET    /api/stations                       → Lấy tất cả (cho admin list)
 *   GET    /api/stations?mapId={id}            → Lọc theo bản đồ
 *   GET    /api/stations?status=ACTIVE         → Lọc theo trạng thái
 *   GET    /api/stations?q=keyword             → Tìm theo tên / MAC
 *   GET    /api/stations/stats                 → Đếm theo status
 *   GET    /api/stations/{id}                  → Chi tiết
 *   POST   /api/stations                       → Tạo trạm mới
 *   PUT    /api/stations/{id}                  → Cập nhật
 *   PATCH  /api/stations/{id}/status           → Đổi trạng thái
 *   DELETE /api/stations/{id}                  → Xóa
 */
@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @GetMapping
    public ApiResponse<List<StationDto.Response>> list(
            @RequestParam(required = false) Long mapId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(value = "includeDeleted", required = false, defaultValue = "false") boolean includeDeleted) {
        if (mapId != null) {
            return ApiResponse.ok(includeDeleted
                    ? stationService.getByMapIdIncludingDeleted(mapId)
                    : stationService.getByMapId(mapId));
        }
        if (status != null && !status.isBlank()) {
            return ApiResponse.ok(stationService.getByStatus(status));
        }
        if (q != null && !q.isBlank()) {
            return ApiResponse.ok(stationService.search(q));
        }
        return ApiResponse.ok(includeDeleted
                ? stationService.getAllIncludingDeleted()
                : stationService.getAll());
    }

    @GetMapping("/stats")
    public ApiResponse<java.util.Map<String, Long>> stats() {
        return ApiResponse.ok(stationService.getCountByStatus());
    }

    @GetMapping("/{id}")
    public ApiResponse<StationDto.Response> getById(@PathVariable Long id) {
        return ApiResponse.ok(stationService.getById(id));
    }

    @PostMapping
    public ApiResponse<StationDto.Response> create(@RequestBody @Valid StationDto.Request req) {
        return ApiResponse.created(stationService.create(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<StationDto.Response> update(
            @PathVariable Long id,
            @RequestBody @Valid StationDto.Request req) {
        return ApiResponse.ok(stationService.update(id, req));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<StationDto.Response> updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid StationDto.StatusRequest req) {
        return ApiResponse.ok(stationService.updateStatus(id, req.getStatus()));
    }

    /** Soft delete — có thể khôi phục qua POST /{id}/restore */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        stationService.delete(id);
        return ApiResponse.ok(null, "Đã xóa trạm (có thể khôi phục)");
    }

    /** Khôi phục trạm đã soft-delete */
    @PostMapping("/{id}/restore")
    public ApiResponse<StationDto.Response> restore(@PathVariable Long id) {
        return ApiResponse.ok(stationService.restore(id), "Đã khôi phục trạm");
    }
}
