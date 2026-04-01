package com.tenpay.repository;

import com.tenpay.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findAllByUserIdOrderByTransactionDateDesc(UUID userId);

    // Usado por DataInitializer para encontrar transacciones sin usuario asignado
    @Query("SELECT t FROM Transaction t WHERE t.user IS NULL ORDER BY t.transactionDate DESC")
    List<Transaction> findAllOrphans();
}
