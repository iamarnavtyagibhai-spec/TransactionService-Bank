package com.ninjabank.transaction.repository;

import com.ninjabank.transaction.entity.TransactionReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionReviewRepository
        extends JpaRepository<TransactionReview, Long> {

    List<TransactionReview> findByUserEmail(String userEmail);

    List<TransactionReview> findByTransactionId(String transactionId);
}
