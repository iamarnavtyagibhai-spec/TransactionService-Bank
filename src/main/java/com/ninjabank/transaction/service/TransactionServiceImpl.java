package com.ninjabank.transaction.service;

import com.ninjabank.transaction.client.AccountServiceClient;
import com.ninjabank.transaction.dto.AccountResponse;
import com.ninjabank.transaction.dto.DepositRequest;
import com.ninjabank.transaction.dto.TransferRequest;
import com.ninjabank.transaction.dto.WithdrawRequest;
import com.ninjabank.transaction.entity.Transaction;
import com.ninjabank.transaction.enums.TransactionStatus;
import com.ninjabank.transaction.enums.TransactionType;
import com.ninjabank.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import com.ninjabank.transaction.client.UserServiceClient;
import com.ninjabank.transaction.dto.RiskAssessmentRequest;
import com.ninjabank.transaction.dto.RiskAssessmentResponse;
import com.ninjabank.transaction.risk.RiskAssessmentService;
import com.ninjabank.transaction.risk.RiskLevel;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;

    private final AccountServiceClient accountServiceClient;

    private final RiskAssessmentService riskAssessmentService;

    private final UserRiskService userRiskService;

    private final UserServiceClient userServiceClient;

    @Override
    public Transaction deposit(DepositRequest request) {

        // Account Service se account details lena
        AccountResponse account = accountServiceClient.getAccount(request.getAccountNumber());

        // Account exist nahi karta
        if (account == null) {
            throw new RuntimeException("Account not found");
        }

        // Account active nahi hai
        if (!"ACTIVE".equals(account.getAccountStatus())) {
            throw new RuntimeException("Account is not active");
        }

        // Transaction create
        Transaction transaction = Transaction.builder()
                .transactionId("TXN-" + UUID.randomUUID())
                .fromAccountNumber("CASH")
                .toAccountNumber(account.getAccountNumber())
                .accountName(account.getAccountName())
                .amount(request.getAmount())
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .createdAt(Instant.now())
                .build();

        return transactionRepository.save(transaction);
    }

    @Override
    public Transaction withdraw(WithdrawRequest request) {

        // Account Service se account details lena
        AccountResponse account = accountServiceClient.getAccount(request.getAccountNumber());

        if (account == null) {
            throw new RuntimeException("Account not found");
        }

        if (!"ACTIVE".equals(account.getAccountStatus())) {
            throw new RuntimeException("Account is not active");
        }

        // Balance check
        if (account.getBalance()
                .compareTo(request.getAmount()) < 0) {

            throw new RuntimeException("Insufficient balance");
        }

        // Transaction create
        Transaction transaction = Transaction.builder()
                .transactionId("TXN-" + UUID.randomUUID())
                .fromAccountNumber(account.getAccountNumber())
                .toAccountNumber("CASH")
                .accountName(account.getAccountName())
                .amount(request.getAmount())
                .type(TransactionType.WITHDRAW)
                .status(TransactionStatus.SUCCESS)
                .createdAt(Instant.now())
                .build();

        return transactionRepository.save(transaction);
    }

    @Override  
    public Transaction transfer(TransferRequest request) {

        // 1. Authenticated user email from Spring Security (JWT)
        String userEmail = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;

        if (userEmail == null || userEmail.isBlank() || "anonymousUser".equalsIgnoreCase(userEmail)) {
            throw new RuntimeException("Unauthorized: Authenticated user not found in security context");
        }

        // 2. Check if account is frozen
        userRiskService.checkAccountFrozen(userEmail);

        // 3. Assess risk
        RiskAssessmentRequest riskRequest = RiskAssessmentRequest.builder()
                .userEmail(userEmail)
                .fromAccountNumber(request.getFromAccountNumber())
                .toAccountNumber(request.getToAccountNumber())
                .amount(request.getAmount())
                .deviceId(request.getDeviceId())
                .build();

        RiskAssessmentResponse riskResponse = riskAssessmentService.assessRisk(riskRequest);

        // 4. Decision enforcement
        if (riskResponse.getRiskLevel() == RiskLevel.HIGH) {
            if (request.getRiskPassword() == null || request.getRiskPassword().isBlank()) {
                throw new RuntimeException("HIGH risk transaction detected (Risk Score: "
                        + riskResponse.getRiskScore() + "). Risk Password is required to complete this transfer.");
            }
            userRiskService.verifyRiskPassword(userEmail, request.getRiskPassword());
        } else if (riskResponse.getRiskLevel() == RiskLevel.MEDIUM) {
            if (!Boolean.TRUE.equals(request.getConfirmed())) {
                throw new RuntimeException("MEDIUM risk transaction detected (Risk Score: "
                        + riskResponse.getRiskScore() + "). Explicit confirmation required.");
            }
        }

        // 5. Account Service se balance transfer call karna
        AccountResponse senderAccount = accountServiceClient.transfer(request);

        // 6. Register device in UserService
        if (request.getDeviceId() != null && !request.getDeviceId().isBlank()) {
            userServiceClient.registerDevice(userEmail, request.getDeviceId());
        }

        // 7. Format risk factors for storage
        String factorsStr = null;
        if (riskResponse.getRiskFactors() != null && !riskResponse.getRiskFactors().isEmpty()) {
            factorsStr = riskResponse.getRiskFactors().stream()
                    .map(Enum::name)
                    .collect(Collectors.joining(","));
        }

        // 8. Transaction create karna
        Transaction transaction = Transaction.builder()
                .transactionId("TXN-" + UUID.randomUUID())
                .fromAccountNumber(request.getFromAccountNumber())
                .toAccountNumber(request.getToAccountNumber())
                .accountName(senderAccount != null ? senderAccount.getAccountName() : null)
                .amount(request.getAmount())
                .type(TransactionType.TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .riskScore(riskResponse.getRiskScore())
                .riskLevel(riskResponse.getRiskLevel())
                .riskFactors(factorsStr)
                .createdAt(Instant.now())
                .build();

        return transactionRepository.save(transaction);
    }
}    