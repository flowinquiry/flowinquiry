package io.flowinquiry.modules.teams.service.job;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import io.flowinquiry.modules.collab.EmailContext;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.service.EntityWatcherService;
import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.fss.service.dto.EntityWatcherDTO;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.usermanagement.service.UserService;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
public class SendEmailForTicketOverdueTest {
    @Mock private TicketService ticketService;

    @Mock private EntityWatcherService entityWatcherService;

    @Mock private UserService userService;

    @Mock private MessageSource messageSource;

    @Mock private MailService mailService;

    private SendEmailForTicketOverdue cron;

    @RegisterExtension
    static GreenMailExtension greenMail =
            new GreenMailExtension(ServerSetupTest.SMTP)
                    .withConfiguration(
                            GreenMailConfiguration.aConfig()
                                    .withUser("noreply@flowinquiry.io", "user", "pass"))
                    .withPerMethodLifecycle(true);

    @BeforeEach
    void setup() {
        cron =
                new SendEmailForTicketOverdue(
                        entityWatcherService,
                        mailService,
                        userService,
                        ticketService,
                        messageSource);
    }

    @AfterEach
    void tearDown() {
        greenMail.stop();
    }

    @Test
    void shouldSendEmailForOverdueTicket() throws jakarta.mail.MessagingException {

        TicketDTO ticket =
                TicketDTO.builder()
                        .id(1L)
                        .requestTitle("Request Title")
                        .estimatedCompletionDate(LocalDate.now().minusDays(1))
                        .teamId(1L)
                        .build();


        EntityWatcherDTO entityWatcherDTO = new EntityWatcherDTO();
        entityWatcherDTO.setEntityId(ticket.getId());
        entityWatcherDTO.setEntityType(EntityType.Ticket.toString());
        entityWatcherDTO.setWatchUserId(1L);
        List<EntityWatcherDTO> entityWatcherDTOs = List.of(entityWatcherDTO);

        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail("test@email.com");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setLangKey("en");
        Optional<UserDTO> userinfo = Optional.of(user);

        when(ticketService.getAllOverdueTicketsAfterId(0L, 500)).thenReturn(List.of(ticket));
        when(entityWatcherService.getWatchersForEntity(any(), anyLong()))
                .thenReturn(entityWatcherDTOs);
        when(userService.getUserById(anyLong())).thenReturn(userinfo);
        when(messageSource.getMessage(any(), any(), any()))
                .thenReturn("Overdue Ticket Notification");

        cron.notifyWatchers();

        ArgumentCaptor<EmailContext> emailCaptor = ArgumentCaptor.forClass(EmailContext.class);
        verify(mailService).sendEmail(emailCaptor.capture());

        EmailContext sentEmail = emailCaptor.getValue();

        assertThat(sentEmail).isNotNull();
        assertThat(sentEmail.getToUser().getEmail()).isEqualTo("test@email.com");
        assertThat(sentEmail.getSubject()).isEqualTo("Overdue Ticket Notification");
        assertThat(sentEmail.getTemplate()).isEqualTo("mail/projectTicketOverdueEmail");
    }
}
