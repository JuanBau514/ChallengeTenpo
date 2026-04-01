package com.tenpay.controller;

import com.tenpay.dto.*;
import com.tenpay.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String rawToken = authService.forgotPassword(request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Si el email existe, recibirás las instrucciones en breve.");

        // rawToken != null solo cuando MAIL_ENABLED=false (modo desarrollo).
        // En producción con SMTP configurado este campo no aparece en la respuesta.
        if (rawToken != null) {
            response.put("devToken", rawToken);
        }

        return response;
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return Map.of("message", "Contraseña actualizada correctamente");
    }
}
