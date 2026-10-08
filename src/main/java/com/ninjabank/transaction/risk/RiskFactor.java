package com.ninjabank.transaction.risk;

public enum RiskFactor {
    LARGE_TRANSACTION,
    VERY_LARGE_TRANSACTION,
    NEW_RECEIVER,
    NEW_DEVICE,
    UNUSUAL_TRANSACTION_TIME,
    PREVIOUS_UNSAFE_BEHAVIOR
}
