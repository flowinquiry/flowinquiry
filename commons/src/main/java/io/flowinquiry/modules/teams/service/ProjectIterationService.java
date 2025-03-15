package io.flowinquiry.modules.teams.service;

import static java.util.stream.Collectors.toList;

import io.flowinquiry.modules.teams.domain.ProjectIteration;
import io.flowinquiry.modules.teams.repository.ProjectIterationRepository;
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

    private final ProjectIterationRepository iterationRepository;

    public List<ProjectIterationDTO> getAllIterations(Long projectId) {
        return iterationRepository.findByProjectId(projectId).stream()
                .map(projectIterationMapper::toDto)
                .collect(toList());
    }

    public Optional<ProjectIterationDTO> getIterationById(Long id) {
        return iterationRepository.findById(id).map(projectIterationMapper::toDto);
    }

    @Transactional
    public ProjectIterationDTO createIteration(ProjectIteration iteration) {
        return projectIterationMapper.toDto(iterationRepository.save(iteration));
    }

    @Transactional
    public ProjectIterationDTO updateIteration(Long id, ProjectIterationDTO updatedIteration) {
        return iterationRepository
                .findById(id)
                .map(
                        existingIteration -> {
                            existingIteration.setName(updatedIteration.getName());
                            existingIteration.setStartDate(updatedIteration.getStartDate());
                            existingIteration.setEndDate(updatedIteration.getEndDate());
                            return iterationRepository.save(existingIteration);
                        })
                .map(projectIterationMapper::toDto)
                .orElseThrow(
                        () -> new IllegalArgumentException("Iteration not found with id: " + id));
    }

    @Transactional
    public void deleteIteration(Long id) {
        iterationRepository.deleteById(id);
    }
}
