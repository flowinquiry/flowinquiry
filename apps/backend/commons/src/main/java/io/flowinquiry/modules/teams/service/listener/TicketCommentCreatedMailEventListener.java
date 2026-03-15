package io.flowinquiry.modules.teams.service.listener;

import static io.flowinquiry.utils.HtmlUtils.buildTicketPath;

import io.flowinquiry.modules.collab.EmailContext;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.domain.EntityWatcher;
import io.flowinquiry.modules.collab.repository.EntityWatcherRepository;
import io.flowinquiry.modules.collab.service.CommentService;
import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.collab.service.dto.CommentDTO;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.event.TicketCommentCreatedEvent;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import java.util.List;
import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Event listener for ticket comment creation events. This listener is responsible for sending email
 * notifications to watchers of a ticket when a new comment is added to the ticket. Emails are sent
 * asynchronously to all watchers except the comment creator.
 */
@Component
public class TicketCommentCreatedMailEventListener {
    private final CommentService commentService;
    private final UserMapper userMapper;
    private final EntityWatcherRepository entityWatcherRepository;
    private final TicketService ticketService;
    private final MailService mailService;
    private final MessageSource messageSource;

    public TicketCommentCreatedMailEventListener(
            CommentService commentService,
            UserMapper userMapper,
            EntityWatcherRepository entityWatcherRepository,
            TicketService ticketService,
            MailService mailService,
            MessageSource messageSource) {
        this.commentService = commentService;
        this.userMapper = userMapper;
        this.entityWatcherRepository = entityWatcherRepository;
        this.ticketService = ticketService;
        this.mailService = mailService;
        this.messageSource = messageSource;
    }

    /**
     * Handles the ticket comment created event. This method is triggered when a new comment is
     * added to a ticket. It retrieves the comment details, finds all watchers of the ticket, and
     * sends email notifications to each watcher (except the comment creator).
     *
     * @param event The event containing information about the created comment
     */
    @Async("asyncTaskExecutor")
    @Transactional
    @EventListener
    public void onTicketCommentCreated(TicketCommentCreatedEvent event) {
        CommentDTO commentDTO = commentService.getCommentById(event.getCommentDTO().getId());
        List<EntityWatcher> watchers =
                entityWatcherRepository.findByEntityTypeAndEntityId(
                        EntityType.Ticket, commentDTO.getEntityId());

        TicketDTO ticketDTO = ticketService.getTicketById(commentDTO.getEntityId());

        if (!watchers.isEmpty()) {
            for (EntityWatcher watcher : watchers) {
                // Skip sending email if the watcher is the comment creator
                if (watcher.getId().equals(commentDTO.getCreatedById())) {
                    continue;
                }

                String ticketPath = buildTicketPath(ticketDTO);

                EmailContext emailContext =
                        new EmailContext(
                                        Locale.forLanguageTag("en"),
                                        mailService.getBaseUrl(),
                                        messageSource)
                                .setToUser(userMapper.toDto(watcher.getWatchUser()))
                                .setSubject(
                                        "email.new.ticket.comment.subject",
                                        ticketDTO.getRequestTitle())
                                .addVariable("ticket", ticketDTO)
                                .addVariable("comment", commentDTO)
                                .addVariable("ticketPath", ticketPath)
                                .setTemplate("mail/newTicketCommentEmail");

                mailService.sendEmail(emailContext);
            }
        }
    }
}
