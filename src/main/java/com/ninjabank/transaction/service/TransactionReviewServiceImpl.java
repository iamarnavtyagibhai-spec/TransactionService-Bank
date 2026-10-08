package com.ninjabank.transaction.service;

import com.ninjabank.transaction.entity.ReviewResult;
import com.ninjabank.transaction.entity.TransactionReview;
import com.ninjabank.transaction.repository.TransactionReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionReviewServiceImpl
        implements TransactionReviewService {

    private final TransactionReviewRepository transactionReviewRepository;
    private final UserRiskService userRiskService;

    @Override
    public TransactionReview reviewTransaction(
            String transactionId,
            String userEmail,
            ReviewResult result,
            String reviewedBy) {

        TransactionReview review = TransactionReview.builder()
                .transactionId(transactionId)
                .userEmail(userEmail)
                .result(result)
                .reviewedBy(reviewedBy)
                .reviewedAt(Instant.now())
                .build();

        TransactionReview savedReview = transactionReviewRepository.save(review);
        userRiskService.applyReviewResult(userEmail, result);
        return savedReview;
    }

    @Override
    public List<TransactionReview> getReviewsByUser(String userEmail) {

        return transactionReviewRepository
                .findByUserEmail(userEmail);
    }

    @Override
    public TransactionReview getReviewByTransactionId(
            String transactionId) {

        return transactionReviewRepository
                .findByTransactionId(transactionId)
                .stream()
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "Review not found"));
    }
}
