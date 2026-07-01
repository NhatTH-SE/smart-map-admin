package com.fpt.edu.vn.smart_map.repository;

import com.fpt.edu.vn.smart_map.entity.MapEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MapRepository extends JpaRepository<MapEntity, Long> {

    List<MapEntity> findAllByOrderByCreatedAtDesc();

    List<MapEntity> findByIsActiveTrueOrderByCreatedAtDesc();
}
