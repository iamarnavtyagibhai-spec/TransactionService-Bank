package com.ninjabank.transaction.client;

import com.ninjabank.transaction.dto.AccountResponse;
import com.ninjabank.transaction.dto.TransferRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class AccountServiceClient {

    private final RestClient restClient;

    public AccountServiceClient(
            @Value("${account.service.url}") String accountServiceUrl) {

        this.restClient = RestClient.builder()
                .baseUrl(accountServiceUrl)
                .build();
    }

    private String resolveAuthToken() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null && attrs.getRequest() != null) {
                String auth = attrs.getRequest().getHeader("Authorization");
                if (auth != null && !auth.isBlank()) {
                    return auth;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    public AccountResponse getAccount(String accountNumber) {
        var spec = restClient.get()
                .uri("/accounts/{accountNumber}", accountNumber);
        String auth = resolveAuthToken();
        if (auth != null) {
            spec.header("Authorization", auth);
        }
        return spec.retrieve().body(AccountResponse.class);
    }

    public AccountResponse transfer(TransferRequest request) {
        var spec = restClient.post()
                .uri("/accounts/transfer")
                .body(request);
        String auth = resolveAuthToken();
        if (auth != null) {
            spec.header("Authorization", auth);
        }
        return spec.retrieve().body(AccountResponse.class);
    }
}