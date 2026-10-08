package com.ninjabank.transaction.entity;

import com.ninjabank.transaction.enums.TransactionStatus;
import com.ninjabank.transaction.enums.TransactionType;
import com.ninjabank.transaction.risk.RiskLevel;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String transactionId;

    @Column(nullable = false)
    private String fromAccountNumber;

    @Column(nullable = false)
    private String toAccountNumber;

    @Column
    private String accountName;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    @Column
    private Integer riskScore;

    @Enumerated(EnumType.STRING)
    @Column
    private RiskLevel riskLevel;

    @Column
    private String riskFactors;

    @Column(nullable = false)
    private Instant createdAt;
}