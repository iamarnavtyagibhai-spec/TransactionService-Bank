package com.ninjabank.transaction.service;

import com.ninjabank.transaction.dto.DepositRequest;
import com.ninjabank.transaction.dto.TransferRequest;
import com.ninjabank.transaction.dto.WithdrawRequest;
import com.ninjabank.transaction.entity.Transaction;

public interface TransactionService {

    Transaction deposit(DepositRequest request);

    Transaction withdraw(WithdrawRequest request);

    Transaction transfer(TransferRequest request);
}
