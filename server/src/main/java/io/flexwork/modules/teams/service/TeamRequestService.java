package io.flexwork.modules.teams.service;

import static io.flexwork.query.QueryUtils.createSpecification;

import io.flexwork.modules.collab.service.event.NewTeamRequestCreatedEvent;
import io.flexwork.modules.teams.domain.TeamRequest;
import io.flexwork.modules.teams.repository.TeamRequestRepository;
import io.flexwork.modules.teams.service.dto.TeamRequestDTO;
import io.flexwork.modules.teams.service.mapper.TeamRequestMapper;
import io.flexwork.query.QueryDTO;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import org.jclouds.rest.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TeamRequestService {

    private final TeamRequestRepository teamRequestRepository;
    private final TeamRequestMapper teamRequestMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public TeamRequestService(
            TeamRequestRepository teamRequestRepository,
            TeamRequestMapper teamRequestMapper,
            ApplicationEventPublisher eventPublisher) {
        this.teamRequestRepository = teamRequestRepository;
        this.teamRequestMapper = teamRequestMapper;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public Page<TeamRequestDTO> getAllTeamRequests(Pageable pageable) {
        return teamRequestRepository.findAll(pageable).map(teamRequestMapper::toDto);
    }

    public Page<TeamRequestDTO> findTeamRequests(QueryDTO queryDTO, Pageable pageable) {
        if (!hasTeamIdFilter(queryDTO)) {
            throw new ResourceNotFoundException("No team id found");
        }
        Specification<TeamRequest> spec = createSpecification(Optional.of(queryDTO));
        return teamRequestRepository.findAll(spec, pageable).map(teamRequestMapper::toDto);
    }

    @Transactional(readOnly = true)
    public TeamRequestDTO getTeamRequestById(Long id) {
        TeamRequest teamRequest =
                teamRequestRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "TeamRequest not found with id: " + id));
        return teamRequestMapper.toDto(teamRequest);
    }

    @Transactional
    public TeamRequestDTO createTeamRequest(TeamRequestDTO teamRequestDTO) {
        TeamRequest teamRequest = teamRequestMapper.toEntity(teamRequestDTO);
        teamRequest.setCreatedDate(LocalDateTime.now());
        teamRequest = teamRequestRepository.save(teamRequest);
        TeamRequestDTO savedTeamRequestDTO = teamRequestMapper.toDto(teamRequest);
        eventPublisher.publishEvent(new NewTeamRequestCreatedEvent(this, savedTeamRequestDTO));
        return savedTeamRequestDTO;
    }

    @Transactional
    public TeamRequestDTO updateTeamRequest(Long id, TeamRequestDTO teamRequestDTO) {
        TeamRequest existingTeamRequest =
                teamRequestRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "TeamRequest not found with id: " + id));

        teamRequestMapper.updateEntity(teamRequestDTO, existingTeamRequest);
        existingTeamRequest = teamRequestRepository.save(existingTeamRequest);
        return teamRequestMapper.toDto(existingTeamRequest);
    }

    @Transactional
    public void deleteTeamRequest(Long id) {
        if (!teamRequestRepository.existsById(id)) {
            throw new ResourceNotFoundException("TeamRequest not found with id: " + id);
        }
        teamRequestRepository.deleteById(id);
    }

    private static boolean hasTeamIdFilter(QueryDTO queryDTO) {
        return queryDTO != null
                && queryDTO.getFilters() != null
                && queryDTO.getFilters().stream()
                        .filter(Objects::nonNull)
                        .anyMatch(filter -> "team.id".equals(filter.getField()));
    }
}
