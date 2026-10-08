package com.ninjabank.transaction.risk;

import com.ninjabank.transaction.dto.RiskAssessmentRequest;
import com.ninjabank.transaction.dto.RiskAssessmentResponse;

public interface RiskAssessmentService {

    RiskAssessmentResponse assessRisk(RiskAssessmentRequest request);
}
