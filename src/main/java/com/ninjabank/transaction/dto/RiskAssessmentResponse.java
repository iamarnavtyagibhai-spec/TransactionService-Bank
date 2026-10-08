package com.ninjabank.transaction.dto;

import com.ninjabank.transaction.risk.RiskFactor;
import com.ninjabank.transaction.risk.RiskLevel;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentResponse {

    private int riskScore;

    private RiskLevel riskLevel;

    private List<RiskFactor> riskFactors;

    private boolean allowedImmediately;

    private boolean confirmationRequired;

    private boolean riskPasswordRequired;

    private String message;
}
