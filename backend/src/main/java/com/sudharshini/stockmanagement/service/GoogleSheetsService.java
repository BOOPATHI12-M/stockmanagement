package com.sudharshini.stockmanagement.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.sudharshini.stockmanagement.entity.Order;
import com.sudharshini.stockmanagement.entity.OrderItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Google Sheets Service - Appends order details to a spreadsheet
 */
@Service
public class GoogleSheetsService {

    @Value("${google.sheets.spreadsheet.id:}")
    private String spreadsheetId;

    @Value("${google.sheets.credentials.path:}")
    private String credentialsPath;

    private GoogleCredentials credentials;
    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void init() {
        try {
            if (isConfigured()) {
                credentials = loadCredentials();
                System.out.println("✅ GoogleSheetsService initialized");
            } else {
                System.out.println("ℹ️ GoogleSheetsService not configured. Skipping initialization.");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Failed to initialize GoogleSheetsService: " + e.getMessage());
        }
    }

    private boolean isConfigured() {
        return spreadsheetId != null && !spreadsheetId.isBlank()
                && credentialsPath != null && !credentialsPath.isBlank();
    }

    private GoogleCredentials loadCredentials() throws Exception {
        InputStream credentialsStream;
        if (credentialsPath.startsWith("classpath:")) {
            String classpathLocation = credentialsPath.replace("classpath:", "");
            credentialsStream = new ClassPathResource(classpathLocation).getInputStream();
        } else {
            credentialsStream = Files.newInputStream(Path.of(credentialsPath));
        }

        return GoogleCredentials.fromStream(credentialsStream)
                .createScoped(Collections.singletonList("https://www.googleapis.com/auth/spreadsheets"));
    }

    private String getAccessToken() throws Exception {
        if (credentials == null) {
            credentials = loadCredentials();
        }
        credentials.refreshIfExpired();
        return credentials.getAccessToken().getTokenValue();
    }

    /**
     * Append a single order row to the configured Google Sheet.
     * Columns: A: Order ID, B: Name, C: Phone, D: Quantity, E: Status, F: Address
     */
    public boolean appendOrder(Order order) {
        if (!isConfigured()) {
            System.out.println("ℹ️ Google Sheets integration is not configured. Skipping upload.");
            return false;
        }
        try {
            int totalQuantity = 0;
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item != null && item.getQuantity() != null) {
                        totalQuantity += item.getQuantity();
                    }
                }
            }

            String address = order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "";
            String phone = order.getDeliveryMobile() != null ? order.getDeliveryMobile().trim() : "";
            String name = order.getDeliveryName() != null ? order.getDeliveryName() : "";
            String status = order.getStatus() != null ? order.getStatus().name() : "";

            String url = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";

            Map<String, Object> body = Map.of(
                    "values", List.of(List.of(
                            order.getId(),
                            name,
                            phone,
                            totalQuantity,
                            status,
                            address
                    ))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(getAccessToken());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                System.err.println("❌ Failed to append order to Google Sheet. Status: " + response.getStatusCode());
                return false;
            }

            System.out.println("✅ Order " + order.getId() + " appended to Google Sheet");
            return true;
        } catch (Exception e) {
            System.err.println("❌ Failed to append order to Google Sheet: " + e.getMessage());
            return false;
        }
    }

}

