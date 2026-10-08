package com.ninjabank.transaction.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class UserServiceClient {

    private final RestClient restClient;

    public UserServiceClient(
            @Value("${user.service.url:https://userservice-bank.onrender.com}") String userServiceUrl) {

        this.restClient = RestClient.builder()
                .baseUrl(userServiceUrl)
                .build();
    }

    public boolean isDeviceKnown(String userEmail, String deviceId) {
        if (deviceId == null || deviceId.isBlank() || userEmail == null) {
            return false;
        }

        try {
            Map<String, Boolean> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/users/devices/verify")
                            .queryParam("email", userEmail)
                            .queryParam("deviceId", deviceId)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Boolean>>() {});

            return response != null && Boolean.TRUE.equals(response.get("known"));
        } catch (Exception e) {
            // If user service is unreachable or device not found, treat as unknown for safety
            return false;
        }
    }

    public void registerDevice(String userEmail, String deviceId) {
        if (deviceId == null || deviceId.isBlank() || userEmail == null) {
            return;
        }

        try {
            restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/users/devices/register")
                            .queryParam("email", userEmail)
                            .queryParam("deviceId", deviceId)
                            .build())
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // Non-blocking background registration
        }
    }

    public org.springframework.http.ResponseEntity<?> proxySignup(Map<String, Object> request) {
        try {
            String response = restClient.post()
                    .uri("/auth/signup")
                    .body(request)
                    .retrieve()
                    .body(String.class);
            return org.springframework.http.ResponseEntity.ok(response);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            return org.springframework.http.ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body("UserService Error: " + e.getMessage());
        }
    }

    public org.springframework.http.ResponseEntity<?> proxyLogin(Map<String, Object> request) {
        try {
            String response = restClient.post()
                    .uri("/auth/login")
                    .body(request)
                    .retrieve()
                    .body(String.class);
            return org.springframework.http.ResponseEntity.ok(response);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            return org.springframework.http.ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body("UserService Error: " + e.getMessage());
        }
    }

    public org.springframework.http.ResponseEntity<?> proxyVerifyOtp(Map<String, Object> request) {
        try {
            String response = restClient.post()
                    .uri("/auth/verify-otp")
                    .body(request)
                    .retrieve()
                    .body(String.class);
            return org.springframework.http.ResponseEntity.ok(response);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            return org.springframework.http.ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body("UserService Error: " + e.getMessage());
        }
    }
}
