package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.utils.HtmlUtils.NOTIFICATION_CONTAINER_STYLE;
import static io.flowinquiry.utils.HtmlUtils.userAvatarLink;
import static j2html.TagCreator.a;
import static j2html.TagCreator.div;
import static j2html.TagCreator.span;

import io.flowinquiry.modules.collab.domain.ActivityLog;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.repository.ActivityLogRepository;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.event.RemoveUserOutOfTeamEvent;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.security.SecurityUtils;
import io.flowinquiry.utils.Obfuscator;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RemoveUserOutOfTeamNotificationEventListener {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;

    public RemoveUserOutOfTeamNotificationEventListener(
            TeamRepository teamRepository,
            UserRepository userRepository,
            ActivityLogRepository activityLogRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Async("asyncTaskExecutor")
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
                div().withStyle(NOTIFICATION_CONTAINER_STYLE)
                        .with(
                                userAvatarLink(user),
                                span(" is no longer part of the "),
                                a(team.getName())
                                        .withHref(
                                                "/portal/teams/"
                                                        + Obfuscator.obfuscate(team.getId())),
                                span(" team."))
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
