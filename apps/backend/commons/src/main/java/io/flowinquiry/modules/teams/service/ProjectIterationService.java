package io.flowinquiry.modules.teams.service;

import static java.util.stream.Collectors.toList;
import static  io.flowinquiry.modules.teams.utils.ProjectIterationNameGenerator.*;
import io.flowinquiry.modules.teams.domain.*;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.modules.teams.service.mapper.ProjectIterationMapper;

import java.time.Instant;
import java.time.Period;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectIterationService {

    private final ProjectIterationMapper projectIterationMapper;

    private final ProjectIterationRepository projectIterationRepository;

    private final ProjectRepository projectRepository;

    private  final  TicketService ticketService;

    public List<ProjectIterationDTO> findByProjectId(Long projectId) {
        return projectIterationRepository.findByProjectIdOrderByStartDateAsc(projectId).stream()
                .map(projectIterationMapper::toDto)
                .collect(toList());
    }

    public Optional<ProjectIterationDTO> getIterationById(Long id) {
        return projectIterationRepository.findById(id).map(projectIterationMapper::toDto);
    }

    @Transactional
    public ProjectIterationDTO save(ProjectIterationDTO projectIterationDTO) {
        Project project =
                projectRepository
                        .findById(projectIterationDTO.getProjectId())
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Project not found: "
                                                        + projectIterationDTO.getProjectId()));

        ProjectIteration iteration = projectIterationMapper.toEntity(projectIterationDTO);
        iteration.setProject(project);

        ProjectIteration saved = projectIterationRepository.save(iteration);

        return projectIterationMapper.toDto(saved);
    }

    @Transactional
    public ProjectIterationDTO updateIteration(Long id, ProjectIterationDTO updatedIteration) {
        return projectIterationRepository
                .findById(id)
                .map(
                        existingIteration -> {
                            existingIteration.setName(updatedIteration.getName());
                            existingIteration.setDescription(updatedIteration.getDescription());
                            existingIteration.setStartDate(updatedIteration.getStartDate());
                            existingIteration.setEndDate(updatedIteration.getEndDate());
                            return projectIterationRepository.save(existingIteration);
                        })
                .map(projectIterationMapper::toDto)
                .orElseThrow(
                        () -> new IllegalArgumentException("Iteration not found with id: " + id));
    }

    @Transactional
    public void deleteIteration(Long id) {
        projectIterationRepository.deleteById(id);
    }

    @Transactional
    public ProjectIterationDTO closeIteration(Long id)
    {
        ProjectIteration currentIteration = projectIterationRepository.findById(id)
                .orElseThrow(
                () -> new IllegalArgumentException("Iteration not found with id: " + id));
        ProjectSetting projectSetting = currentIteration.getProject().getProjectSetting();
        Integer sprintLengthInDays = projectSetting.getSprintLengthDays();
        currentIteration.setStatus(ProjectIterationStatus.CLOSED);
        projectIterationRepository.save(currentIteration);
        ticketService.closeTicketsWithIteration(currentIteration.getId());

        boolean createNextIteration = projectIterationRepository.existsByProjectIdAndStatusAndStartDateAfter(currentIteration.getProject().getId(),ProjectIterationStatus.ACTIVE,currentIteration.getEndDate());
        if(!createNextIteration) {
            ProjectIteration newIteration = new ProjectIteration();
            newIteration.setName(getNextIteration(currentIteration.getName()));
            newIteration.setStatus(ProjectIterationStatus.ACTIVE);
            newIteration.setDescription(currentIteration.getDescription());
            newIteration.setStartDate(currentIteration.getEndDate().plus(Period.ofDays(1)));
            newIteration.setEndDate(currentIteration.getEndDate().plus(Period.ofDays(sprintLengthInDays + 1)));
            newIteration.setProject(currentIteration.getProject());

            currentIteration = projectIterationRepository.save(newIteration);
        }

        return projectIterationMapper.toDto(currentIteration);
    }


}
