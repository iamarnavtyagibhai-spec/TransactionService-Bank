package com.ninjabank.transaction.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AccountResponse {

    private String accountNumber;

    private String accountName;

    private BigDecimal balance;

    private String accountStatus;
}
