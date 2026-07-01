package com.fpt.edu.vn.smart_map.common.exception;

import com.fpt.edu.vn.smart_map.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.stream.Collectors;

/**
 * Bắt mọi exception từ Controller và trả về ApiResponse chuẩn.
 * Giúp frontend luôn nhận được JSON có cùng cấu trúc.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException ex, HttpServletRequest req) {
        log.warn("API exception at {}: {}", req.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(ex.getStatusCode())
                .body(ApiResponse.error(ex.getStatusCode(), ex.getMessage()));
    }

    /** Lỗi validate dữ liệu (@Valid, @NotNull, @Size, ...) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.warn("Validation error: {}", message);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, message));
    }

    /**
     * Lỗi ràng buộc DB (UNIQUE, FK, NOT NULL...).
     * Phải xử lý ở đây vì Hibernate wrap DataIntegrityViolationException bên trong,
     * còn service check trước chỉ giảm race-condition chứ không thay thế được.
     * Phân loại theo tên constraint để trả message tiếng Việt thân thiện.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex,
                                                                  HttpServletRequest req) {
        String root = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();
        log.warn("DataIntegrity violation at {}: {}", req.getRequestURI(), root);

        String userMessage;
        int status = HttpStatus.CONFLICT.value();

        if (root != null) {
            String lower = root.toLowerCase();
            if (lower.contains("uq_stations_mac") || lower.contains("stations.mac_address")) {
                userMessage = "MAC address đã tồn tại trong hệ thống (kể cả trạm đã xóa)";
            } else if (lower.contains("uq_") || lower.contains("unique")) {
                userMessage = "Giá trị này đã tồn tại trong hệ thống";
            } else if (lower.contains("foreign key") || lower.contains("fk_")) {
                userMessage = "Không thể thao tác vì dữ liệu đang được tham chiếu";
            } else if (lower.contains("not null") || lower.contains("cannot insert null")) {
                userMessage = "Thiếu dữ liệu bắt buộc";
            } else {
                userMessage = "Dữ liệu không hợp lệ hoặc bị trùng lặp";
            }
        } else {
            userMessage = "Dữ liệu không hợp lệ hoặc bị trùng lặp";
        }

        return ResponseEntity
                .status(status)
                .body(ApiResponse.error(status, userMessage));
    }

    /** Upload file quá lớn */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error(413, "File upload vượt quá kích thước cho phép"));
    }

    /** Lỗi không xác định -> 500 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception at {}", req.getRequestURI(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, "Lỗi máy chủ nội bộ. Vui lòng thử lại sau."));
    }
}
