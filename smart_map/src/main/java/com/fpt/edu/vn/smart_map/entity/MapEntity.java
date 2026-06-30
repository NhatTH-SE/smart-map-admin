package com.fpt.edu.vn.smart_map.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity cho bảng MAPS.
 * Quản lý nhiều bản đồ (nhiều tầng, nhiều khu vực).
 * Lưu ý: class name là MapEntity để tránh xung đột với java.util.Map.
 */
@Entity
@Table(name = "maps", schema = "dbo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    /** Đường dẫn URL tới ảnh bản đồ (relative hoặc absolute) */
    @Column(name = "image_url", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String imageUrl;

    /** Chiều rộng ảnh gốc (pixels) - dùng để scale marker */
    @Column(nullable = false)
    private Integer width;

    /** Chiều cao ảnh gốc (pixels) */
    @Column(nullable = false)
    private Integer height;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /** Ghi chú / mô tả chi tiết bản đồ */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
