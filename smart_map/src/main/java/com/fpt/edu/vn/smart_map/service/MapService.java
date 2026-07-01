package com.fpt.edu.vn.smart_map.service;

import com.fpt.edu.vn.smart_map.common.exception.ApiException;
import com.fpt.edu.vn.smart_map.dto.MapDto;
import com.fpt.edu.vn.smart_map.entity.MapEntity;
import com.fpt.edu.vn.smart_map.repository.MapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * Service xử lý logic CRUD cho Module Map.
 * - Upload ảnh floorplan
 * - Đọc width/height thật của ảnh
 * - Validate file
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MapService {

    private final MapRepository mapRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 20L * 1024 * 1024; // 20MB
    private static final List<String> ALLOWED_TYPES = List.of(
            "image/png", "image/jpeg", "image/jpg", "image/webp"
    );

    // =========================================================================
    // READ
    // =========================================================================

    public List<MapDto.Response> getAll() {
        return mapRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MapDto.Response> getActive() {
        return mapRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public MapDto.Response getById(Long id) {
        MapEntity entity = mapRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "Không tìm thấy bản đồ với id=" + id));
        return toResponse(entity);
    }

    public MapEntity getEntityById(Long id) {
        return mapRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "Không tìm thấy bản đồ với id=" + id));
    }

    // =========================================================================
    // CREATE - Upload mới (multipart/form-data)
    // =========================================================================

    @Transactional
    public MapDto.Response create(MultipartFile file, String name, String description) {
        validateFile(file);

        // Lưu file + đọc dimensions
        StoredFile stored = saveFile(file);

        // Tạo URL public (qua FileStorageConfig)
        String imageUrl = "/files/maps/" + stored.filename;

        MapEntity entity = MapEntity.builder()
                .name(name)
                .description(description)
                .imageUrl(imageUrl)
                .width(stored.width)
                .height(stored.height)
                .isActive(true)
                .build();

        entity = mapRepository.save(entity);
        log.info("Created map id={} name='{}' file={} ({}x{})",
                entity.getId(), name, stored.filename, stored.width, stored.height);
        return toResponse(entity);
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    @Transactional
    public MapDto.Response update(Long id, MapDto.UpdateRequest req) {
        MapEntity entity = getEntityById(id);

        entity.setName(req.getName());
        if (req.getDescription() != null) entity.setDescription(req.getDescription());
        if (req.getWidth() != null) entity.setWidth(req.getWidth());
        if (req.getHeight() != null) entity.setHeight(req.getHeight());
        if (req.getIsActive() != null) entity.setIsActive(req.getIsActive());
        if (req.getNotes() != null) entity.setNotes(req.getNotes());

        entity = mapRepository.save(entity);
        return toResponse(entity);
    }

    /** Update riêng ảnh (thay floorplan mới) */
    @Transactional
    public MapDto.Response updateImage(Long id, MultipartFile file) {
        validateFile(file);
        MapEntity entity = getEntityById(id);

        // Xóa ảnh cũ
        deletePhysicalFile(entity.getImageUrl());

        StoredFile stored = saveFile(file);
        entity.setImageUrl("/files/maps/" + stored.filename);
        entity.setWidth(stored.width);
        entity.setHeight(stored.height);

        entity = mapRepository.save(entity);
        return toResponse(entity);
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    @Transactional
    public void delete(Long id) {
        MapEntity entity = getEntityById(id);
        deletePhysicalFile(entity.getImageUrl());
        mapRepository.delete(entity);
        log.info("Deleted map id={}", id);
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(400, "File ảnh không được trống");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException(413, "File ảnh vượt quá 20MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException(400, "Chỉ chấp nhận ảnh PNG, JPEG, JPG, WEBP");
        }
    }

    private StoredFile saveFile(MultipartFile file) {
        try {
            // Đảm bảo thư mục tồn tại
            Path dirPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dirPath);

            // Tên file: UUID + extension gốc
            String original = file.getOriginalFilename() == null ? "img" : file.getOriginalFilename();
            String ext = original.contains(".")
                    ? original.substring(original.lastIndexOf('.'))
                    : ".png";
            String filename = UUID.randomUUID() + ext;
            Path target = dirPath.resolve(filename);

            // Lưu file
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }

            // Đọc width/height thật của ảnh
            int width = 0, height = 0;
            try (var in = file.getInputStream()) {
                BufferedImage img = ImageIO.read(in);
                if (img != null) {
                    width = img.getWidth();
                    height = img.getHeight();
                }
            }
            if (width == 0 || height == 0) {
                throw new ApiException(400, "Không đọc được kích thước ảnh, file có thể bị lỗi");
            }

            return new StoredFile(filename, width, height);
        } catch (IOException e) {
            log.error("Failed to save uploaded file", e);
            throw new ApiException(500, "Lỗi lưu file: " + e.getMessage());
        }
    }

    private void deletePhysicalFile(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/files/")) return;
        try {
            String relative = imageUrl.substring("/files/".length());
            Path file = Paths.get(uploadDir).toAbsolutePath().resolve(relative).normalize();
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Failed to delete file {}: {}", imageUrl, e.getMessage());
        }
    }

    private MapDto.Response toResponse(MapEntity e) {
        return MapDto.Response.builder()
                .id(e.getId())
                .name(e.getName())
                .description(e.getDescription())
                .imageUrl(e.getImageUrl())
                .width(e.getWidth())
                .height(e.getHeight())
                .isActive(e.getIsActive())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private record StoredFile(String filename, int width, int height) {}
}
