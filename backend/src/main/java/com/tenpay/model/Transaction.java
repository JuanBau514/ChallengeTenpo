package com.tenpay.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false)
    private String merchant;

    // tenpist_name se mantiene por compatibilidad con V1.
    // En el flujo actual se auto-puebla con el nombre del usuario autenticado;
    // el formulario no lo expone al usuario.
    @Column(name = "tenpist_name", nullable = false)
    private String tenpistName;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(nullable = false, length = 3)
    private String currency;

    // FK al usuario propietario de la transacción.
    // FetchType.LAZY: no carga el User completo en cada query de transacciones.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
