package com.fpt.edu.vn.smart_map.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Cấu hình serve file tĩnh (ảnh bản đồ upload lên) ra ngoài.
 *
 * Ví dụ: upload vào ./uploads/maps/abc.png
 *        truy cập: http://localhost:8080/files/maps/abc.png
 */
@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // uploadDir = ./uploads/maps -> request /files/maps/abc.png
        File dir = new File(uploadDir);
        String absolutePath = dir.getAbsolutePath();
        if (!absolutePath.endsWith(File.separator)) {
            absolutePath += File.separator;
        }

        registry.addResourceHandler("/files/maps/**")
                .addResourceLocations("file:" + absolutePath);
    }
}
