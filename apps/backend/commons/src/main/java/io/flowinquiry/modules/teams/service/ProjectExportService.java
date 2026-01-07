package io.flowinquiry.modules.teams.service;

import io.flowinquiry.modules.shared.HttpHeaderConstants;
import io.flowinquiry.modules.teams.service.dto.ExportDataDTO;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.export.CsvExporter;
import io.flowinquiry.modules.teams.service.export.ExcelExporter;
import io.flowinquiry.query.QueryDTO;
import java.util.Optional;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class ProjectExportService {

    private final CsvExporter csvExporter;
    private final ExcelExporter excelExporter;
    private final ProjectService projectService;

    public ExportDataDTO export(Optional<QueryDTO> queryDTO, Pageable pageable, String exportType) {

        Page<ProjectDTO> page = projectService.findProjects(queryDTO, pageable);

        if (exportType.equalsIgnoreCase(HttpHeaderConstants.CSV_MIME_TYPE)) {
            return new ExportDataDTO(
                    "projects.csv", csvExporter.export(page.getContent(), ProjectDTO.class));
        } else if (exportType.equalsIgnoreCase(HttpHeaderConstants.EXCEL_MIME_TYPE)) {
            return new ExportDataDTO(
                    "projects.xlsx",
                    excelExporter.export(page.getContent(), "Projects", ProjectDTO.class));
        }
        return null;
    }
}
