package com.ninjabank.transaction.repository;

import com.ninjabank.transaction.entity.UserRiskProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRiskProfileRepository
        extends JpaRepository<UserRiskProfile, Long> {

    Optional<UserRiskProfile> findByUserEmail(String userEmail);
}
