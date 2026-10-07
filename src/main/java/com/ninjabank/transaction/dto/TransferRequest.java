package com.ninjabank.transaction.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransferRequest {

    private String fromAccountNumber;

    private String toAccountNumber;

    private BigDecimal amount;
}
