package io.flowinquiry.modules.teams.service;

import static java.util.stream.Collectors.toList;

import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectIterationDTO;
import io.flowinquiry.modules.teams.service.mapper.ProjectIterationMapper;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectIterationService {

    private final ProjectIterationMapper projectIterationMapper;

    private final ProjectIterationRepository projectIterationRepository;

    private final ProjectRepository projectRepository;

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
}
