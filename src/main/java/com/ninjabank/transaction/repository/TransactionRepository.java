package com.ninjabank.transaction.repository;

import com.ninjabank.transaction.entity.Transaction;
import com.ninjabank.transaction.enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    @Query("SELECT AVG(t.amount) FROM Transaction t WHERE t.fromAccountNumber = :fromAccountNumber AND t.status = :status")
    BigDecimal findAverageAmountByFromAccountNumber(
            @Param("fromAccountNumber") String fromAccountNumber,
            @Param("status") TransactionStatus status
    );

    boolean existsByFromAccountNumberAndToAccountNumberAndStatus(
            String fromAccountNumber,
            String toAccountNumber,
            TransactionStatus status
    );
}