package com.ivanfranchin.orderapi.rest;

import com.ivanfranchin.orderapi.user.DuplicatedUserInfoException;
import com.ivanfranchin.orderapi.user.User;
import com.ivanfranchin.orderapi.rest.dto.UpdateProfileRequest;
import com.ivanfranchin.orderapi.rest.dto.UserDto;
import com.ivanfranchin.orderapi.security.CustomUserDetails;
import com.ivanfranchin.orderapi.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

import static com.ivanfranchin.orderapi.config.SwaggerConfig.BEARER_KEY_SECURITY_SCHEME;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Operation(security = {@SecurityRequirement(name = BEARER_KEY_SECURITY_SCHEME)})
    @GetMapping("/me")
    public UserDto getCurrentUser(@AuthenticationPrincipal CustomUserDetails currentUser) {
        return UserDto.from(userService.validateAndGetUserByUsername(currentUser.getUsername()));
    }

    @Operation(security = {@SecurityRequirement(name = BEARER_KEY_SECURITY_SCHEME)})
    @PutMapping("/me")
    public UserDto updateCurrentUser(@AuthenticationPrincipal CustomUserDetails currentUser,
                                     @Valid @RequestBody UpdateProfileRequest updateProfileRequest) {
        User user = userService.validateAndGetUserByUsername(currentUser.getUsername());

        if (!user.getEmail().equalsIgnoreCase(updateProfileRequest.email())
                && userService.hasUserWithEmail(updateProfileRequest.email())) {
            throw new DuplicatedUserInfoException(
                    String.format("Email %s already been used", updateProfileRequest.email()));
        }

        user.setName(updateProfileRequest.name());
        user.setEmail(updateProfileRequest.email());
        if (updateProfileRequest.password() != null && !updateProfileRequest.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(updateProfileRequest.password()));
        }
        return UserDto.from(userService.saveUser(user));
    }

    @Operation(security = {@SecurityRequirement(name = BEARER_KEY_SECURITY_SCHEME)})
    @GetMapping
    public List<UserDto> getUsers() {
        return userService.getUsers().stream()
                .map(UserDto::from)
                .collect(Collectors.toList());
    }

    @Operation(security = {@SecurityRequirement(name = BEARER_KEY_SECURITY_SCHEME)})
    @GetMapping("/{username}")
    public UserDto getUser(@PathVariable String username) {
        return UserDto.from(userService.validateAndGetUserByUsername(username));
    }

    @Operation(security = {@SecurityRequirement(name = BEARER_KEY_SECURITY_SCHEME)})
    @DeleteMapping("/{username}")
    public UserDto deleteUser(@PathVariable String username) {
        User user = userService.validateAndGetUserByUsername(username);
        userService.deleteUser(user);
        return UserDto.from(user);
    }
}
