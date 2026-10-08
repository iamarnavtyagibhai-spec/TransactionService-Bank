package com.ninjabank.transaction.service;

import com.ninjabank.transaction.entity.ReviewResult;
import com.ninjabank.transaction.entity.UserRiskProfile;
import com.ninjabank.transaction.repository.UserRiskProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class UserRiskServiceImpl implements UserRiskService {

    private final UserRiskProfileRepository userRiskProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserRiskProfile getOrCreateProfile(String userEmail) {
        return userRiskProfileRepository.findByUserEmail(userEmail)
                .orElseGet(() -> {
                    UserRiskProfile newProfile = UserRiskProfile.builder()
                            .userEmail(userEmail)
                            .riskScore(0)
                            .unsafeCount(0)
                            .safeCount(0)
                            .failedAttempts(0)
                            .updatedAt(Instant.now())
                            .build();
                    return userRiskProfileRepository.save(newProfile);
                });
    }

    @Override
    public void checkAccountFrozen(String userEmail) {
        UserRiskProfile profile = getOrCreateProfile(userEmail);
        if (profile.getFrozenUntil() != null && profile.getFrozenUntil().isAfter(Instant.now())) {
            throw new RuntimeException("Account is frozen for 24 hours due to multiple failed risk password attempts. Transfers are blocked.");
        }
    }

    @Override
    public void verifyRiskPassword(String userEmail, String rawPassword) {
        UserRiskProfile profile = getOrCreateProfile(userEmail);

        checkAccountFrozen(userEmail);

        if (profile.getRateLimitedUntil() != null && profile.getRateLimitedUntil().isAfter(Instant.now())) {
            throw new RuntimeException("Risk password verification temporarily rate-limited. Please try again later.");
        }

        if (profile.getRiskPasswordHash() == null) {
            throw new RuntimeException("Risk password has not been set for this account. Please set a risk password first.");
        }

        if (passwordEncoder.matches(rawPassword, profile.getRiskPasswordHash())) {
            profile.setFailedAttempts(0);
            profile.setRateLimitedUntil(null);
            profile.setUpdatedAt(Instant.now());
            userRiskProfileRepository.save(profile);
            return;
        }

        // Wrong password
        int attempts = profile.getFailedAttempts() + 1;
        profile.setFailedAttempts(attempts);
        profile.setUpdatedAt(Instant.now());

        if (attempts >= 6) {
            profile.setFrozenUntil(Instant.now().plus(24, ChronoUnit.HOURS));
            userRiskProfileRepository.save(profile);
            throw new RuntimeException("Incorrect risk password. 6th failed attempt: Account frozen for 24 hours. Transfers blocked.");
        }

        if (attempts == 5) {
            profile.setRateLimitedUntil(Instant.now().plus(15, ChronoUnit.MINUTES));
            userRiskProfileRepository.save(profile);
            throw new RuntimeException("Incorrect risk password. 5th failed attempt: Risk verification temporarily rate-limited for 15 minutes.");
        }

        if (attempts == 4) {
            userRiskProfileRepository.save(profile);
            throw new RuntimeException("Incorrect risk password. Security Warning: 4th failed attempt. Further failures will restrict your account.");
        }

        userRiskProfileRepository.save(profile);
        throw new RuntimeException("Incorrect risk password. Attempt " + attempts + " of 3 before security warnings.");
    }

    @Override
    public void setRiskPassword(String userEmail, String rawPassword) {
        if (rawPassword == null || rawPassword.trim().length() < 4) {
            throw new RuntimeException("Risk password must be at least 4 characters long.");
        }
        UserRiskProfile profile = getOrCreateProfile(userEmail);
        profile.setRiskPasswordHash(passwordEncoder.encode(rawPassword));
        profile.setFailedAttempts(0);
        profile.setRateLimitedUntil(null);
        profile.setUpdatedAt(Instant.now());
        userRiskProfileRepository.save(profile);
    }

    @Override
    public void applyReviewResult(String userEmail, ReviewResult result) {
        UserRiskProfile profile = getOrCreateProfile(userEmail);
        int current = profile.getRiskScore();

        if (result == ReviewResult.UNSAFE) {
            profile.setRiskScore(Math.min(100, current + 15));
            profile.setUnsafeCount(profile.getUnsafeCount() + 1);
        } else if (result == ReviewResult.SAFE) {
            profile.setRiskScore(Math.max(0, current - 5));
            profile.setSafeCount(profile.getSafeCount() + 1);
        }

        profile.setUpdatedAt(Instant.now());
        userRiskProfileRepository.save(profile);
    }
}
