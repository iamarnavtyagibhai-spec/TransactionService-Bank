package com.ninjabank.transaction.service;

import com.ninjabank.transaction.entity.ReviewResult;
import com.ninjabank.transaction.entity.UserRiskProfile;

public interface UserRiskService {

    UserRiskProfile getOrCreateProfile(String userEmail);

    void verifyRiskPassword(String userEmail, String rawPassword);

    void setRiskPassword(String userEmail, String rawPassword);

    void applyReviewResult(String userEmail, ReviewResult result);

    void checkAccountFrozen(String userEmail);
}
