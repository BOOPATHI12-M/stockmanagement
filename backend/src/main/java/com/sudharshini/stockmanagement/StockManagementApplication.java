package com.sudharshini.stockmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main Spring Boot Application
 * Sudharshini Stock Management System
 */
@SpringBootApplication
@EnableAsync
public class StockManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(StockManagementApplication.class, args);
    }
}

