package io.flowinquiry.modules.teams.service;

import static io.flowinquiry.query.QueryUtils.createSpecification;
import static java.util.Objects.nonNull;

import io.flowinquiry.modules.teams.domain.Ticket;
import io.flowinquiry.modules.teams.repository.TicketRepository;
import io.flowinquiry.modules.teams.service.dto.TicketAgeingBucketDTO;
import io.flowinquiry.modules.teams.service.dto.TicketGroupDTO;
import io.flowinquiry.modules.teams.service.dto.TicketQueryParams;
import io.flowinquiry.modules.teams.service.mapper.TicketMapper;
import io.flowinquiry.query.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportsService {

    private final TicketRepository ticketRepository;

    private final TicketMapper ticketMapper;

    @Transactional(readOnly = true)
    public List<TicketAgeingBucketDTO> getAgeingTicketsReport(TicketQueryParams queryParams) {

        Specification<Ticket> ticketsSpecification =
                getTicketsForAgeingReport(
                        queryParams.getProjectId(),
                        queryParams.getIterationId(),
                        queryParams.getStatus(),
                        queryParams.getPriority(),
                        queryParams.getAssignUserId(),
                        queryParams.getCreatedFrom(),
                        queryParams.getCreatedTo(),
                        queryParams.isIncludeClosed());
        List<Ticket> ticketList = ticketRepository.findAll(ticketsSpecification);
        List<Map<String, List<Ticket>>> groupTickets =
                groupTickets(putTicketsIntoBuckets(ticketList), queryParams.getGroupBy());

        return mapBucketsToDTO(
                List.of("0-2days", "3-5days", "6-10days", "11-20days", "21-30days", "31moredays"),
                groupTickets);
    }

    private Map<String, List<Ticket>> groupBucketItemsByAssignee(List<Ticket> bucket) {
        HashMap<String, List<Ticket>> map = new HashMap<>();
        bucket.forEach(
                item -> {
                    List<Ticket> tickets =
                            map.getOrDefault(
                                    "" + item.getAssignUser().getId(), new ArrayList<Ticket>());
                    tickets.add(item);
                    map.put("" + item.getAssignUser().getId(), tickets);
                });
        return map;
    }

    private Map<String, List<Ticket>> groupBucketItemsByStatus(List<Ticket> bucket) {
        HashMap<String, List<Ticket>> map = new HashMap<>();
        bucket.forEach(
                item -> {
                    List<Ticket> tickets =
                            map.getOrDefault(
                                    item.getCurrentState().getStateName(), new ArrayList<Ticket>());
                    tickets.add(item);
                    map.put(item.getCurrentState().getStateName(), tickets);
                });
        return map;
    }

    private Map<String, List<Ticket>> groupBucketItemsByPriority(List<Ticket> bucket) {
        HashMap<String, List<Ticket>> map = new HashMap<>();
        bucket.forEach(
                item -> {
                    List<Ticket> tickets =
                            map.getOrDefault(
                                    item.getPriority().toString(), new ArrayList<Ticket>());
                    tickets.add(item);
                    map.put(item.getPriority().toString(), tickets);
                });
        return map;
    }

    private List<Map<String, List<Ticket>>> groupTickets(
            List<List<Ticket>> listOfBuckets, String groupByField) {
        List<Map<String, List<Ticket>>> mapList = new ArrayList<>();
        switch (groupByField) {
            case "assignee":
                listOfBuckets.forEach(
                        item -> {
                            mapList.add(groupBucketItemsByAssignee(item));
                        });
                break;
            case "status":
                listOfBuckets.forEach(
                        item -> {
                            mapList.add(groupBucketItemsByStatus(item));
                        });
                break;
            case "priority":
                listOfBuckets.forEach(
                        item -> {
                            mapList.add(groupBucketItemsByPriority(item));
                        });
        }
        return mapList;
    }

    private Specification<Ticket> getTicketsForAgeingReport(
            String projectId,
            String iterationId,
            List<String> status,
            List<String> priorityList,
            List<String> assigneeIdList,
            LocalDate createdFrom,
            LocalDate createdTo,
            boolean includeClosed) {
        List<Filter> filters = new ArrayList<>();
        filters.add(new Filter("project.id", FilterOperator.EQ, projectId));

        if (nonNull(iterationId)) {
            filters.add(new Filter("iteration.id", FilterOperator.EQ, iterationId));
        }
        if (nonNull(status) && !status.isEmpty()) {
            filters.add(new Filter("currentState.stateName", FilterOperator.IN, status));
        }
        if (nonNull(priorityList) && !priorityList.isEmpty()) {

            filters.add(new Filter("priority", FilterOperator.IN, priorityList));
        }
        if (nonNull(assigneeIdList) && !assigneeIdList.isEmpty()) {
            filters.add(new Filter("assignUser.id", FilterOperator.IN, assigneeIdList));
        }
        if (nonNull(createdFrom)) {
            filters.add(
                    new Filter(
                            "createdAt",
                            FilterOperator.GTE,
                            createdFrom.atTime(LocalTime.MIN).atZone(ZoneOffset.UTC).toInstant()));
        }
        if (nonNull(createdTo)) {
            filters.add(
                    new Filter(
                            "createdAt",
                            FilterOperator.LTE,
                            createdTo.atTime(LocalTime.MIN).atZone(ZoneOffset.UTC).toInstant()));
        }
        if (!includeClosed) filters.add(new Filter("isCompleted", FilterOperator.EQ, false));

        QueryDTO queryDTO = new QueryDTO();
        GroupFilter filter = new GroupFilter();
        filter.setLogicalOperator(LogicalOperator.AND);
        filter.setFilters(filters);
        queryDTO.setGroups(List.of(filter));
        return createSpecification(queryDTO);
    }

    private List<List<Ticket>> putTicketsIntoBuckets(List<Ticket> ticketList) {
        List<Ticket> bucket0to2 = new ArrayList<>();
        List<Ticket> bucket3to5 = new ArrayList<>();
        List<Ticket> bucket6to10 = new ArrayList<>();
        List<Ticket> bucket11to20 = new ArrayList<>();
        List<Ticket> bucket21to30 = new ArrayList<>();
        List<Ticket> bucket31more = new ArrayList<>();

        ticketList.forEach(
                ticket -> {
                    long age = 0;
                    if (ticket.getIsCompleted())
                        age =
                                ChronoUnit.DAYS.between(
                                        ticket.getCreatedAt(),
                                        ticket.getActualCompletionDate()
                                                .atTime(LocalTime.MAX)
                                                .toInstant(ZoneOffset.UTC));
                    else age = ChronoUnit.DAYS.between(ticket.getCreatedAt(), Instant.now());
                    if (age >= 0 && age <= 2) bucket0to2.add(ticket);
                    else if (age > 2 && age <= 5) bucket3to5.add(ticket);
                    else if (age > 5 && age <= 10) bucket6to10.add(ticket);
                    else if (age > 10 && age <= 20) bucket11to20.add(ticket);
                    else if (age > 20 && age <= 30) bucket21to30.add(ticket);
                    else bucket31more.add(ticket);
                });
        return List.of(
                bucket0to2, bucket3to5, bucket6to10, bucket11to20, bucket21to30, bucket31more);
    }

    private List<TicketAgeingBucketDTO> mapBucketsToDTO(
            List<String> labels, List<Map<String, List<Ticket>>> groupTickets) {
        List<TicketAgeingBucketDTO> dto = new ArrayList<>();
        int i = 0;
        for (Map<String, List<Ticket>> item : groupTickets) {
            TicketAgeingBucketDTO dto2 = new TicketAgeingBucketDTO();
            List<TicketGroupDTO> groupDTOS = new ArrayList<>();
            dto2.setBucketLabel(labels.get(i++));
            for (String key : item.keySet()) {
                groupDTOS.add(
                        new TicketGroupDTO(
                                key, item.get(key).stream().map(ticketMapper::toDto).toList()));
            }
            dto2.setGroupedTickets(groupDTOS);
            dto.add(dto2);
        }
        return dto;
    }
}
