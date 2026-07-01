package com.fpt.edu.vn.smart_map.repository;

import com.fpt.edu.vn.smart_map.entity.MapEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MapRepository extends JpaRepository<MapEntity, Long> {

    /** Active list (filter deleted_at IS NULL đã apply ở @SQLRestriction) */
    List<MapEntity> findAllByOrderByCreatedAtDesc();

    List<MapEntity> findByIsActiveTrueOrderByCreatedAtDesc();

    /** Bao gồm cả map đã soft-delete (dùng cho admin trash view) */
    @Query(value = "SELECT * FROM dbo.maps ORDER BY created_at DESC", nativeQuery = true)
    List<MapEntity> findAllIncludingDeleted();

    @Query(value = "SELECT * FROM dbo.maps WHERE id = :id", nativeQuery = true)
    Optional<MapEntity> findByIdIncludingDeleted(Long id);
}