package com.ninjabank.transaction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class TransactionServiceApplication {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(TransactionServiceApplication.class, args);
    }

    public static void loadDotenv() {
        try {
            Path envPath = Paths.get(".env");
            if (Files.exists(envPath)) {
                Files.lines(envPath)
                        .map(String::trim)
                        .filter(line -> !line.isEmpty() && !line.startsWith("#") && line.contains("="))
                        .forEach(line -> {
                            int idx = line.indexOf('=');
                            String key = line.substring(0, idx).trim();
                            String value = line.substring(idx + 1).trim();
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        });
            }
        } catch (Exception ignored) {
        }
    }
}
