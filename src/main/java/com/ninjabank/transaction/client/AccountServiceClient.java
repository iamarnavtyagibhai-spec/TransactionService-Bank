package com.ninjabank.transaction.client;

import com.ninjabank.transaction.dto.AccountResponse;
import com.ninjabank.transaction.dto.TransferRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AccountServiceClient {

    private final RestClient restClient;

    public AccountServiceClient(
            @Value("${account.service.url}") String accountServiceUrl) {

        this.restClient = RestClient.builder()
                .baseUrl(accountServiceUrl)
                .build();
    }

    public AccountResponse getAccount(String accountNumber) {

        return restClient.get()
                .uri("/accounts/{accountNumber}", accountNumber)
                .retrieve()
                .body(AccountResponse.class);
    }

    public AccountResponse transfer(TransferRequest request) {

        return restClient.post()
                .uri("/accounts/transfer")
                .body(request)
                .retrieve()
                .body(AccountResponse.class);
    }
}