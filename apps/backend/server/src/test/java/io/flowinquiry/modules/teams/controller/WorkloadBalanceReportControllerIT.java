package io.flowinquiry.modules.teams.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.it.WithMockFwUser;
import io.flowinquiry.modules.teams.service.dto.WorkloadBalanceQueryDTO;
import io.flowinquiry.modules.usermanagement.AuthoritiesConstants;
import org.junit.jupiter.api.Test;
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
public class WorkloadBalanceReportControllerIT {

    @Autowired private ObjectMapper om;

    @Autowired private MockMvc mockMvc;

    @Test
    @Transactional
    void testGetWorkloadBalanceReport() throws Exception {
        mockMvc.perform(get("/api/reports/tickets/workload-balance").param("projectId", "3"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalOpenTickets").isNumber())
                .andExpect(jsonPath("$.averagePerMember").isNumber())
                .andExpect(jsonPath("$.members").isArray());
    }

    @Test
    @Transactional
    void testGetWorkloadBalanceReportMembersHaveExpectedFields() throws Exception {
        mockMvc.perform(get("/api/reports/tickets/workload-balance").param("projectId", "3"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.members[0].userName").isString())
                .andExpect(jsonPath("$.members[0].openCount").isNumber())
                .andExpect(jsonPath("$.members[0].closedCount").isNumber())
                .andExpect(jsonPath("$.members[0].overdueCount").isNumber())
                .andExpect(jsonPath("$.members[0].avgAgeInDays").isNumber())
                .andExpect(jsonPath("$.members[0].priorityBreakdown").isMap());
    }

    @Test
    @Transactional
    void testPostWorkloadBalanceReport() throws Exception {
        WorkloadBalanceQueryDTO query = new WorkloadBalanceQueryDTO();
        query.setProjectId(3L);

        mockMvc.perform(
                        post("/api/reports/tickets/workload-balance")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(query)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalOpenTickets").isNumber())
                .andExpect(jsonPath("$.members").isArray());
    }

    @Test
    @Transactional
    void testPostWorkloadBalanceReportFilterByPriority() throws Exception {
        WorkloadBalanceQueryDTO query = new WorkloadBalanceQueryDTO();
        query.setProjectId(3L);
        query.setPriorities(java.util.List.of("High", "Critical"));

        mockMvc.perform(
                        post("/api/reports/tickets/workload-balance")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(om.writeValueAsBytes(query)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.members").isArray());
    }

    @Test
    @Transactional
    void testWorkloadBalanceMissingProjectIdReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/reports/tickets/workload-balance"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Transactional
    void testExportWorkloadBalanceCsv() throws Exception {
        mockMvc.perform(
                        get("/api/reports/tickets/workload-balance/export")
                                .param("projectId", "3"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(
                        content()
                                .string(
                                        org.hamcrest.Matchers.containsString(
                                                "member,open,closed,overdue,avg_age_days")));
    }
}
