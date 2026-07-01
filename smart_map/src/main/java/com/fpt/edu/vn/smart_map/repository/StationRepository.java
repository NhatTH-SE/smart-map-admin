package com.fpt.edu.vn.smart_map.repository;

import com.fpt.edu.vn.smart_map.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {

    /**
     * Eager-load map để tránh LazyInitializationException khi map DTO ngoài transaction.
     */
    @Query("SELECT s FROM Station s JOIN FETCH s.map WHERE s.map.id = :mapId ORDER BY s.createdAt DESC")
    List<Station> findByMap_IdOrderByCreatedAtDesc(@Param("mapId") Long mapId);

    @Query("SELECT s FROM Station s JOIN FETCH s.map WHERE s.status = :status ORDER BY s.createdAt DESC")
    List<Station> findByStatusOrderByCreatedAtDesc(@Param("status") String status);

    /** Lấy tất cả trạm (cho trang list admin) */
    @Query("SELECT s FROM Station s JOIN FETCH s.map ORDER BY s.createdAt DESC")
    List<Station> findAllOrderByCreatedAtDesc();

    /** Tìm theo tên/MAC (LIKE, case-insensitive) */
    @Query("""
           SELECT s FROM Station s JOIN FETCH s.map
           WHERE LOWER(s.name)       LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(s.macAddress) LIKE LOWER(CONCAT('%', :q, '%'))
           ORDER BY s.createdAt DESC
           """)
    List<Station> searchByKeyword(@Param("q") String q);

    Optional<Station> findByMacAddress(String macAddress);

    long countByMap_IdAndStatus(Long mapId, String status);

    /** Đếm theo status (toàn hệ thống) — cho dashboard */
    long countByStatus(String status);

    /** Bao gồm cả station đã soft-delete (admin trash view) */
    @Query(value = "SELECT * FROM dbo.stations ORDER BY created_at DESC", nativeQuery = true)
    List<Station> findAllIncludingDeleted();

    @Query(value = "SELECT * FROM dbo.stations WHERE map_id = :mapId ORDER BY created_at DESC", nativeQuery = true)
    List<Station> findByMap_IdIncludingDeleted(@Param("mapId") Long mapId);

    @Query(value = "SELECT * FROM dbo.stations WHERE id = :id", nativeQuery = true)
    Optional<Station> findByIdIncludingDeleted(Long id);
}