package com.fpt.edu.vn.smart_map.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity cho bảng STATIONS.
 * Mỗi trạm là 1 iTag/Beacon được gắn ở 1 vị trí trên bản đồ.
 */
@Entity
@Table(name = "stations", schema = "dbo", uniqueConstraints = @UniqueConstraint(name = "uq_stations_mac", columnNames = "mac_address"))
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "map_id", nullable = false)
    private MapEntity map;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "mac_address", nullable = false, length = 50)
    private String macAddress;

    @Column(name = "coord_x", nullable = false)
    private Double coordX;

    @Column(name = "coord_y", nullable = false)
    private Double coordY;

    @Column(length = 500)
    private String notes;

    /** ACTIVE / MAINTENANCE / LOST */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    /** Soft delete: NULL = đang hoạt động, có giá trị = đã xóa */
    @Column(name = "deleted_at")
    private Instant deletedAt;
}
