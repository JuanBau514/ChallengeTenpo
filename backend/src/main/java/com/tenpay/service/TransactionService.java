package com.tenpay.service;

import com.tenpay.dto.TransactionRequest;
import com.tenpay.dto.TransactionResponse;
import com.tenpay.model.Transaction;
import com.tenpay.model.User;
import com.tenpay.repository.TransactionRepository;
import com.tenpay.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public List<TransactionResponse> findAllByUser(UUID userId) {
        return transactionRepository
                .findAllByUserIdOrderByTransactionDateDesc(userId)
                .stream()
                .map(TransactionResponse::new)
                .toList();
    }

    public TransactionResponse create(TransactionRequest request, UUID userId) {
        User user = userRepository.getReferenceById(userId);

        Transaction transaction = new Transaction();
        transaction.setAmount(request.getAmount());
        transaction.setMerchant(request.getMerchant());
        // tenpistName auto-poblado desde el usuario autenticado.
        // El campo persiste por compatibilidad con el esquema V1.
        transaction.setTenpistName(user.getName());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setCurrency(request.getCurrency());
        transaction.setUser(user);

        return new TransactionResponse(transactionRepository.save(transaction));
    }
}
