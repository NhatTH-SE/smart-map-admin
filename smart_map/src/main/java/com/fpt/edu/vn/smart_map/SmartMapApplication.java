package com.fpt.edu.vn.smart_map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Spring Boot 4.x không tự động scan entity/repository ở sub-package nếu thiếu config.
 * Khai báo tường minh để chắc chắn JPA tìm thấy.
 */
@SpringBootApplication
@EntityScan(basePackages = "com.fpt.edu.vn.smart_map.entity")
@EnableJpaRepositories(basePackages = "com.fpt.edu.vn.smart_map.repository")
@ComponentScan(basePackages = "com.fpt.edu.vn.smart_map")
public class SmartMapApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartMapApplication.class, args);
    }

}
