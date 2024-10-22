package io.flexwork.modules.usermanagement.web.rest;

import io.flexwork.modules.usermanagement.domain.User;
import io.flexwork.modules.usermanagement.service.SignupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SignupController {

    private static final Logger LOG = LoggerFactory.getLogger(SignupController.class);

    private SignupService signupService;

    public SignupController(SignupService signupService) {
        this.signupService = signupService;
    }

    @PostMapping(value = "/signup")
    public void signup(@RequestBody User user) {
        signupService.signup(user);
    }

    @GetMapping("/verifyEmail")
    public void verifyEmail(String userEmail) {}

    @GetMapping("/forgotPassword")
    public void forgotPassword(String userEmail) {
        LOG.debug("Forgot password for user {}", userEmail);
    }
}
