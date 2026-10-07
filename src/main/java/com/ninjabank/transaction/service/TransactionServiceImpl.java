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

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;

    private final AccountServiceClient accountServiceClient;

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

        // Account Service se balance transfer call karna
        AccountResponse senderAccount = accountServiceClient.transfer(request);

        // Transaction create karna
        Transaction transaction = Transaction.builder()
                .transactionId("TXN-" + UUID.randomUUID())
                .fromAccountNumber(request.getFromAccountNumber())
                .toAccountNumber(request.getToAccountNumber())
                .accountName(senderAccount != null ? senderAccount.getAccountName() : null)
                .amount(request.getAmount())
                .type(TransactionType.TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .createdAt(Instant.now())
                .build();

        return transactionRepository.save(transaction);
    }
}    