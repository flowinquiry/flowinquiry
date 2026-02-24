package io.flowinquiry.modules.teams.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.domain.TShirtSize;
import io.flowinquiry.modules.teams.domain.Team;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.TicketChannel;
import io.flowinquiry.modules.teams.domain.TicketPriority;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.repository.WorkflowStateRepository;
import io.flowinquiry.modules.teams.service.TicketService;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.mapper.TicketMapper;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.repository.UserRepository;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.QueryDTO;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@WithMockFwUser(authorities = AuthoritiesConstants.ADMIN)
public class TicketControllerIT {

    private static final String DEFAULT_TITLE = "Test Ticket";
    private static final String UPDATED_TITLE = "Updated Test Ticket";
    private static final String DEFAULT_DESCRIPTION = "Test ticket description";
    private static final String UPDATED_DESCRIPTION = "Updated test ticket description";
    private static final TicketChannel DEFAULT_CHANNEL = TicketChannel.EMAIL;
    private static final TicketChannel UPDATED_CHANNEL = TicketChannel.CHAT;
    private static final TicketPriority DEFAULT_PRIORITY = TicketPriority.Medium;
    private static final TicketPriority UPDATED_PRIORITY = TicketPriority.High;
    private static final TShirtSize DEFAULT_SIZE = TShirtSize.M;
    private static final TShirtSize UPDATED_SIZE = TShirtSize.L;
    private static final Integer DEFAULT_ESTIMATE = 5;
    private static final Integer UPDATED_ESTIMATE = 8;
    private static final LocalDate DEFAULT_ESTIMATED_COMPLETION_DATE = LocalDate.now().plusDays(7);
    private static final LocalDate UPDATED_ESTIMATED_COMPLETION_DATE = LocalDate.now().plusDays(14);

    @Autowired private TicketRepository ticketRepository;

    @Autowired private TicketMapper ticketMapper;

    @Autowired private TicketService ticketService;

    @Autowired private TeamRepository teamRepository;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private UserRepository userRepository;

    @Autowired private WorkflowStateRepository workflowStateRepository;

    @Autowired private EntityManager em;

    @Autowired private MockMvc restTicketMockMvc;

    @Autowired private ObjectMapper om;
    @Autowired private ProjectIterationRepository projectIterationRepository;

    private Ticket ticket;
    private Team team;
    private Project project;
    private User user;
    private WorkflowState workflowState;

    @BeforeEach
    public void initTest() {
        team = teamRepository.findById(1L).orElseThrow();
        project = projectRepository.findById(1L).orElseThrow();
        user = userRepository.findById(1L).orElseThrow();
        workflowState = workflowStateRepository.findById(1L).orElseThrow();
        ticket = createEntity(em);
    }

    /**
     * Create an entity for this test.
     *
     * <p>This is a static method, as tests for other entities might also need it, if they test an
     * entity which requires the current entity.
     */
    public Ticket createEntity(EntityManager em) {
        Ticket ticket = new Ticket();
        ticket.setRequestTitle(DEFAULT_TITLE);
        ticket.setRequestDescription(DEFAULT_DESCRIPTION);
        ticket.setChannel(DEFAULT_CHANNEL);
        ticket.setPriority(DEFAULT_PRIORITY);
        ticket.setSize(DEFAULT_SIZE);
        ticket.setEstimate(DEFAULT_ESTIMATE);
        ticket.setEstimatedCompletionDate(DEFAULT_ESTIMATED_COMPLETION_DATE);
        ticket.setIsNew(true);
        ticket.setIsCompleted(false);
        ticket.setTeam(team);
        ticket.setProject(project);
        ticket.setAssignUser(user);
        ticket.setRequestUser(user);
        ticket.setCurrentState(workflowState);
        ticket.setWorkflow(workflowState.getWorkflow());

        return ticket;
    }

    @Test
    @Transactional
    void totalStoryPointsShouldUpdate() {
        ProjectIteration projectIteration = new ProjectIteration();
        projectIteration.setProject(project);
        projectIteration.setName("Test iteration");
        projectIteration.setDescription("testing");
        projectIteration.setStartDate(Instant.now());
        projectIteration.setEndDate(Instant.now());

        projectIteration = projectIterationRepository.saveAndFlush(projectIteration);

        Ticket ticket1 = createEntity(em);
        ticket1.setIteration(projectIteration);
        ticket1.setEstimate(3);
        ticketRepository.saveAndFlush(ticket1);

        Ticket ticket2 = createEntity(em);
        ticket2.setIteration(projectIteration);
        ticket2.setEstimate(5);
        ticketRepository.saveAndFlush(ticket2);

        em.refresh(projectIteration);
        // adding new tickets should update the total story points
        assertThat(projectIteration.getTotalStoryPoints()).isEqualTo(8L);

        // updating the ticket estimate should update the total story points
        ticket1.setEstimate(10);
        ticketRepository.saveAndFlush(ticket1);

        em.refresh(projectIteration);
        assertThat(projectIteration.getTotalStoryPoints()).isEqualTo(15L);

        // updating the ticket estimate should update the total story points
        ticket1.setDeleted(true);
        ticketRepository.saveAndFlush(ticket1);

        em.refresh(projectIteration);
        assertThat(projectIteration.getTotalStoryPoints()).isEqualTo(5L);
    }

    @Test
    @Transactional
    void createTicket() throws Exception {
        int databaseSizeBeforeCreate = ticketRepository.findAll().size();

        // Create the Ticket DTO
        TicketDTO ticketDTO = ticketMapper.toDto(ticket);
        ticketDTO.setId(null); // Ensure we're creating a new ticket

        // Perform the request and validate the response
        restTicketMockMvc
                .perform(
                        post("/api/tickets")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(ticketDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requestTitle").value(DEFAULT_TITLE))
                .andExpect(jsonPath("$.requestDescription").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.channel").value(DEFAULT_CHANNEL.getDisplayName()))
                .andExpect(jsonPath("$.priority").value(DEFAULT_PRIORITY.toString()))
                .andExpect(jsonPath("$.teamId").value(team.getId().intValue()));

        // Validate the Ticket in the database
        List<Ticket> ticketList = ticketRepository.findAll();
        assertThat(ticketList).hasSize(databaseSizeBeforeCreate + 1);
        Ticket testTicket = ticketList.getLast();
        assertThat(testTicket.getRequestTitle()).isEqualTo(DEFAULT_TITLE);
        assertThat(testTicket.getRequestDescription()).isEqualTo(DEFAULT_DESCRIPTION);
        assertThat(testTicket.getChannel()).isEqualTo(DEFAULT_CHANNEL);
        assertThat(testTicket.getPriority()).isEqualTo(DEFAULT_PRIORITY);
        assertThat(testTicket.getTeam().getId()).isEqualTo(team.getId());
    }

    @Test
    @Transactional
    void getTicketById() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Get the ticket
        restTicketMockMvc
                .perform(get("/api/tickets/{id}", ticket.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(ticket.getId().intValue()))
                .andExpect(jsonPath("$.requestTitle").value(DEFAULT_TITLE))
                .andExpect(jsonPath("$.requestDescription").value(DEFAULT_DESCRIPTION))
                .andExpect(jsonPath("$.channel").value(DEFAULT_CHANNEL.getDisplayName()))
                .andExpect(jsonPath("$.priority").value(DEFAULT_PRIORITY.toString()));
    }

    @Test
    @Transactional
    void getNonExistingTicket() throws Exception {
        // Get the ticket
        restTicketMockMvc
                .perform(get("/api/tickets/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void searchTickets() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Search for all tickets
        restTicketMockMvc
                .perform(
                        post("/api/tickets/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void searchTicketsWithQuery() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Create a query DTO with a filter for the ticket title
        QueryDTO queryDTO = new QueryDTO();
        Filter titleFilter = new Filter("requestTitle", FilterOperator.EQ, DEFAULT_TITLE);
        queryDTO.setFilters(List.of(titleFilter));

        // Search for tickets with the query
        restTicketMockMvc
                .perform(
                        post("/api/tickets/search")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(Optional.of(queryDTO))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.content.[*].requestTitle").value(hasItem(DEFAULT_TITLE)));
    }

    @Test
    @Transactional
    void updateTicket() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);
        int databaseSizeBeforeUpdate = ticketRepository.findAll().size();

        // Update the ticket
        Ticket updatedTicket = ticketRepository.findById(ticket.getId()).orElseThrow();

        TicketDTO ticketDTO = ticketMapper.toDto(updatedTicket);
        ticketDTO.setRequestTitle(UPDATED_TITLE);
        ticketDTO.setRequestDescription(UPDATED_DESCRIPTION);
        ticketDTO.setChannel(UPDATED_CHANNEL);
        ticketDTO.setPriority(UPDATED_PRIORITY);
        ticketDTO.setSize(UPDATED_SIZE);
        ticketDTO.setEstimate(UPDATED_ESTIMATE);
        ticketDTO.setEstimatedCompletionDate(UPDATED_ESTIMATED_COMPLETION_DATE);

        restTicketMockMvc
                .perform(
                        put("/api/tickets/{id}", ticket.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(ticketDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ticket.getId().intValue()))
                .andExpect(jsonPath("$.requestTitle").value(UPDATED_TITLE))
                .andExpect(jsonPath("$.requestDescription").value(UPDATED_DESCRIPTION))
                .andExpect(jsonPath("$.channel").value(UPDATED_CHANNEL.getDisplayName()))
                .andExpect(jsonPath("$.priority").value(UPDATED_PRIORITY.toString()));

        // Validate the Ticket in the database
        List<Ticket> ticketList = ticketRepository.findAll();
        assertThat(ticketList).hasSize(databaseSizeBeforeUpdate);
        Ticket testTicket = ticketList.getLast();
        assertThat(testTicket.getRequestTitle()).isEqualTo(UPDATED_TITLE);
        assertThat(testTicket.getRequestDescription()).isEqualTo(UPDATED_DESCRIPTION);
        assertThat(testTicket.getChannel()).isEqualTo(UPDATED_CHANNEL);
        assertThat(testTicket.getPriority()).isEqualTo(UPDATED_PRIORITY);
        assertThat(testTicket.getSize()).isEqualTo(UPDATED_SIZE);
        assertThat(testTicket.getEstimate()).isEqualTo(UPDATED_ESTIMATE);
    }

    @Test
    @Transactional
    void deleteTicket() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);
        int databaseSizeBeforeDelete = ticketRepository.findAll().size();

        // Delete the ticket
        restTicketMockMvc
                .perform(
                        delete("/api/tickets/{id}", ticket.getId())
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Validate the database contains one less item
        List<Ticket> ticketList = ticketRepository.findAll();
        assertThat(ticketList).hasSize(databaseSizeBeforeDelete - 1);
    }

    @Test
    @Transactional
    void getTicketDistribution() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Get ticket distribution for team
        restTicketMockMvc
                .perform(
                        get("/api/tickets/teams/{teamId}/ticket-distribution", team.getId())
                                .param("range", "30d"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getUnassignedTickets() throws Exception {
        // Initialize the database
        ticket.setAssignUser(null);
        ticketRepository.saveAndFlush(ticket);

        // Get unassigned tickets for team
        restTicketMockMvc
                .perform(get("/api/tickets/teams/{teamId}/unassigned-tickets", team.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getPriorityDistribution() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Get priority distribution for team
        restTicketMockMvc
                .perform(
                        get("/api/tickets/teams/{teamId}/priority-distribution", team.getId())
                                .param("range", "30d"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getTicketStateChangesHistory() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Get ticket state changes history
        restTicketMockMvc
                .perform(get("/api/tickets/{ticketId}/states-history", ticket.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getTicketStatisticsByTeamId() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Get ticket statistics for team
        restTicketMockMvc
                .perform(
                        get("/api/tickets/teams/{teamId}/statistics", team.getId())
                                .param("range", "30d"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getOverdueTicketsByTeam() throws Exception {
        // Initialize the database
        ticket.setEstimatedCompletionDate(LocalDate.now().minusDays(1));
        ticket.setIsCompleted(false);
        ticketRepository.saveAndFlush(ticket);

        // Get overdue tickets for team
        restTicketMockMvc
                .perform(get("/api/tickets/teams/{teamId}/overdue-tickets", team.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void countOverdueTickets() throws Exception {
        // Initialize the database
        ticket.setEstimatedCompletionDate(LocalDate.now().minusDays(1));
        ticket.setIsCompleted(false);
        ticketRepository.saveAndFlush(ticket);

        // Count overdue tickets for team
        restTicketMockMvc
                .perform(
                        get("/api/tickets/teams/{teamId}/overdue-tickets/count", team.getId())
                                .param("range", "30d"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getTicketCreationDaySeries() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Get ticket creation day series for team
        restTicketMockMvc
                .perform(
                        get("/api/tickets/teams/{teamId}/ticket-creations-day-series", team.getId())
                                .param("days", "7"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getOverdueTicketsByUser() throws Exception {
        // Initialize the database
        ticket.setEstimatedCompletionDate(LocalDate.now().minusDays(1));
        ticket.setIsCompleted(false);
        ticketRepository.saveAndFlush(ticket);

        // Get overdue tickets for user
        restTicketMockMvc
                .perform(get("/api/tickets/users/{userId}/overdue-tickets", user.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void getTeamTicketPriorityDistributionForUser() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Get team ticket priority distribution for user
        restTicketMockMvc
                .perform(
                        get(
                                        "/api/tickets/users/{userId}/team-tickets-priority-distribution",
                                        user.getId())
                                .param("range", "30d"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE));
    }

    @Test
    @Transactional
    void updateTicketState() throws Exception {
        // Initialize the database
        ticketRepository.saveAndFlush(ticket);

        // Create a new workflow state
        WorkflowState newState = workflowStateRepository.findById(2L).orElseThrow();

        // Update ticket state
        Map<String, Long> requestBody = new HashMap<>();
        requestBody.put("newStateId", newState.getId());

        restTicketMockMvc
                .perform(
                        patch("/api/tickets/{ticketId}/state", ticket.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(requestBody)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.currentStateId").value(newState.getId().intValue()));

        // Validate the ticket state in the database
        Ticket updatedTicket = ticketRepository.findById(ticket.getId()).orElseThrow();
        assertThat(updatedTicket.getCurrentState().getId()).isEqualTo(newState.getId());
    }

    @Test
    @Transactional
    void getNextTicket() throws Exception {
        // Initialize the database with first ticket
        Ticket firstTicket = createEntity(em);
        firstTicket.setId(null);
        firstTicket.setDeleted(false); // Explicitly set isDeleted to false
        firstTicket = ticketRepository.saveAndFlush(firstTicket);

        // Create second ticket with a higher ID
        Ticket secondTicket = createEntity(em);
        secondTicket.setId(null);
        secondTicket.setDeleted(false); // Explicitly set isDeleted to false
        secondTicket = ticketRepository.saveAndFlush(secondTicket);

        // Verify second ticket has higher ID
        assertThat(secondTicket.getId()).isGreaterThan(firstTicket.getId());

        // Verify both tickets have the same team ID
        assertThat(firstTicket.getTeam().getId()).isEqualTo(secondTicket.getTeam().getId());

        // Verify tickets exist in the database
        Optional<Ticket> firstTicketFromDb = ticketRepository.findById(firstTicket.getId());
        Optional<Ticket> secondTicketFromDb = ticketRepository.findById(secondTicket.getId());

        // Get next ticket with project ID parameter
        restTicketMockMvc
                .perform(
                        get("/api/tickets/{currentId}/next", firstTicket.getId())
                                .param("projectId", firstTicket.getProject().getId().toString()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").value(secondTicket.getId().intValue()));
    }

    @Test
    @Transactional
    void getPreviousTicket() throws Exception {
        // Initialize the database
        Ticket firstTicket = createEntity(em);
        firstTicket.setId(null);
        firstTicket = ticketRepository.saveAndFlush(firstTicket);

        ticketRepository.saveAndFlush(ticket);

        // Get previous ticket
        restTicketMockMvc
                .perform(get("/api/tickets/{currentId}/previous", ticket.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.id").isNumber());
    }
}
