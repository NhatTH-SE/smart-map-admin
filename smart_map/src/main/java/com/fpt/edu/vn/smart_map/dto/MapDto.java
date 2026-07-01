package com.fpt.edu.vn.smart_map.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTOs cho Module Map.
 * Tách Request/Response riêng để linh hoạt.
 */
public class MapDto {

    /** Request: cập nhật thông tin map (không gồm file ảnh) */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Tên bản đồ không được trống")
        @Size(max = 100, message = "Tên tối đa 100 ký tự")
        private String name;

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        private String description;

        @Positive(message = "Chiều rộng phải > 0")
        private Integer width;

        @Positive(message = "Chiều cao phải > 0")
        private Integer height;

        private Boolean isActive;

        @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
        private String notes;
    }

    /** Response: trả về cho client */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private String imageUrl;
        private Integer width;
        private Integer height;
        private Boolean isActive;
        private String notes;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
