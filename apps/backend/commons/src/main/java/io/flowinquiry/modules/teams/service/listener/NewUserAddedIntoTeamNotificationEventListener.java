package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.utils.HtmlUtils.NOTIFICATION_CONTAINER_STYLE;
import static io.flowinquiry.utils.HtmlUtils.userAvatarLink;
import static j2html.TagCreator.b;
import static j2html.TagCreator.div;
import static j2html.TagCreator.span;

import io.flowinquiry.modules.collab.domain.ActivityLog;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.repository.ActivityLogRepository;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.event.NewUsersAddedIntoTeamEvent;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class NewUserAddedIntoTeamNotificationEventListener {

    private final ActivityLogRepository activityLogRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public NewUserAddedIntoTeamNotificationEventListener(
            ActivityLogRepository activityLogRepository,
            TeamRepository teamRepository,
            UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    @Async("asyncTaskExecutor")
    @EventListener
    @Transactional
    public void onNewUsersAddedIntoTeam(NewUsersAddedIntoTeamEvent event) {

        Team team =
                teamRepository
                        .findById(event.getTeamId())
                        .orElseThrow(
                                () ->
                                        new EntityNotFoundException(
                                                "Not found team id " + event.getTeamId()));
        List<User> allUsers = userRepository.findAllById(event.getUserIds());

        String content =
                div().with(
                                div().withStyle(NOTIFICATION_CONTAINER_STYLE)
                                        .with(
                                                span("The following users have been added to the "),
                                                b(team.getName()),
                                                span(" team as "),
                                                b(event.getRoleName() + "s"),
                                                span(":")),
                                div().withStyle(
                                                "display:flex;flex-direction:column;gap:6px;margin-top:6px;")
                                        .with(
                                                allUsers.stream()
                                                        .map(
                                                                user ->
                                                                        div().withStyle(
                                                                                        NOTIFICATION_CONTAINER_STYLE)
                                                                                .with(
                                                                                        userAvatarLink(
                                                                                                user)))
                                                        .toList()))
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
