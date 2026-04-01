package com.tenpay.dto;

import com.tenpay.model.Transaction;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class TransactionResponse {

    private final String id;      // UUID serializado como String para el cliente
    private final Integer amount;
    private final String merchant;
    private final String tenpistName;
    private final LocalDateTime transactionDate;
    private final String currency;

    public TransactionResponse(Transaction t) {
        this.id = t.getId().toString();
        this.amount = t.getAmount();
        this.merchant = t.getMerchant();
        this.tenpistName = t.getTenpistName();
        this.transactionDate = t.getTransactionDate();
        this.currency = t.getCurrency();
    }
}
