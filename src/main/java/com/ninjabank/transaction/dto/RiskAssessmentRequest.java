package com.ninjabank.transaction.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentRequest {

    private String userEmail;

    private String fromAccountNumber;

    private String toAccountNumber;

    private BigDecimal amount;

    private String deviceId;
}
