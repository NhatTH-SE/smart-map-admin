package com.fpt.edu.vn.smart_map.common.exception;

/**
 * Exception chuẩn của dự án. Throw exception này -> GlobalExceptionHandler sẽ bắt và trả về ApiResponse chuẩn.
 *
 * Ví dụ:
 *   throw new ApiException(404, "Không tìm thấy bản đồ");
 */
public class ApiException extends RuntimeException {

    private final int statusCode;

    public ApiException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
