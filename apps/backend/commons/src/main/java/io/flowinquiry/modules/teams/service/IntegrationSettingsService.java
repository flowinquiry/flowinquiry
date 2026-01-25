package io.flowinquiry.modules.teams.service;

import io.flowinquiry.modules.teams.domain.Integration;
import io.flowinquiry.modules.teams.domain.Project;
import io.flowinquiry.modules.teams.repository.IntegrationSettingsRepository;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.dto.IntegrationDTO;
import io.flowinquiry.modules.teams.service.mapper.IntegrationMapper;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class IntegrationSettingsService {
    private IntegrationSettingsRepository integrationSettingsRepository;
    private ProjectRepository projectRepository;

    private IntegrationMapper mapper;

    @Transactional
    public IntegrationDTO CreateIntegration(IntegrationDTO dto) {

        Integration entity = mapper.toEntity(dto);
        entity.setProject(
                projectRepository
                        .findById(dto.getProjectId())
                        .orElseThrow(() -> new EntityNotFoundException("")));
        entity = integrationSettingsRepository.save(entity);
        return mapper.toDto(entity);
    }

    @Transactional
    public IntegrationDTO getIntegrationById(Long id) {
        return integrationSettingsRepository
                .findById(id)
                .map(mapper::toDto)
                .map(
                        integrationDTO -> {
                            if (integrationDTO.isEnabled()) setIntegrationUrl(integrationDTO);
                            return integrationDTO;
                        })
                .orElseThrow(() -> new EntityNotFoundException(""));
    }

    @Transactional
    public IntegrationDTO updateIntegration(Long id, IntegrationDTO dto) {
        return integrationSettingsRepository
                .findById(id)
                .map(
                        integrationDetails -> {
                            integrationDetails.setEnabled(dto.isEnabled());
                            integrationDetails.setConfig(dto.getConfig());
                            return integrationSettingsRepository.save(integrationDetails);
                        })
                .map(mapper::toDto)
                .map(
                        integrationDTO -> {
                            if (integrationDTO.isEnabled()) setIntegrationUrl(integrationDTO);
                            return integrationDTO;
                        })
                .orElseThrow(() -> new EntityNotFoundException(""));
    }

    @Transactional
    public List<Integration> getAllIntegrationByProjectId(Long id) {
        return integrationSettingsRepository.getAllIntegrationsByProjectId(id);
    }

    @Transactional
    public void deleteIntegration(Long id) {
        integrationSettingsRepository.deleteById(id);
    }

    private void setIntegrationUrl(IntegrationDTO dto) {
        Long id = dto.getProjectId();
        Project project = projectRepository.findById(id).orElseThrow();
        String integrationUrl =
                String.format(
                        "projectUrl/api/integrations/webhook?projectName=%s",
                        project.getShortName());
        dto.setIntegrationEndpoint(integrationUrl);
    }
}
