package com.fpt.edu.vn.smart_map.service;

import com.fpt.edu.vn.smart_map.common.exception.ApiException;
import com.fpt.edu.vn.smart_map.dto.StationDto;
import com.fpt.edu.vn.smart_map.entity.MapEntity;
import com.fpt.edu.vn.smart_map.entity.Station;
import com.fpt.edu.vn.smart_map.repository.MapRepository;
import com.fpt.edu.vn.smart_map.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StationService {

    private final StationRepository stationRepository;
    private final MapRepository mapRepository;

    // =========================================================================
    // READ
    // =========================================================================

    @Transactional(readOnly = true)
    public List<StationDto.Response> getByMapId(Long mapId) {
        return stationRepository.findByMap_IdOrderByCreatedAtDesc(mapId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StationDto.Response> getByMapIdIncludingDeleted(Long mapId) {
        return stationRepository.findByMap_IdIncludingDeleted(mapId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StationDto.Response> getByStatus(String status) {
        return stationRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StationDto.Response> getAll() {
        return stationRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StationDto.Response> getAllIncludingDeleted() {
        return stationRepository.findAllIncludingDeleted().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StationDto.Response> search(String keyword) {
        if (keyword == null || keyword.isBlank()) return getAll();
        return stationRepository.searchByKeyword(keyword.trim()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getCountByStatus() {
        java.util.Map<String, Long> stats = new java.util.LinkedHashMap<>();
        for (String s : java.util.List.of("ACTIVE", "MAINTENANCE", "LOST")) {
            stats.put(s, stationRepository.countByStatus(s));
        }
        return stats;
    }

    @Transactional(readOnly = true)
    public StationDto.Response getById(Long id) {
        return toResponse(getEntityById(id));
    }

    public Station getEntityById(Long id) {
        return stationRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "Không tìm thấy trạm với id=" + id));
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    @Transactional
    public StationDto.Response create(StationDto.Request req) {
        MapEntity map = mapRepository.findById(req.getMapId())
                .orElseThrow(() -> new ApiException(404, "Không tìm thấy bản đồ với id=" + req.getMapId()));

        // Check trùng MAC
        if (stationRepository.findByMacAddress(req.getMacAddress()).isPresent()) {
            throw new ApiException(409, "MAC address đã tồn tại trong hệ thống");
        }

        Station station = Station.builder()
                .map(map)
                .name(req.getName())
                .macAddress(req.getMacAddress().toUpperCase())
                .coordX(req.getCoordX())
                .coordY(req.getCoordY())
                .notes(req.getNotes())
                .status(req.getStatus() != null ? req.getStatus() : "ACTIVE")
                .build();

        station = stationRepository.save(station);
        log.info("Created station id={} name='{}' mac={} at ({},{})",
                station.getId(), station.getName(), station.getMacAddress(),
                station.getCoordX(), station.getCoordY());
        return toResponse(station);
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    @Transactional
    public StationDto.Response update(Long id, StationDto.Request req) {
        Station station = getEntityById(id);

        // Nếu đổi MAC thì check trùng
        if (!station.getMacAddress().equalsIgnoreCase(req.getMacAddress())
                && stationRepository.findByMacAddress(req.getMacAddress()).isPresent()) {
            throw new ApiException(409, "MAC address đã tồn tại trong hệ thống");
        }

        station.setName(req.getName());
        station.setMacAddress(req.getMacAddress().toUpperCase());
        station.setCoordX(req.getCoordX());
        station.setCoordY(req.getCoordY());
        station.setNotes(req.getNotes());
        if (req.getStatus() != null) {
            station.setStatus(req.getStatus());
        }

        return toResponse(stationRepository.save(station));
    }

    @Transactional
    public StationDto.Response updateStatus(Long id, String status) {
        Station station = getEntityById(id);
        station.setStatus(status);
        return toResponse(stationRepository.save(station));
    }

    // =========================================================================
    // DELETE / RESTORE (soft delete)
    // =========================================================================

    /** Soft delete: chỉ set deletedAt, không xóa row. */
    @Transactional
    public void delete(Long id) {
        Station station = getEntityById(id); // đã filter deleted_at IS NULL
        station.setDeletedAt(Instant.now());
        stationRepository.save(station);
        log.info("Soft-deleted station id={}", id);
    }

    /** Khôi phục station đã soft-delete. */
    @Transactional
    public StationDto.Response restore(Long id) {
        Station station = stationRepository.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new ApiException(404, "Không tìm thấy trạm với id=" + id));
        if (station.getDeletedAt() == null) {
            throw new ApiException(409, "Trạm chưa bị xóa");
        }
        station.setDeletedAt(null);
        Station saved = stationRepository.save(station);
        log.info("Restored station id={}", id);
        return toResponse(saved);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private StationDto.Response toResponse(Station s) {
        return StationDto.Response.builder()
                .id(s.getId())
                .mapId(s.getMap() != null ? s.getMap().getId() : null)
                .mapName(s.getMap() != null ? s.getMap().getName() : null)
                .name(s.getName())
                .macAddress(s.getMacAddress())
                .coordX(s.getCoordX())
                .coordY(s.getCoordY())
                .notes(s.getNotes())
                .status(s.getStatus())
                .lastSeenAt(s.getLastSeenAt())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .deletedAt(s.getDeletedAt())
                .build();
    }
}
