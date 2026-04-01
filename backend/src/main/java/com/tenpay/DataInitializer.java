package com.tenpay;

import com.tenpay.model.User;
import com.tenpay.repository.TransactionRepository;
import com.tenpay.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Corre una sola vez al arrancar la aplicación, DESPUÉS de que Flyway
 * ejecuta todas las migraciones SQL y DESPUÉS de que el contexto Spring
 * está completamente inicializado.
 *
 * Responsabilidades:
 *  1. Crear el usuario por defecto si no existe (jbautistaclavijo@gmail.com).
 *  2. Asignar las transacciones huérfanas (user_id = null) a ese usuario.
 *     Esto cubre transacciones creadas antes de que existiera el sistema de auth.
 *
 * Por qué ApplicationRunner y no @PostConstruct o CommandLineRunner:
 *  ApplicationRunner corre después de que toda la inicialización del contexto
 *  termina, incluida la validación del esquema JPA. Es el lugar correcto para
 *  lógica de seed de datos.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private static final String DEFAULT_EMAIL    = "jbautistaclavijo@gmail.com";
    private static final String DEFAULT_NAME     = "Juan Bautista";
    private static final String DEFAULT_PASSWORD = "Tenpay2026!";

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User defaultUser = userRepository.findByEmail(DEFAULT_EMAIL)
                .orElseGet(this::createDefaultUser);

        assignOrphanTransactions(defaultUser);
    }

    private User createDefaultUser() {
        User user = new User();
        user.setName(DEFAULT_NAME);
        user.setEmail(DEFAULT_EMAIL);
        user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
        User saved = userRepository.save(user);

        log.warn("=====================================================");
        log.warn("[DataInitializer] Usuario por defecto creado:");
        log.warn("  Email   : {}", DEFAULT_EMAIL);
        log.warn("  Password: {}", DEFAULT_PASSWORD);
        log.warn("  CAMBIA ESTA PASSWORD en producción.");
        log.warn("=====================================================");

        return saved;
    }

    private void assignOrphanTransactions(User user) {
        var orphans = transactionRepository.findAllOrphans();
        if (orphans.isEmpty()) return;

        orphans.forEach(t -> {
            t.setUser(user);
            if (t.getTenpistName() == null || t.getTenpistName().isBlank()) {
                t.setTenpistName(user.getName());
            }
        });
        transactionRepository.saveAll(orphans);
        log.info("[DataInitializer] {} transacciones huérfanas asignadas a {}",
                orphans.size(), DEFAULT_EMAIL);
    }
}
