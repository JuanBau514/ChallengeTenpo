package com.tenpay.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class TransactionRequest {

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto debe ser mayor a 0")
    private Integer amount;

    @NotBlank(message = "El giro o comercio es obligatorio")
    private String merchant;

    // tenpistName eliminado del request: se auto-puebla desde el usuario autenticado.
    // El campo DB tenpist_name se mantiene por compatibilidad con V1.

    @NotNull(message = "La fecha de transacción es obligatoria")
    @PastOrPresent(message = "La fecha de transacción no puede ser futura")
    private LocalDateTime transactionDate;

    @NotBlank(message = "La moneda es obligatoria")
    @Pattern(regexp = "CLP|COP|USD|EUR", message = "Moneda no soportada. Use CLP, COP, USD o EUR")
    private String currency;
}
