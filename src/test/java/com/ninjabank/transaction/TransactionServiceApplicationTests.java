package com.ninjabank.transaction;

import com.ninjabank.transaction.security.JwtService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TransactionServiceApplicationTests {

    @BeforeAll
    static void setupEnv() {
        TransactionServiceApplication.loadDotenv();
    }

    @Autowired
    private JwtService jwtService;

    @Value("${jwt.secret}")
    private String secret;

    @Test
    void testJwtServiceAndValidation() {
        String testUser = "testuser@ninjabank.com";

        // Generate token
        String token = Jwts.builder()
                .setSubject(testUser)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes()), SignatureAlgorithm.HS256)
                .compact();

        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token));
        assertEquals(testUser, jwtService.extractUsername(token));
        System.out.println("VALID_TOKEN: " + token);
    }
}
