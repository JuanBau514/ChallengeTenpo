package com.tenpay.service;

import com.tenpay.dto.*;
import com.tenpay.model.PasswordResetToken;
import com.tenpay.model.User;
import com.tenpay.repository.PasswordResetTokenRepository;
import com.tenpay.repository.UserRepository;
import com.tenpay.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // @Autowired(required=false): si no hay SMTP configurado Spring no falla al arrancar.
    // El bean solo se inyecta cuando spring-boot-starter-mail puede crearlo correctamente.
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe una cuenta con ese email");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user = userRepository.save(user);

        String token = jwtUtil.generate(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Credenciales incorrectas"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales incorrectas");
        }

        String token = jwtUtil.generate(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getName(), user.getEmail());
    }

    /**
     * @return el token raw si mailEnabled=false (para desarrollo/testing),
     *         null si se envió por email.
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            // No revelar si el email existe — misma respuesta siempre
            return null;
        }

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = sha256(rawToken);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenHash);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(24));
        tokenRepository.save(resetToken);

        if (mailEnabled && mailSender != null) {
            String resetLink = frontendUrl + "?token=" + rawToken + "&page=reset-password";
            sendResetEmail(user.getEmail(), resetLink);
            log.info("[Auth] Email de recuperación enviado a {}", user.getEmail());
            return null;
        }

        // Modo desarrollo: devolver el token en la respuesta para que el usuario
        // pueda completar el flujo sin configurar SMTP.
        log.warn("[DEV] Token de recuperación para {}: {}", user.getEmail(), rawToken);
        return rawToken;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = sha256(request.getToken());

        PasswordResetToken resetToken = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido o expirado"));

        if (!resetToken.isValid()) {
            throw new IllegalArgumentException("Token inválido o expirado");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }

    private void sendResetEmail(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Restablecer contraseña - Tenpay");
        message.setText("Haz clic en el enlace para restablecer tu contraseña:\n\n"
                + resetLink + "\n\nExpira en 24 horas.");
        mailSender.send(message);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
