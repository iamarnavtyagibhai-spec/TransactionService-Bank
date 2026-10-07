package com.ninjabank.transaction.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class WithdrawRequest {

    private String accountNumber;

    private BigDecimal amount;
}