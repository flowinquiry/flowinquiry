package io.flowinquiry.modules.teams.service.job;

import static org.springframework.util.CollectionUtils.isEmpty;
import static org.springframework.util.CollectionUtils.lastElement;

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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
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
        int size = 500;
        Long lastSeenId = 0L;
        List<TicketDTO> tickets;
        long startTime = System.currentTimeMillis();

        do {
            tickets = ticketService.getAllOverdueTicketsAfterId(lastSeenId, size);
            if (isEmpty(tickets)) {
                log.info("No overdue tickets found. Processing complete");
                return;
            }

            for (TicketDTO ticket : tickets) {
                List<EntityWatcherDTO> watchers =
                        entityWatcherService.getWatchersForEntity(
                                EntityType.Ticket, ticket.getId());
                watchers.forEach(watcher -> sendEmailToWatcher(watcher.getWatchUserId(), ticket));
            }
            lastSeenId = lastElement(tickets).getId();
        } while (tickets.size() == size);
        log.info("Processed all overdue tickets in {} ms", System.currentTimeMillis() - startTime);
    }

    private void sendEmailToWatcher(Long watcherId, TicketDTO ticket) {
        Optional<UserDTO> watcherOptional = userService.getUserById(watcherId);
        if (watcherOptional.isEmpty()) {
            log.info(
                    "Skipping email sending - watcher with ID {} does not exist for overdue ticket {}",
                    watcherId,
                    ticket.getId());
            return;
        }

        UserDTO watcher = watcherOptional.get();
        Locale locale =
                Locale.forLanguageTag(watcher.getLangKey() != null ? watcher.getLangKey() : "en");

        EmailContext emailContext =
                new EmailContext(locale, mailService.getBaseUrl(), messageSource)
                        .setToUser(watcher)
                        .setTemplate("mail/projectTicketOverdueEmail")
                        .setSubject("email.ticket.project.overdue.title", ticket.getRequestTitle())
                        .addVariable("requestTitle", ticket.getRequestTitle())
                        .addVariable("estimatedCompletionDate", ticket.getEstimatedCompletionDate())
                        .addVariable("obfuscatedTeamId", Obfuscator.obfuscate(ticket.getTeamId()))
                        .addVariable("obfuscatedTicketId", Obfuscator.obfuscate(ticket.getId()));
        mailService.sendEmail(emailContext);
    }
}
