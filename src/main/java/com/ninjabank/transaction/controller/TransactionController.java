package com.ninjabank.transaction.controller;

import com.ninjabank.transaction.dto.DepositRequest;
import com.ninjabank.transaction.dto.RiskAssessmentRequest;
import com.ninjabank.transaction.dto.RiskAssessmentResponse;
import com.ninjabank.transaction.dto.TransferRequest;
import com.ninjabank.transaction.dto.WithdrawRequest;
import com.ninjabank.transaction.entity.Transaction;
import com.ninjabank.transaction.risk.RiskAssessmentService;
import com.ninjabank.transaction.service.TransactionService;
import com.ninjabank.transaction.service.UserRiskService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final RiskAssessmentService riskAssessmentService;
    private final UserRiskService userRiskService;

    @PostMapping("/deposit")
    public Transaction deposit(
            @RequestBody DepositRequest request) {

        return transactionService.deposit(request);
    }

    @PostMapping("/withdraw")
    public Transaction withdraw(
            @RequestBody WithdrawRequest request) {

        return transactionService.withdraw(request);
    }

    @PostMapping("/transfer")
    public Transaction transfer(
            @RequestBody TransferRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId,
            HttpServletRequest httpRequest) {

        request.setDeviceId(resolveDeviceId(request.getDeviceId(), headerDeviceId, httpRequest));
        return transactionService.transfer(request);
    }

    @PostMapping("/assess-risk")
    public RiskAssessmentResponse assessRisk(
            @RequestBody RiskAssessmentRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId,
            HttpServletRequest httpRequest) {

        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        request.setUserEmail(userEmail);
        request.setDeviceId(resolveDeviceId(request.getDeviceId(), headerDeviceId, httpRequest));
        return riskAssessmentService.assessRisk(request);
    }

    @PostMapping("/risk-password")
    public Map<String, String> setRiskPassword(
            @RequestBody Map<String, String> payload) {

        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        String password = payload.get("password");
        userRiskService.setRiskPassword(userEmail, password);
        return Map.of("message", "Risk password set successfully");
    }

    private String resolveDeviceId(String bodyDeviceId, String headerDeviceId, HttpServletRequest httpRequest) {
        if (bodyDeviceId != null && !bodyDeviceId.isBlank()) {
            return bodyDeviceId.trim();
        }
        if (headerDeviceId != null && !headerDeviceId.isBlank()) {
            return headerDeviceId.trim();
        }
        String userAgent = httpRequest.getHeader("User-Agent");
        if (userAgent != null && !userAgent.isBlank()) {
            return DigestUtils.md5DigestAsHex(userAgent.getBytes(StandardCharsets.UTF_8));
        }
        return "UNKNOWN_DEVICE";
    }
}