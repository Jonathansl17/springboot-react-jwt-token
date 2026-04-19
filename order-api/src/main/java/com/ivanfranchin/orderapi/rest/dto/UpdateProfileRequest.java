package com.ivanfranchin.orderapi.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @Schema(example = "User3") @NotBlank String name,
        @Schema(example = "user3@mycompany.com") @Email @NotBlank String email,
        @Schema(example = "newPassword") String password) {
}
