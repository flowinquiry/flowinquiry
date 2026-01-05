package io.flowinquiry.modules.teams.service.export;

import com.opencsv.CSVWriter;
import io.flowinquiry.modules.teams.ExportException;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CsvExporter<T> {

    public byte[] export(List<T> data, Class<T> type) {
        if (data == null || data.isEmpty()) {
            return new byte[0];
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                CSVWriter writer =
                        new CSVWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {

            Field[] fields = type.getDeclaredFields();

            // Header
            String[] header = new String[fields.length];
            for (int i = 0; i < fields.length; i++) {
                fields[i].setAccessible(true);
                header[i] = fields[i].getName();
            }
            writer.writeNext(header);

            // Data rows
            for (T item : data) {
                String[] row = new String[fields.length];
                for (int i = 0; i < fields.length; i++) {
                    Object value = fields[i].get(item);
                    row[i] = value != null ? value.toString() : "";
                }
                writer.writeNext(row);
            }

            writer.flush();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new ExportException("Failed to export CSV for " + type.getSimpleName(), e);
        }
    }
}