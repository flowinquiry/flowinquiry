package io.flowinquiry.modules.teams.service;

import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.export.CsvExporter;
import io.flowinquiry.modules.teams.service.export.ExcelExporter;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProjectExportService {

    public byte[] exportToCsv(List<ProjectDTO> data) {
        CsvExporter<ProjectDTO> exporter = new CsvExporter<>(ProjectDTO.class);
        return exporter.export(data);
    }

    public byte[] exportToXlsx(List<ProjectDTO> data) {
        ExcelExporter<ProjectDTO> exporter = new ExcelExporter<>(ProjectDTO.class);
        return exporter.export(data, "Projects");
    }
}
