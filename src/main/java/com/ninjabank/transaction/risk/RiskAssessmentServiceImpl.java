package com.ninjabank.transaction.risk;

import com.ninjabank.transaction.client.UserServiceClient;
import com.ninjabank.transaction.dto.RiskAssessmentRequest;
import com.ninjabank.transaction.dto.RiskAssessmentResponse;
import com.ninjabank.transaction.entity.UserRiskProfile;
import com.ninjabank.transaction.enums.TransactionStatus;
import com.ninjabank.transaction.repository.TransactionRepository;
import com.ninjabank.transaction.service.UserRiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskAssessmentServiceImpl implements RiskAssessmentService {

    private final UserRiskService userRiskService;
    private final TransactionRepository transactionRepository;
    private final UserServiceClient userServiceClient;

    @Override
    public RiskAssessmentResponse assessRisk(RiskAssessmentRequest request) {

        UserRiskProfile profile = userRiskService.getOrCreateProfile(request.getUserEmail());

        int score = profile.getRiskScore();
        List<RiskFactor> factors = new ArrayList<>();

        if (score > 0) {
            factors.add(RiskFactor.PREVIOUS_UNSAFE_BEHAVIOR);
        }

        // 1. Large Transaction Check
        if (request.getFromAccountNumber() != null && request.getAmount() != null) {
            BigDecimal averageAmount = transactionRepository.findAverageAmountByFromAccountNumber(
                    request.getFromAccountNumber(),
                    TransactionStatus.SUCCESS
            );

            if (averageAmount != null && averageAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal doubleAvg = averageAmount.multiply(BigDecimal.valueOf(2));
                BigDecimal fiveAvg = averageAmount.multiply(BigDecimal.valueOf(5));

                if (request.getAmount().compareTo(fiveAvg) >= 0) {
                    score += 30;
                    factors.add(RiskFactor.VERY_LARGE_TRANSACTION);
                } else if (request.getAmount().compareTo(doubleAvg) >= 0) {
                    score += 15;
                    factors.add(RiskFactor.LARGE_TRANSACTION);
                }
            }
        }

        // 2. New Receiver Check
        if (request.getFromAccountNumber() != null && request.getToAccountNumber() != null) {
            boolean previouslyUsed = transactionRepository.existsByFromAccountNumberAndToAccountNumberAndStatus(
                    request.getFromAccountNumber(),
                    request.getToAccountNumber(),
                    TransactionStatus.SUCCESS
            );

            if (!previouslyUsed) {
                score += 20;
                factors.add(RiskFactor.NEW_RECEIVER);
            }
        }

        // 3. New Device Check (via UserService)
        boolean isKnownDevice = userServiceClient.isDeviceKnown(request.getUserEmail(), request.getDeviceId());
        if (!isKnownDevice) {
            score += 20;
            factors.add(RiskFactor.NEW_DEVICE);
        }

        // 4. Unusual Transaction Time Check (Deterministic: outside 06:00 - 23:00)
        int currentHour = LocalTime.now(ZoneId.systemDefault()).getHour();
        if (currentHour < 6 || currentHour >= 23) {
            score += 10;
            factors.add(RiskFactor.UNUSUAL_TRANSACTION_TIME);
        }

        // Clamp final score between 0 and 100
        int finalScore = Math.min(100, Math.max(0, score));

        // Determine Risk Level
        RiskLevel level;
        if (finalScore <= 30) {
            level = RiskLevel.LOW;
        } else if (finalScore <= 80) {
            level = RiskLevel.MEDIUM;
        } else {
            level = RiskLevel.HIGH;
        }

        boolean allowedImmediately = (level == RiskLevel.LOW);
        boolean confirmationRequired = (level == RiskLevel.MEDIUM);
        boolean riskPasswordRequired = (level == RiskLevel.HIGH);

        String message;
        if (level == RiskLevel.LOW) {
            message = "Low risk transaction. Approved to proceed.";
        } else if (level == RiskLevel.MEDIUM) {
            message = "Medium risk transaction detected. Explicit user confirmation required.";
        } else {
            message = "High risk transaction detected. Risk Password verification required.";
        }

        return RiskAssessmentResponse.builder()
                .riskScore(finalScore)
                .riskLevel(level)
                .riskFactors(factors)
                .allowedImmediately(allowedImmediately)
                .confirmationRequired(confirmationRequired)
                .riskPasswordRequired(riskPasswordRequired)
                .message(message)
                .build();
    }
}
