package com.ninjabank.transaction.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_risk_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRiskProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String userEmail;

    @Column(nullable = false)
    @Builder.Default
    private int riskScore = 0;

    @Column(nullable = false)
    @Builder.Default
    private int unsafeCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int safeCount = 0;

    @Column
    private String riskPasswordHash;

    @Column(nullable = false)
    @Builder.Default
    private int failedAttempts = 0;

    @Column
    private Instant rateLimitedUntil;

    @Column
    private Instant frozenUntil;

    @Column
    private Instant updatedAt;
}
