package com.fpt.edu.vn.smart_map.controller;

import com.fpt.edu.vn.smart_map.common.dto.ApiResponse;
import com.fpt.edu.vn.smart_map.dto.MapDto;
import com.fpt.edu.vn.smart_map.service.MapService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST API cho Module 1: Quản lý Bản đồ.
 *
 * Endpoints (tất cả trả về ApiResponse<T> chuẩn):
 *   GET    /api/maps                  → Danh sách tất cả
 *   GET    /api/maps/active           → Danh sách đang active
 *   GET    /api/maps/{id}             → Chi tiết
 *   POST   /api/maps                  → Upload bản đồ mới (multipart)
 *   PUT    /api/maps/{id}             → Cập nhật thông tin (JSON)
 *   PATCH  /api/maps/{id}/image       → Thay ảnh mới (multipart)
 *   DELETE /api/maps/{id}             → Xóa
 */
@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
public class MapController {

    private final MapService mapService;

    @GetMapping
    public ApiResponse<List<MapDto.Response>> getAll(
            @RequestParam(value = "includeDeleted", required = false, defaultValue = "false") boolean includeDeleted) {
        return ApiResponse.ok(includeDeleted ? mapService.getAllIncludingDeleted() : mapService.getAll());
    }

    @GetMapping("/active")
    public ApiResponse<List<MapDto.Response>> getActive() {
        return ApiResponse.ok(mapService.getActive());
    }

    @GetMapping("/{id}")
    public ApiResponse<MapDto.Response> getById(@PathVariable Long id) {
        return ApiResponse.ok(mapService.getById(id));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ApiResponse<MapDto.Response> create(
            @RequestPart("file") MultipartFile file,
            @RequestPart("name") String name,
            @RequestPart(value = "description", required = false) String description) {
        MapDto.Response created = mapService.create(file, name, description);
        return ApiResponse.created(created);
    }

    @PutMapping("/{id}")
    public ApiResponse<MapDto.Response> update(
            @PathVariable Long id,
            @RequestBody @Valid MapDto.UpdateRequest req) {
        return ApiResponse.ok(mapService.update(id, req));
    }

    @PatchMapping(value = "/{id}/image", consumes = "multipart/form-data")
    public ApiResponse<MapDto.Response> updateImage(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(mapService.updateImage(id, file));
    }

    /** Soft delete — có thể khôi phục qua POST /{id}/restore */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        mapService.delete(id);
        return ApiResponse.ok(null, "Đã xóa bản đồ (có thể khôi phục)");
    }

    /** Khôi phục bản đồ đã soft-delete */
    @PostMapping("/{id}/restore")
    public ApiResponse<MapDto.Response> restore(@PathVariable Long id) {
        return ApiResponse.ok(mapService.restore(id), "Đã khôi phục bản đồ");
    }
}
