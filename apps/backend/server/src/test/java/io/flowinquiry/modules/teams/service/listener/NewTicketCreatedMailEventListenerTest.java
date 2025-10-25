package io.flowinquiry.modules.teams.service.listener;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.flowinquiry.modules.collab.EmailContext;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.domain.EntityWatcher;
import io.flowinquiry.modules.collab.repository.EntityWatcherRepository;
import io.flowinquiry.modules.collab.service.MailService;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.event.NewTicketCreatedEvent;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.service.dto.UserDTO;
import io.flowinquiry.modules.usermanagement.service.mapper.UserMapper;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;

@ExtendWith(MockitoExtension.class)
public class NewTicketCreatedMailEventListenerTest {

    @Mock private EntityWatcherRepository entityWatcherRepository;

    @Mock private TicketService ticketService;

    @Mock private MailService mailService;

    @Mock private UserMapper userMapper;

    @Mock private MessageSource messageSource;

    private NewTicketCreatedMailEventListener listener;

    @BeforeEach
    public void setup() {
        listener =
                new NewTicketCreatedMailEventListener(
                        entityWatcherRepository,
                        ticketService,
                        mailService,
                        userMapper,
                        messageSource);
    }

    @Test
    public void testOnNewTicketCreated_NoWatchers() {
        // Given
        Long ticketId = 1L;
        String title = "Test Ticket";

        TicketDTO ticketDTO =
                TicketDTO.builder().id(ticketId).teamId(10L).requestTitle(title).build();

        NewTicketCreatedEvent event = new NewTicketCreatedEvent(this, ticketDTO);

        when(ticketService.getTicketById(ticketId)).thenReturn(ticketDTO);
        when(entityWatcherRepository.findByEntityTypeAndEntityId(EntityType.Ticket, ticketId))
                .thenReturn(Collections.emptyList());

        // When
        listener.onNewTicketCreated(event);

        // Then
        verify(ticketService).getTicketById(ticketId);
        verify(entityWatcherRepository).findByEntityTypeAndEntityId(EntityType.Ticket, ticketId);
        verify(mailService, never()).sendEmail(any(EmailContext.class));
    }

    @Test
    public void testOnNewTicketCreated_WithWatchers() {
        // Given
        Long ticketId = 1L;
        String title = "Test Ticket";
        String baseUrl = "https://example.com";

        TicketDTO ticketDTO =
                TicketDTO.builder().id(ticketId).teamId(10L).requestTitle(title).build();

        NewTicketCreatedEvent event = new NewTicketCreatedEvent(this, ticketDTO);

        User watcher1 = User.builder().id(101L).firstName("John").lastName("Doe").build();
        User watcher2 = User.builder().id(102L).firstName("Jane").lastName("Smith").build();

        EntityWatcher entityWatcher1 =
                EntityWatcher.builder()
                        .entityType(EntityType.Ticket)
                        .entityId(ticketId)
                        .watchUser(watcher1)
                        .build();

        EntityWatcher entityWatcher2 =
                EntityWatcher.builder()
                        .entityType(EntityType.Ticket)
                        .entityId(ticketId)
                        .watchUser(watcher2)
                        .build();

        List<EntityWatcher> watchers = Arrays.asList(entityWatcher1, entityWatcher2);

        UserDTO userDTO1 = new UserDTO();
        userDTO1.setId(101L);
        userDTO1.setFirstName("John");
        userDTO1.setLastName("Doe");

        UserDTO userDTO2 = new UserDTO();
        userDTO2.setId(102L);
        userDTO2.setFirstName("Jane");
        userDTO2.setLastName("Smith");

        when(ticketService.getTicketById(ticketId)).thenReturn(ticketDTO);
        when(entityWatcherRepository.findByEntityTypeAndEntityId(EntityType.Ticket, ticketId))
                .thenReturn(watchers);
        when(userMapper.toDto(watcher1)).thenReturn(userDTO1);
        when(userMapper.toDto(watcher2)).thenReturn(userDTO2);
        when(mailService.getBaseUrl()).thenReturn(baseUrl);

        // When
        listener.onNewTicketCreated(event);

        // Then
        verify(ticketService).getTicketById(ticketId);
        verify(entityWatcherRepository).findByEntityTypeAndEntityId(EntityType.Ticket, ticketId);

        ArgumentCaptor<EmailContext> emailContextCaptor =
                ArgumentCaptor.forClass(EmailContext.class);
        verify(mailService, times(2)).sendEmail(emailContextCaptor.capture());

        List<EmailContext> capturedContexts = emailContextCaptor.getAllValues();
        assert capturedContexts.size() == 2;

        // Verify first email
        EmailContext firstEmail = capturedContexts.getFirst();
        assert firstEmail.getToUser().equals(userDTO1);
        assert firstEmail.getTemplate().equals("mail/newTicketEmail");

        // Verify second email
        EmailContext secondEmail = capturedContexts.get(1);
        assert secondEmail.getToUser().equals(userDTO2);
        assert secondEmail.getTemplate().equals("mail/newTicketEmail");
    }
}
