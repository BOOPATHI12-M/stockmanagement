package com.sudharshini.stockmanagement.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global Exception Handler
 * Returns JSON error responses instead of Whitelabel HTML
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(
            Exception ex, WebRequest request) {
        return buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            ex.getMessage() != null ? ex.getMessage() : "Internal server error",
            request.getDescription(false).replace("uri=", "")
        );
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            NoHandlerFoundException ex, WebRequest request) {
        return buildErrorResponse(
            HttpStatus.NOT_FOUND,
            "The requested resource was not found",
            request.getDescription(false).replace("uri=", "")
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException ex, WebRequest request) {
        return buildErrorResponse(
            HttpStatus.FORBIDDEN,
            "Access denied. You don't have permission to access this resource.",
            request.getDescription(false).replace("uri=", "")
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            IllegalArgumentException ex, WebRequest request) {
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex, WebRequest request) {
        return buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            ex.getMessage() != null ? ex.getMessage() : "Runtime error occurred",
            request.getDescription(false).replace("uri=", "")
        );
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(
            HttpStatus status, String message, String path) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", message);
        errorResponse.put("path", path);
        
        return ResponseEntity.status(status).body(errorResponse);
    }
}
