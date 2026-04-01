package com.tenpay.controller;

import com.tenpay.dto.TransactionRequest;
import com.tenpay.dto.TransactionResponse;
import com.tenpay.model.User;
import com.tenpay.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService service;

    @GetMapping
    public List<TransactionResponse> getAll(@AuthenticationPrincipal User user) {
        return service.findAllByUser(user.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return service.create(request, user.getId());
    }
}
