package com.ivanfranchin.orderapi.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record UpdateOrderRequest(@Schema(example = "Buy three iPhones") @NotBlank String description) {
}
