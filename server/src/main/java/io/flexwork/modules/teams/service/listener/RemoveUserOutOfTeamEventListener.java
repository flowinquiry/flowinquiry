package io.flexwork.modules.teams.service.listener;

import static j2html.TagCreator.a;
import static j2html.TagCreator.div;

import com.flexwork.platform.utils.Obfuscator;
import io.flexwork.modules.collab.domain.ActivityLog;
import io.flexwork.modules.collab.domain.EntityType;
import io.flexwork.modules.collab.repository.ActivityLogRepository;
import io.flexwork.modules.teams.domain.Team;
import io.flexwork.modules.teams.repository.TeamRepository;
import io.flexwork.modules.teams.service.event.RemoveUserOutOfTeamEvent;
import io.flexwork.modules.usermanagement.domain.User;
import io.flexwork.modules.usermanagement.repository.UserRepository;
import io.flexwork.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class RemoveUserOutOfTeamEventListener {

    private final TeamRepository teamRepository;

    private final UserRepository userRepository;

    private final ActivityLogRepository activityLogRepository;

    public RemoveUserOutOfTeamEventListener(
            TeamRepository teamRepository,
            UserRepository userRepository,
            ActivityLogRepository activityLogRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Async("auditLogExecutor")
    @EventListener
    @Transactional
    public void onRemoveUserOutOfTeam(RemoveUserOutOfTeamEvent event) {
        Team team =
                teamRepository
                        .findById(event.getTeamId())
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Not found team id " + event.getTeamId()));

        User user =
                userRepository
                        .findById(event.getUserId())
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Not found user id " + event.getUserId()));

        String content =
                div().withText("User ")
                        .with(
                                a(user.getFirstName() + " " + user.getLastName())
                                        .withHref(
                                                "/portal/users/"
                                                        + Obfuscator.obfuscate(user.getId()))
                                        .withTarget("_blank"))
                        .withText(" is no longer part of the ")
                        .with(
                                a(team.getName())
                                        .withHref(
                                                "/portal/teams/"
                                                        + Obfuscator.obfuscate(team.getId()))
                                        .withTarget("_blank") // Opens the link in a new tab
                                )
                        .withText(" team.")
                        .render();

        ActivityLog activityLog =
                ActivityLog.builder()
                        .entityId(team.getId())
                        .entityType(EntityType.Team)
                        .content(content)
                        .createdBy(SecurityUtils.getCurrentUserAuditorLogin())
                        .build();
        activityLogRepository.save(activityLog);
    }
}
