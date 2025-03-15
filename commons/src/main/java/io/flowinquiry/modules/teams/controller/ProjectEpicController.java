package io.flowinquiry.modules.teams.controller;

import io.flowinquiry.exceptions.ResourceNotFoundException;
import io.flowinquiry.modules.teams.domain.ProjectEpic;
import io.flowinquiry.modules.teams.service.ProjectEpicService;
import io.flowinquiry.modules.teams.service.dto.ProjectEpicDTO;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/epics")
@RequiredArgsConstructor
public class ProjectEpicController {

    private final ProjectEpicService epicService;

    @GetMapping("/{projectId}")
    public List<ProjectEpicDTO> getAllEpics(@PathVariable Long projectId) {
        return epicService.getAllEpics(projectId);
    }

    @GetMapping("/{id}")
    public ProjectEpicDTO getEpicById(@PathVariable Long id) {
        return epicService
                .getEpicById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Epic not found with id: " + id));
    }

    @PostMapping
    public ProjectEpicDTO createEpic(@RequestBody ProjectEpic epic) {
        return epicService.createEpic(epic);
    }

    @PutMapping("/{id}")
    public ProjectEpicDTO updateEpic(
            @PathVariable Long id, @RequestBody ProjectEpicDTO updatedEpic) {
        return epicService.updateEpic(id, updatedEpic);
    }

    @DeleteMapping("/{id}")
    public void deleteEpic(@PathVariable Long id) {
        epicService.deleteEpic(id);
    }
}
