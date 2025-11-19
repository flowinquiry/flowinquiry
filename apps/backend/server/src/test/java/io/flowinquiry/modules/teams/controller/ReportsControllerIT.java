package io.flowinquiry.modules.teams.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import java.time.Instant;
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
public class ReportsControllerIT {

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
                    .andExpect(jsonPath("$.length()").value(6))
                    .andExpect(jsonPath("$[0].bucketLabel").value("0-2days"))
                    .andExpect(jsonPath("$[0].groupedTickets.length()").value(3))
                    .andExpect(jsonPath("$[1].bucketLabel").value("3-5days"))
                    .andExpect(jsonPath("$[1].groupedTickets.length()").value(3))
                    .andExpect(jsonPath("$[2].bucketLabel").value("6-10days"))
                    .andExpect(jsonPath("$[3].bucketLabel").value("11-20days"))
                    .andExpect(jsonPath("$[4].bucketLabel").value("21-30days"))
                    .andExpect(jsonPath("$[5].bucketLabel").value("31moredays"))
                    .andExpect(jsonPath("$[0].groupedTickets.length()").value(3))
                    .andExpect(jsonPath("$[0].groupedTickets[0].groupByAttribute").value(1))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets.length()").value(1))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets[0].id").value(13))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets[0].teamId").value(6))
                    .andExpect(
                            jsonPath("$[0].groupedTickets[0].tickets[0].priority").value("Medium"))
                    .andExpect(jsonPath("$[0].groupedTickets[1].groupByAttribute").value(2))
                    .andExpect(jsonPath("$[0].groupedTickets[1].tickets.length()").value(1))
                    .andExpect(jsonPath("$[0].groupedTickets[1].tickets[0].id").value(14))
                    .andExpect(jsonPath("$[0].groupedTickets[1].tickets[0].teamId").value(6))
                    .andExpect(
                            jsonPath("$[0].groupedTickets[1].tickets[0].priority")
                                    .value("Critical"));
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
                    .andExpect(jsonPath("$.length()").value(6))
                    .andExpect(jsonPath("$[0].bucketLabel").value("0-2days"))
                    .andExpect(jsonPath("$[0].groupedTickets.length()").value(3))
                    .andExpect(jsonPath("$[1].bucketLabel").value("3-5days"))
                    .andExpect(jsonPath("$[1].groupedTickets.length()").value(3))
                    .andExpect(jsonPath("$[2].bucketLabel").value("6-10days"))
                    .andExpect(jsonPath("$[3].bucketLabel").value("11-20days"))
                    .andExpect(jsonPath("$[4].bucketLabel").value("21-30days"))
                    .andExpect(jsonPath("$[5].bucketLabel").value("31moredays"))
                    .andExpect(jsonPath("$[0].groupedTickets[0].groupByAttribute").value(1))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets.length()").value(2))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets[1].id").value(16))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets[1].teamId").value(6))
                    .andExpect(
                            jsonPath("$[0].groupedTickets[0].tickets[1].priority").value("Medium"))
                    .andExpect(
                            jsonPath("$[0].groupedTickets[0].tickets[1].isCompleted").value(true));
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
                    .andExpect(jsonPath("$.length()").value(6))
                    .andExpect(jsonPath("$[0].bucketLabel").value("0-2days"))
                    .andExpect(jsonPath("$[0].groupedTickets.length()").value(2))
                    .andExpect(jsonPath("$[1].bucketLabel").value("3-5days"))
                    .andExpect(jsonPath("$[1].groupedTickets.length()").value(2))
                    .andExpect(jsonPath("$[2].bucketLabel").value("6-10days"))
                    .andExpect(jsonPath("$[3].bucketLabel").value("11-20days"))
                    .andExpect(jsonPath("$[4].bucketLabel").value("21-30days"))
                    .andExpect(jsonPath("$[5].bucketLabel").value("31moredays"))
                    .andExpect(jsonPath("$[0].groupedTickets[0].groupByAttribute").value("High"))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets.length()").value(1))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets[0].id").value(15))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets[0].teamId").value(6))
                    .andExpect(jsonPath("$[0].groupedTickets[0].tickets[0].priority").value("High"))
                    .andExpect(jsonPath("$[0].groupedTickets[1].groupByAttribute").value("Medium"))
                    .andExpect(jsonPath("$[0].groupedTickets[1].tickets.length()").value(1))
                    .andExpect(jsonPath("$[0].groupedTickets[1].tickets[0].id").value(13))
                    .andExpect(jsonPath("$[0].groupedTickets[1].tickets[0].teamId").value(6))
                    .andExpect(
                            jsonPath("$[0].groupedTickets[1].tickets[0].priority").value("Medium"));
        }
    }
}
