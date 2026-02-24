package io.flowinquiry.modules.teams.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@AutoConfigureMockMvc
@WithMockFwUser(
        userId = 1L,
        authorities = {AuthoritiesConstants.ADMIN})
@IntegrationTest
@Transactional
public class TicketAgingReportControllerIT {

    @Autowired private ObjectMapper om;

    @Autowired private MockMvc mockMvc;

    @Test
    @Transactional
    void testTicketReport() throws Exception {
        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            mockMvc.perform(get("/api/reports/tickets/ageing").param("projectId", "3"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.groupedTickets.length()").value(3))
                    .andExpect(
                            jsonPath("$.groupedTickets.keys()")
                                    .value(Set.of("Alice Johnson", "John Doe", "Jane Smith")))
                    .andExpect(jsonPath("$.groupedTickets.['Alice Johnson'].length()").value(6))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[0].ticketId").value(35))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[0].ticketKey")
                                    .value("TICKET-35"))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[0].ageInDays").value(41))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[1].ticketId").value(31))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[1].ticketKey")
                                    .value("TICKET-31"))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[1].ageInDays").value(30))
                    .andExpect(jsonPath("$.groupedTickets.['John Doe'].length()").value(6))
                    .andExpect(jsonPath("$.groupedTickets.['John Doe'].[0].ticketId").value(33))
                    .andExpect(
                            jsonPath("$.groupedTickets.['John Doe'].[0].ticketKey")
                                    .value("TICKET-33"))
                    .andExpect(jsonPath("$.groupedTickets.['John Doe'].[0].ageInDays").value(36))
                    .andExpect(jsonPath("$.groupedTickets.['John Doe'].[1].ticketId").value(29))
                    .andExpect(
                            jsonPath("$.groupedTickets.['John Doe'].[1].ticketKey")
                                    .value("TICKET-29"))
                    .andExpect(jsonPath("$.groupedTickets.['John Doe'].[1].ageInDays").value(26));
        }
    }

    @Test
    @Transactional
    void testTicketReportWithClosedTickets() throws Exception {
        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            mockMvc.perform(
                            get("/api/reports/tickets/ageing")
                                    .param("projectId", "3")
                                    .param("includeClosed", "true"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.groupedTickets.length()").value(3))
                    .andExpect(
                            jsonPath("$.groupedTickets.keys()")
                                    .value(Set.of("Alice Johnson", "John Doe", "Jane Smith")))
                    .andExpect(jsonPath("$.groupedTickets.['Alice Johnson'].length()").value(8))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[1].ticketId").value(36))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[1].ticketKey")
                                    .value("TICKET-36"))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[1].ageInDays").value(35))
                    .andExpect(
                            jsonPath("$.groupedTickets.['Alice Johnson'].[1].completionDate")
                                    .exists())
                    .andExpect(jsonPath("$.groupedTickets.['John Doe'].[3].ticketId").value(28))
                    .andExpect(
                            jsonPath("$.groupedTickets.['John Doe'].[3].ticketKey")
                                    .value("TICKET-28"))
                    .andExpect(jsonPath("$.groupedTickets.['John Doe'].[3].ageInDays").value(13))
                    .andExpect(
                            jsonPath("$.groupedTickets.['John Doe'].[3].completionDate").exists());
        }
    }

    @Test
    @Transactional
    void testTicketReportOnlyTicketsGroupByPriority() throws Exception {
        Instant fixed = Instant.parse("2025-11-15T23:59:59.846138634Z");
        try (MockedStatic<Instant> mocked =
                Mockito.mockStatic(Instant.class, Mockito.CALLS_REAL_METHODS)) {
            mocked.when(Instant::now).thenReturn(fixed);
            mockMvc.perform(
                            get("/api/reports/tickets/ageing")
                                    .param("projectId", "3")
                                    .param("priority", "High,Medium")
                                    .param("groupBy", "priority"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.groupedTickets.length()").value(2))
                    .andExpect(jsonPath("$.groupedTickets.keys()").value(Set.of("High", "Medium")))
                    .andExpect(jsonPath("$.groupedTickets.High.length()").value(6))
                    .andExpect(jsonPath("$.groupedTickets.Medium.length()").value(6))
                    .andExpect(jsonPath("$.averageAge").value(15.25))
                    .andExpect(jsonPath("$.maxAge").value(38))
                    .andExpect(jsonPath("$.minAge").value(0))
                    .andExpect(jsonPath("$.totalTickets").value(12))
                    .andExpect(jsonPath("$.groupedTickets.High.[0].ticketId").value(34))
                    .andExpect(jsonPath("$.groupedTickets.High.[0].ticketKey").value("TICKET-34"))
                    .andExpect(jsonPath("$.groupedTickets.High.[0].assignee").value("Jane Smith"))
                    .andExpect(jsonPath("$.groupedTickets.Medium.[0].ticketId").value(33))
                    .andExpect(jsonPath("$.groupedTickets.Medium.[0].ticketKey").value("TICKET-33"))
                    .andExpect(jsonPath("$.groupedTickets.Medium.[0].assignee").value("John Doe"));
        }
    }
}
