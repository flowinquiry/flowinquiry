package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
public class ProjectExportServiceIT {
    private @Autowired ProjectExportService projectExportService;

    private @Autowired ProjectRepository projectRepository;

    @Test
    void shouldExportExcelWithCorrectHeadersAndValues() throws Exception {

        ProjectDTO project = createProjectDTO();
        byte[] result = projectExportService.exportToXlsx(List.of(project));

        assertThat(result).isNotNull();
        assertThat(result.length).isGreaterThan(0);

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result))) {

            Sheet sheet = workbook.getSheetAt(0);

            // validate column headers
            Row header = sheet.getRow(0);
            assertThat(header).isNotNull();

            assertThat(header.getCell(0).getStringCellValue()).isEqualTo("id");
            assertThat(header.getCell(1).getStringCellValue()).isEqualTo("name");
            assertThat(header.getCell(2).getStringCellValue()).isEqualTo("description");
            assertThat(header.getCell(3).getStringCellValue()).isEqualTo("shortName");
            assertThat(header.getCell(4).getStringCellValue()).isEqualTo("teamId");
            assertThat(header.getCell(5).getStringCellValue()).isEqualTo("teamName");
            assertThat(header.getCell(6).getStringCellValue()).isEqualTo("status");

            // validate row values
            Row row = sheet.getRow(1);
            assertThat(row).isNotNull();

            assertThat(row.getCell(1).getStringCellValue()).isEqualTo("Sample project");
            assertThat(row.getCell(2).getStringCellValue()).isEqualTo("Project description");
            assertThat(row.getCell(3).getStringCellValue()).isEqualTo("SP");
            assertThat(row.getCell(4).getNumericCellValue()).isEqualTo(1L);
            assertThat(row.getCell(6).getStringCellValue()).isEqualTo(ProjectStatus.Active.name());
        }
    }

    @Test
    void shouldExportCsvWithCorrectHeadersAndValues() {
        ProjectDTO project = createProjectDTO();

        byte[] result = projectExportService.exportToCsv(List.of(project));

        String csv = new String(result, StandardCharsets.UTF_8);

        assertThat(csv).isNotBlank();

        String[] lines = csv.split("\n");
        assertThat(lines).hasSize(2);

        String header = lines[0];
        String row = lines[1];

        assertThat(header).contains("name");
        assertThat(header).contains("description");
        assertThat(header).contains("shortName");
        assertThat(header).contains("status");
        assertThat(header).contains("teamId");
        assertThat(header).contains("createdBy");

        assertThat(row).contains("Sample project");
        assertThat(row).contains("Project description");
        assertThat(row).contains("SP");
        assertThat(row).contains("Active");
        assertThat(row).contains("1");
    }

    private ProjectDTO createProjectDTO() {
        return ProjectDTO.builder()
                .name("Sample project")
                .description("Project description")
                .shortName("SP")
                .status(ProjectStatus.Active)
                .teamId(1L)
                .createdBy(1L)
                .build();
    }
}
