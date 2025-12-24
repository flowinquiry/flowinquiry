package io.flowinquiry.modules.teams.service;

import io.flowinquiry.modules.teams.service.dto.ProjectDTO;
import java.io.ByteArrayOutputStream;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

@Service
public class ProjectExportService {

    public byte[] exportToCsv(List<ProjectDTO> data) {
        if (data == null || data.isEmpty()) {
            return new byte[0];
        }

        StringBuilder sb = new StringBuilder();
        Field[] fields = data.get(0).getClass().getDeclaredFields();

        try {
            // Creating headers
            for (int i = 0; i < fields.length; i++) {
                fields[i].setAccessible(true);
                sb.append(fields[i].getName());
                if (i < fields.length - 1) sb.append(",");
            }
            sb.append("\n");

            // Writing data rows
            for (ProjectDTO item : data) {
                for (int i = 0; i < fields.length; i++) {
                    Object value = fields[i].get(item);
                    sb.append(escapeCsv(value));
                    if (i < fields.length - 1) sb.append(",");
                }
                sb.append("\n");
            }

            return sb.toString().getBytes(StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new RuntimeException("Failed to export CSV", e);
        }
    }

    private String escapeCsv(Object value) {
        if (value == null) return "";
        String str = value.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            str = str.replace("\"", "\"\"");
            return "\"" + str + "\"";
        }
        return str;
    }

    public byte[] exportToXlsx(List<ProjectDTO> data) {
        if (data == null || data.isEmpty()) {
            return new byte[0];
        }

        try (Workbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Projects");

            Field[] fields = data.get(0).getClass().getDeclaredFields();

            // Setting Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Setting Header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < fields.length; i++) {
                fields[i].setAccessible(true);
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(fields[i].getName());
                cell.setCellStyle(headerStyle);
            }

            // Writing data rows
            int rowIdx = 1;
            for (ProjectDTO item : data) {
                Row row = sheet.createRow(rowIdx++);
                for (int col = 0; col < fields.length; col++) {
                    Object value = fields[col].get(item);
                    Cell cell = row.createCell(col);
                    setCellValue(cell, value);
                }
            }

            // Setting column widths
            for (int i = 0; i < fields.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to export XLSX", e);
        }
    }

    private void setCellValue(Cell cell, Object value) {
        if (value == null) {
            cell.setBlank();
            return;
        }

        if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
        } else if (value instanceof Boolean bool) {
            cell.setCellValue(bool);
        } else {
            cell.setCellValue(value.toString());
        }
    }
}
