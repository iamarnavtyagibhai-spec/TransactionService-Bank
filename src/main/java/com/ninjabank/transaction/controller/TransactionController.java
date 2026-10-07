package com.ninjabank.transaction.controller;

import com.ninjabank.transaction.dto.DepositRequest;
import com.ninjabank.transaction.dto.TransferRequest;
import com.ninjabank.transaction.dto.WithdrawRequest;
import com.ninjabank.transaction.entity.Transaction;
import com.ninjabank.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/deposit")
    public Transaction deposit(
            @RequestBody DepositRequest request) {

        return transactionService.deposit(request);
    }

    @PostMapping("/withdraw")
    public Transaction withdraw(
            @RequestBody WithdrawRequest request) {

        return transactionService.withdraw(request);
    }

    @PostMapping("/transfer")
    public Transaction transfer(
            @RequestBody TransferRequest request) {

        return transactionService.transfer(request);
    }
}