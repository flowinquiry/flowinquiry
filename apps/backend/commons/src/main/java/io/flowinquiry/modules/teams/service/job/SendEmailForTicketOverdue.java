package io.flowinquiry.modules.teams.service.job;

import io.flowinquiry.modules.collab.EmailContext;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.service.EntityWatcherService;
import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.fss.service.dto.EntityWatcherDTO;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.usermanagement.service.UserService;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.utils.Obfuscator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Profile("!test")
@Component
public class SendEmailForTicketOverdue {
    private final EntityWatcherService entityWatcherService;
    private final MailService mailService;
    private final UserService userService;
    private final TicketService ticketService;
    private final MessageSource messageSource;

    public SendEmailForTicketOverdue(
            EntityWatcherService entityWatcherService,
            MailService mailService,
            UserService userService,
            TicketService ticketService,
            MessageSource messageSource) {
        this.entityWatcherService = entityWatcherService;
        this.mailService = mailService;
        this.userService = userService;
        this.ticketService = ticketService;
        this.messageSource = messageSource;
    }

    @Scheduled(cron = "0 0 0 * * ?") // Runs at midnight every day
    @SchedulerLock(name = "SendEmailForTicketOverdue", lockAtMostFor = "1m", lockAtLeastFor = "1s")
    public void notifyWatchers() {

        int page = 0;
        int size = 500;
        Page<TicketDTO> ticketPage;

        do {
            ticketPage = ticketService.getAllOverdueTickets(PageRequest.of(page, size));

            for (TicketDTO ticket : ticketPage.getContent()) {
                log.info(
                        "Processing overdue ticket ID for sending emails to watchers: {}",
                        ticket.getId());

                // Fetch watchers for the ticket
                List<EntityWatcherDTO> entityWatcherDTOs =
                        entityWatcherService.getWatchersForEntity(
                                EntityType.Ticket, ticket.getId());

                for (EntityWatcherDTO watcher : entityWatcherDTOs) {
                    sendEmailToWatcher(watcher, ticket);
                }
            }
            page++;
        } while (ticketPage.hasNext());
    }

    private void sendEmailToWatcher(EntityWatcherDTO watcher, TicketDTO ticket) {

        Optional<UserDTO> userinfo = userService.getUserById(watcher.getWatchUserId());
        if (userinfo.isPresent()) {
            UserDTO user = userinfo.get();
            Locale locale =
                    Locale.forLanguageTag(user.getLangKey() != null ? user.getLangKey() : "en");

            EmailContext emailContext =
                    new EmailContext(locale, mailService.getBaseUrl(), messageSource)
                            .setToUser(user)
                            .setTemplate("mail/projectTicketOverdueEmail")
                            .setSubject(
                                    "email.ticket.project.overdue.title", ticket.getRequestTitle())
                            .addVariable("requestTitle", ticket.getRequestTitle())
                            .addVariable(
                                    "estimatedCompletionDate", ticket.getEstimatedCompletionDate())
                            .addVariable(
                                    "obfuscatedTeamId", Obfuscator.obfuscate(ticket.getTeamId()))
                            .addVariable(
                                    "obfuscatedTicketId", Obfuscator.obfuscate(ticket.getId()));

            mailService.sendEmail(emailContext);
            log.info("Sent overdue ticket mail to watcher: {}", user.getId());
        }
    }
}
