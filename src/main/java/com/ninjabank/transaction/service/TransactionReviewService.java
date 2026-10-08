package com.ninjabank.transaction.service;

import com.ninjabank.transaction.entity.TransactionReview;
import com.ninjabank.transaction.entity.ReviewResult;

import java.util.List;

public interface TransactionReviewService {

    TransactionReview reviewTransaction(
            String transactionId,
            String userEmail,
            ReviewResult result,
            String reviewedBy
    );

    List<TransactionReview> getReviewsByUser(String userEmail);

    TransactionReview getReviewByTransactionId(String transactionId);
}
