package io.flowinquiry.modules.teams.service;

import static org.assertj.core.api.Assertions.assertThat;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.shared.HttpHeaderConstants;
import io.flowinquiry.modules.teams.domain.ProjectStatus;
import io.flowinquiry.modules.teams.repository.ProjectRepository;
import io.flowinquiry.modules.teams.repository.TeamRepository;
import io.flowinquiry.modules.teams.service.dto.ExportDataDTO;
import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import io.flowinquiry.modules.teams.service.mapper.ProjectMapper;
import io.flowinquiry.query.Filter;
import io.flowinquiry.query.FilterOperator;
import io.flowinquiry.query.QueryDTO;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class ProjectExportServiceIT {

    @Autowired private ProjectExportService projectExportService;

    @Autowired private ProjectRepository projectRepository;

    @Autowired private TeamRepository teamRepository;

    @Autowired private ProjectMapper projectMapper;

    @Test
    void shouldExportExcelWithCorrectHeadersAndValues() throws Exception {

        QueryDTO queryDTO = getQueryDTOForSampleProject();

        ExportDataDTO result =
                projectExportService.export(
                        Optional.of(queryDTO),
                        Pageable.ofSize(10),
                        HttpHeaderConstants.EXCEL_MIME_TYPE);

        assertThat(result).isNotNull();
        assertThat(result.getFileName()).isEqualTo("projects.xlsx");
        assertThat(result.getData()).isNotEmpty();

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result.getData()))) {

            Sheet sheet = workbook.getSheetAt(0);

            // validate headers
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

        QueryDTO queryDTO = getQueryDTOForSampleProject();

        ExportDataDTO result =
                projectExportService.export(
                        Optional.of(queryDTO),
                        Pageable.ofSize(10),
                        HttpHeaderConstants.CSV_MIME_TYPE);

        assertThat(result).isNotNull();
        assertThat(result.getFileName()).isEqualTo("projects.csv");

        String csv = new String(result.getData(), StandardCharsets.UTF_8);

        assertThat(csv).isNotBlank();

        // headers
        assertThat(csv).contains("name");
        assertThat(csv).contains("description");
        assertThat(csv).contains("shortName");
        assertThat(csv).contains("status");
        assertThat(csv).contains("teamId");

        // values
        assertThat(csv).contains("Sample project");
        assertThat(csv).contains("Project description");
        assertThat(csv).contains("SP");
        assertThat(csv).contains("Active");
        assertThat(csv).contains("1");
    }

    private QueryDTO getQueryDTOForSampleProject() {
        ProjectDTO projectDTO = createProjectDTO();

        projectRepository.save(projectMapper.toEntity(projectDTO));

        QueryDTO queryDTO = new QueryDTO();
        Filter nameFilter = new Filter("name", FilterOperator.EQ, "Sample project");
        Pageable pageable = Pageable.ofSize(10);

        queryDTO.setFilters(List.of(nameFilter));
        return queryDTO;
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
