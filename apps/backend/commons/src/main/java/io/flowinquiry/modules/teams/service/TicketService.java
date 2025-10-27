package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus.COMPLETED;
import static io.flowinquiry.query.QueryUtils.createSpecification;
import static org.springframework.util.CollectionUtils.isEmpty;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.audit.service.event.AuditLogUpdateEvent;
import io.flowinquiry.modules.collab.domain.EntityType;
import io.flowinquiry.modules.collab.domain.EntityWatcher;
import io.flowinquiry.modules.collab.repository.EntityWatcherRepository;
import io.flowinquiry.modules.teams.domain.ProjectTicketSequence;
import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.domain.WorkflowState;
import io.flowinquiry.modules.teams.domain.WorkflowTransition;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistory;
import io.flowinquiry.modules.teams.domain.WorkflowTransitionHistoryStatus;
import io.flowinquiry.modules.teams.repository.ProjectTicketSequenceRepository;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.repository.WorkflowStateRepository;
import io.flowinquiry.modules.teams.repository.WorkflowTransitionHistoryRepository;
import io.flowinquiry.modules.teams.repository.WorkflowTransitionRepository;
import io.flowinquiry.modules.teams.service.dto.PriorityDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TeamTicketPriorityDistributionDTO;
import io.flowinquiry.modules.teams.service.dto.TicketActionCountByDateDTO;
import io.flowinquiry.modules.teams.service.dto.TicketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketDistributionDTO;
import io.flowinquiry.modules.teams.service.event.NewTicketCreatedEvent;
import io.flowinquiry.modules.teams.service.event.ProjectEpicChangedByTicketEvent;
import io.flowinquiry.modules.teams.service.event.ProjectIterationChangedByTicketEvent;
import io.flowinquiry.modules.teams.service.event.TicketWorkStateTransitionEvent;
import io.flowinquiry.modules.teams.service.mapper.TicketMapper;
import io.flowinquiry.modules.usermanagement.domain.User;
import io.flowinquiry.modules.usermanagement.service.dto.TicketStatisticsDTO;
import io.flowinquiry.query.QueryDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.ConcurrentModificationException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TicketService {
    @PersistenceContext private EntityManager entityManager;

    private final TicketRepository ticketRepository;
    private final EntityWatcherRepository entityWatcherRepository;
    private final TicketMapper ticketMapper;
    private final WorkflowStateRepository workflowStateRepository;
    private final WorkflowTransitionRepository workflowTransitionRepository;
    private final WorkflowTransitionHistoryRepository workflowTransitionHistoryRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ProjectTicketSequenceRepository projectTicketSequenceRepository;

    @Autowired
    public TicketService(
            TicketRepository ticketRepository,
            EntityWatcherRepository entityWatcherRepository,
            TicketMapper ticketMapper,
            WorkflowTransitionRepository workflowTransitionRepository,
            WorkflowStateRepository workflowStateRepository,
            WorkflowTransitionHistoryRepository workflowTransitionHistoryRepository,
            ProjectTicketSequenceRepository projectTicketSequenceRepository,
            ApplicationEventPublisher eventPublisher) {
        this.ticketRepository = ticketRepository;
        this.entityWatcherRepository = entityWatcherRepository;
        this.ticketMapper = ticketMapper;
        this.workflowTransitionRepository = workflowTransitionRepository;
        this.workflowStateRepository = workflowStateRepository;
        this.workflowTransitionHistoryRepository = workflowTransitionHistoryRepository;
        this.projectTicketSequenceRepository = projectTicketSequenceRepository;
        this.eventPublisher = eventPublisher;
    }

    public Page<TicketDTO> findTickets(QueryDTO queryDTO, Pageable pageable) {
        Specification<Ticket> spec = createSpecification(queryDTO);
        return ticketRepository.findAll(spec, pageable).map(ticketMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> getAllOverdueTicketsAfterId(Long lastSeenId, int size){
        List<Ticket> overdueTickets = ticketRepository.findOverdueTicketsAfterId(lastSeenId, size);
        if (isEmpty(overdueTickets)){
            return List.of();
        }

        return overdueTickets.stream()
              .map(ticketMapper::toDto)
              .toList();
    }

    @Transactional(readOnly = true)
    public TicketDTO getTicketById(Long id) {
        Ticket ticket =
                ticketRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Ticket not found with id: " + id));
        return ticketMapper.toDto(ticket);
    }

    @Transactional
    public TicketDTO createTicket(TicketDTO ticketDTO) {
        WorkflowState initialStateByWorkflowId =
                workflowStateRepository
                        .findById(ticketDTO.getCurrentStateId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Can not find workflow state "
                                                        + ticketDTO.getWorkflowId()));

        ticketDTO.setIsNew(true);
        ticketDTO.setIsCompleted(false);

        if (ticketDTO.getProjectId() != null) {
            Long nextNumber = getNextProjectTicketNumber(ticketDTO.getProjectId());
            ticketDTO.setProjectTicketNumber(nextNumber);
        }

        Ticket ticket = ticketMapper.toEntity(ticketDTO);
        ticket = ticketRepository.save(ticket);

        Long ticketId = ticket.getId();

        Set<Long> uniqueWatcherIds = new HashSet<>();
        uniqueWatcherIds.add(ticketDTO.getRequestUserId());

        if (ticketDTO.getAssignUserId() != null) {
            uniqueWatcherIds.add(ticketDTO.getAssignUserId());
        }

        List<EntityWatcher> entityWatchers =
                uniqueWatcherIds.stream()
                        .map(
                                userId -> {
                                    EntityWatcher entityWatcher = new EntityWatcher();
                                    entityWatcher.setEntityId(ticketId);
                                    entityWatcher.setEntityType(EntityType.Ticket);
                                    entityWatcher.setWatchUser(User.builder().id(userId).build());
                                    return entityWatcher;
                                })
                        .collect(Collectors.toList());
        entityWatcherRepository.saveAll(entityWatchers);

        // Clear the persistence context to force a reload
        entityManager.clear();

        Instant slaDueDate =
                calculateEarliestSlaDueDate(
                        ticket.getWorkflow().getId(), initialStateByWorkflowId.getId());

        WorkflowTransitionHistory history = new WorkflowTransitionHistory();
        history.setTicket(ticket);
        history.setFromState(null);
        history.setToState(initialStateByWorkflowId);
        history.setEventName("Created");
        history.setTransitionDate(Instant.now());
        history.setSlaDueDate(slaDueDate);
        history.setStatus(WorkflowTransitionHistoryStatus.IN_PROGRESS);
        workflowTransitionHistoryRepository.save(history);

        TicketDTO savedTicketDTO = ticketMapper.toDto(ticket);
        eventPublisher.publishEvent(new NewTicketCreatedEvent(this, savedTicketDTO));

        if (ticketDTO.getEstimate() > 0 && ticketDTO.getEpicId() != null) {
            eventPublisher.publishEvent(new ProjectEpicChangedByTicketEvent(this, ticketDTO));
        }
        if (ticketDTO.getEstimate() > 0 && ticketDTO.getIterationId() != null) {
            eventPublisher.publishEvent(new ProjectIterationChangedByTicketEvent(this, ticketDTO));
        }
        return savedTicketDTO;
    }

    @Transactional
    public TicketDTO updateTicket(TicketDTO ticketDTO) {

        Ticket existingTicket =
                ticketRepository
                        .findById(ticketDTO.getId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Ticket not found with id: " + ticketDTO.getId()));
        TicketDTO previousTicket = ticketMapper.toDto(existingTicket);
        Long previousState = previousTicket.getCurrentStateId();

        ticketMapper.updateEntity(ticketDTO, existingTicket);

        boolean isStateChanged = (!Objects.equals(previousState, ticketDTO.getCurrentStateId()));
        existingTicket.setIsNew(!isStateChanged);

        if (isStateChanged) {
            boolean finalState =
                    workflowStateRepository.isFinalState(
                            ticketDTO.getWorkflowId(), ticketDTO.getCurrentStateId());
            existingTicket.setIsCompleted(finalState);
            if (ticketDTO.getActualCompletionDate() == null) {
                existingTicket.setActualCompletionDate(LocalDate.now());
            }
        }

        if (ticketDTO.getAssignUserId() != null) {
            Long assignedUserId = ticketDTO.getAssignUserId();

            // Check if assigned user is already a watcher
            boolean isWatcherPresent =
                    entityWatcherRepository.existsByEntityTypeAndEntityIdAndWatchUserId(
                            EntityType.Ticket, ticketDTO.getId(), assignedUserId);
            if (!isWatcherPresent) {
                EntityWatcher watcher = new EntityWatcher();
                watcher.setEntityType(EntityType.Ticket);
                watcher.setEntityId(ticketDTO.getId());
                watcher.setWatchUser(User.builder().id(assignedUserId).build());
                entityWatcherRepository.save(watcher);
                // Flush & Clear the persistence context to ensure fresh retrieval
                entityManager.flush();
                entityManager.clear();
            }
        }

        TicketDTO savedTicket = ticketMapper.toDto(ticketRepository.save(existingTicket));

        eventPublisher.publishEvent(new AuditLogUpdateEvent(this, previousTicket, ticketDTO));

        if (ticketDTO.getEpicId() != null) {
            eventPublisher.publishEvent(new ProjectEpicChangedByTicketEvent(this, ticketDTO));
        }

        if (ticketDTO.getIterationId() != null) {
            eventPublisher.publishEvent(new ProjectIterationChangedByTicketEvent(this, ticketDTO));
        }

        Long currentState = savedTicket.getCurrentStateId();
        if (!Objects.equals(previousState, currentState)) {
            eventPublisher.publishEvent(
                    new TicketWorkStateTransitionEvent(
                            this, ticketDTO.getId(), previousState, currentState));
        }

        return savedTicket;
    }

    @Transactional
    public void deleteTicket(Long id) {
        Ticket ticket =
                ticketRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Ticket not found with id: " + id));
        if (ticket.getEpic() != null) {
            eventPublisher.publishEvent(
                    new ProjectEpicChangedByTicketEvent(this, ticketMapper.toDto(ticket)));
        }
        if (ticket.getIteration() != null) {
            eventPublisher.publishEvent(
                    new ProjectIterationChangedByTicketEvent(this, ticketMapper.toDto(ticket)));
        }
        ticketRepository.deleteById(id);
    }

    public Optional<TicketDTO> getNextTicket(Long ticketId, Long projectId) {
        return ticketRepository.findNextTicket(ticketId, projectId).map(ticketMapper::toDto);
    }

    public Optional<TicketDTO> getPreviousTicket(Long ticketId, Long projectId) {
        return ticketRepository.findPreviousTicket(ticketId, projectId).map(ticketMapper::toDto);
    }

    // Fetch ticket distribution by team member
    public List<TicketDistributionDTO> getTicketDistribution(
            Long teamId, Instant fromDate, Instant toDate) {
        return ticketRepository.findTicketDistributionByTeamId(teamId, fromDate, toDate);
    }

    // Fetch unassigned tickets
    public Page<TicketDTO> getUnassignedTickets(Long teamId, Pageable pageable) {
        return ticketRepository
                .findUnassignedTicketsByTeamId(teamId, pageable)
                .map(ticketMapper::toDto);
    }

    // Fetch ticket priority distribution
    public List<PriorityDistributionDTO> getPriorityDistribution(
            Long teamId, Instant fromDate, Instant toDate) {
        return ticketRepository.findTicketPriorityDistributionByTeamId(teamId, fromDate, toDate);
    }

    public TicketStatisticsDTO getTicketStatisticsByTeamId(
            Long teamId, Instant fromDate, Instant toDate) {
        return ticketRepository.getTicketStatisticsByTeamId(teamId, fromDate, toDate);
    }

    private Instant calculateEarliestSlaDueDate(Long workflowId, Long sourceStateId) {
        // Fetch all transitions from the current state
        List<WorkflowTransition> transitions =
                workflowTransitionRepository.findTransitionsBySourceState(
                        workflowId, sourceStateId);

        if (transitions.isEmpty()) {
            return null;
        }

        // Find the transition with the lowest SLA duration
        WorkflowTransition earliestTransition =
                transitions.stream()
                        .filter(
                                t ->
                                        t.getSlaDuration()
                                                != null) // Exclude transitions without SLA duration
                        .min(
                                Comparator.comparing(
                                        WorkflowTransition
                                                ::getSlaDuration)) // Find the minimum SLA duration
                        .orElse(null);

        if (earliestTransition == null) {
            return null; // No SLA defined for any transition
        }

        // Calculate the SLA due date for the earliest transition
        return Instant.now().plus(earliestTransition.getSlaDuration(), ChronoUnit.HOURS);
    }

    public Page<TicketDTO> getOverdueTicketsByTeam(Long teamId, Pageable pageable) {
        return ticketRepository
                .findOverdueTicketsByTeamId(teamId, COMPLETED, pageable)
                .map(ticketMapper::toDto);
    }

    public Page<TicketDTO> getOverdueTicketsByUser(Long userId, Pageable pageable) {
        return ticketRepository
                .findOverdueTicketsByUserId(userId, COMPLETED, pageable)
                .map(ticketMapper::toDto);
    }

    public Long countOverdueTickets(
            Long teamId, WorkflowTransitionHistoryStatus status, Instant fromDate, Instant toDate) {
        return ticketRepository.countOverdueTicketsByTeamId(teamId, status, fromDate, toDate);
    }

    public List<TicketActionCountByDateDTO> getTicketCreationTimeSeries(Long teamId, int days) {
        if (days <= 0) {
            days = 7; // Default to 7 days
        }

        LocalDate startDate = LocalDate.now().minusDays(days - 1);
        List<TicketActionCountByDateDTO> trends =
                ticketRepository.findTicketActionByDaySeries(
                        teamId, startDate.atStartOfDay().toInstant(ZoneOffset.UTC));

        // Fill missing dates with zero counts
        Map<LocalDate, TicketActionCountByDateDTO> trendMap = new HashMap<>();
        for (TicketActionCountByDateDTO trend : trends) {
            trendMap.put(trend.getDate(), trend);
        }

        List<TicketActionCountByDateDTO> ticketByDaySeries = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);
            TicketActionCountByDateDTO trend =
                    trendMap.getOrDefault(date, new TicketActionCountByDateDTO(date, 0L, 0L));
            ticketByDaySeries.add(trend);
        }

        return ticketByDaySeries;
    }

    public List<TeamTicketPriorityDistributionDTO> getPriorityDistributionForUser(
            Long userId, Instant fromDate, Instant toDate) {
        return ticketRepository.findPriorityDistributionByUserId(userId, fromDate, toDate);
    }

    @Transactional
    public TicketDTO updateTicketState(Long ticketId, Long newStateId) {
        Ticket ticket =
                ticketRepository
                        .findById(ticketId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Not find the ticket id " + ticketId));
        TicketDTO newTicket = ticketMapper.toDto(ticket);
        newTicket.setCurrentStateId(newStateId);
        return updateTicket(newTicket);
    }

    private Long getNextProjectTicketNumber(Long projectId) {
        try {
            ProjectTicketSequence sequence =
                    projectTicketSequenceRepository
                            .findById(projectId)
                            .orElseGet(
                                    () -> {
                                        ProjectTicketSequence newSeq = new ProjectTicketSequence();
                                        newSeq.setProjectId(projectId);
                                        newSeq.setLastTicketNumber(0L);
                                        return newSeq;
                                    });

            sequence.setLastTicketNumber(sequence.getLastTicketNumber() + 1);
            projectTicketSequenceRepository.saveAndFlush(sequence);
            return sequence.getLastTicketNumber();

        } catch (ObjectOptimisticLockingFailureException e) {
            throw new ConcurrentModificationException(
                    "Concurrent project ticket creation detected. Please retry.", e);
        }
    }

    @Transactional
    public void closeTicketsWithIteration(Long iterationId) {
        ticketRepository.findTicketsByIterationIdAndClose(iterationId);
    }
}
