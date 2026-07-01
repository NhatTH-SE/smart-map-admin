package com.fpt.edu.vn.smart_map.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTOs cho Module Station (Trạm phát Beacon).
 */
public class StationDto {

    /** Request: tạo/sửa trạm */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        @NotNull(message = "mapId không được null")
        private Long mapId;

        @NotBlank(message = "Tên trạm không được trống")
        @Size(max = 100, message = "Tên tối đa 100 ký tự")
        private String name;

        @NotBlank(message = "MAC address không được trống")
        @Size(max = 50)
        @Pattern(
                regexp = "^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$",
                message = "MAC address không đúng định dạng (VD: AA:BB:CC:DD:EE:FF)"
        )
        private String macAddress;

        @NotNull(message = "Tọa độ X không được null")
        private Double coordX;

        @NotNull(message = "Tọa độ Y không được null")
        private Double coordY;

        @Size(max = 500)
        private String notes;

        /** ACTIVE / MAINTENANCE / LOST */
        private String status;
    }

    /** Request: chỉ cập nhật trạng thái */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusRequest {
        @NotBlank
        @Pattern(regexp = "ACTIVE|MAINTENANCE|LOST", message = "Status phải là ACTIVE/MAINTENANCE/LOST")
        private String status;
    }

    /** Response */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long mapId;
        private String mapName;
        private String name;
        private String macAddress;
        private Double coordX;
        private Double coordY;
        private String notes;
        private String status;
        private Instant lastSeenAt;
        private Instant createdAt;
        private Instant updatedAt;
        /** NULL = đang hoạt động; có giá trị = đã soft-delete (có thể khôi phục) */
        private Instant deletedAt;
    }
}
