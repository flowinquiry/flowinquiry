package io.flowinquiry.utils;

import static io.flowinquiry.utils.Obfuscator.obfuscate;
import static j2html.TagCreator.a;
import static j2html.TagCreator.img;
import static j2html.TagCreator.span;

import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.usermanagement.domain.User;
import j2html.tags.DomContent;
import org.apache.commons.lang3.StringUtils;

public class HtmlUtils {

    public static final String NOTIFICATION_CONTAINER_STYLE =
            "margin:0;padding:0;font-size:0.875rem;";

    /**
     * Renders an inline avatar + full name as a hyperlink to the user's profile.
     *
     * <p>When the user has an {@code imageUrl} it is displayed as a small circular image. When the
     * avatar is missing, a coloured circle with the user's initials is rendered instead — so the
     * link is always usable even if the user has not yet uploaded an avatar.
     *
     * <p>Note: this is a point-in-time snapshot. If the user uploads an avatar after this log entry
     * was created, old entries will continue to show initials — accepted limitation as activity
     * logs are historical records.
     *
     * @param user the user to render
     * @return a j2html {@link DomContent} fragment ready to embed in any activity log HTML
     */
    public static DomContent userAvatarLink(User user) {
        String firstName = StringUtils.trimToEmpty(user.getFirstName());
        String lastName = StringUtils.trimToEmpty(user.getLastName());
        String fullName = (firstName + " " + lastName).trim();
        String profileHref = "/portal/users/" + Obfuscator.obfuscate(user.getId());

        DomContent avatar;
        if (StringUtils.isNotBlank(user.getImageUrl())) {
            avatar =
                    img().withSrc("/api/files/" + user.getImageUrl())
                            .withAlt(fullName)
                            .withStyle(
                                    "width:24px;height:24px;border-radius:50%;"
                                            + "object-fit:cover;vertical-align:middle;"
                                            + "margin-right:6px;flex-shrink:0;");
        } else {
            String initials =
                    (StringUtils.isNotBlank(firstName) ? String.valueOf(firstName.charAt(0)) : "")
                            + (StringUtils.isNotBlank(lastName)
                                    ? String.valueOf(lastName.charAt(0))
                                    : "?");
            avatar =
                    span(initials.toUpperCase())
                            .withStyle(
                                    "display:inline-flex;align-items:center;"
                                            + "justify-content:center;"
                                            + "width:24px;height:24px;border-radius:50%;"
                                            + "background:#6366f1;color:#fff;"
                                            + "font-size:10px;font-weight:600;"
                                            + "vertical-align:middle;margin-right:6px;"
                                            + "flex-shrink:0;");
        }

        return a().withHref(profileHref)
                .withTarget("_blank")
                .withStyle(
                        "display:inline-flex;align-items:center;gap:4px;vertical-align:middle;"
                                + "text-decoration:none;color:inherit;font-weight:600;")
                .with(avatar, span(fullName));
    }

    private HtmlUtils() {}

    /**
     * Builds a URL path for accessing a ticket in the web portal.
     *
     * @param ticketDTO The ticket data transfer object containing ticket information
     * @return A formatted URL path string for accessing the ticket For project tickets:
     *     /portal/teams/{teamId}/projects/{projectShortName}/{projectTicketNumber} For regular
     *     tickets: /portal/teams/{teamId}/tickets/{ticketId}
     */
    public static String buildTicketPath(TicketDTO ticketDTO) {
        String teamId = obfuscate(ticketDTO.getTeamId());

        if (ticketDTO.getProjectId() != null) {
            return String.format(
                    "/portal/teams/%s/projects/%s/%s",
                    teamId, ticketDTO.getProjectShortName(), ticketDTO.getProjectTicketNumber());
        }

        return String.format("/portal/teams/%s/tickets/%s", teamId, obfuscate(ticketDTO.getId()));
    }
}
