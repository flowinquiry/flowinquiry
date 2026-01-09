package io.flowinquiry.modules.teams.utils;

import io.flowinquiry.modules.teams.service.dto.report.Granularity;
import io.flowinquiry.modules.teams.service.dto.report.Period;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PeriodHelperTest {

    @Test
    void givenNullTicketCompletionDate_whenFindPeriodForTicket_thenReturnEmptyOptional() {
        Period period = new Period(
              LocalDate.of(2024, 1, 1),
              LocalDate.of(2024, 1, 31),
              "JAN"
        );

        Optional<Period> result =
              PeriodHelper.findPeriodForTicket(List.of(period), null);

        assertTrue(result.isEmpty());
    }

    @Test
    void givenEmptyPeriodList_whenFindPeriodForTicket_thenReturnEmptyOptional() {
        Optional<Period> result =
              PeriodHelper.findPeriodForTicket(List.of(), LocalDate.of(2024, 1, 10));

        assertTrue(result.isEmpty());
    }

    @Test
    void givenTicketDateBeforeAllPeriods_whenFindPeriodForTicket_thenReturnEmptyOptional() {
        Period period = new Period(
              LocalDate.of(2024, 1, 10),
              LocalDate.of(2024, 1, 20),
              "MID JAN"
        );

        Optional<Period> result =
              PeriodHelper.findPeriodForTicket(
                    List.of(period),
                    LocalDate.of(2024, 1, 5)
              );

        assertTrue(result.isEmpty());
    }

    @Test
    void givenTicketDateWithinPeriod_whenFindPeriodForTicket_thenReturnMatchingPeriod() {
        // given
        Period period = new Period(
              LocalDate.of(2024, 1, 1),
              LocalDate.of(2024, 1, 31),
              "JAN 2024"
        );
        List<Period> periods = List.of(period);
        LocalDate ticketDate = LocalDate.of(2024, 1, 15);

        // when
        Optional<Period> result =
              PeriodHelper.findPeriodForTicket(periods, ticketDate);

        // then
        assertTrue(result.isPresent());
        assertEquals(period, result.get());
    }

    @Test
    void givenMultiplePeriodsAndTicketDateInSecondPeriod_whenFindPeriodForTicket_thenReturnSecondPeriod() {
        Period p1 = new Period(
              LocalDate.of(2024, 1, 1),
              LocalDate.of(2024, 1, 31),
              "JAN"
        );
        Period p2 = new Period(
              LocalDate.of(2024, 2, 1),
              LocalDate.of(2024, 2, 29),
              "FEB"
        );

        List<Period> periods = List.of(p1, p2);
        LocalDate ticketCompletionDate = LocalDate.of(2024, 2, 10);

        Optional<Period> result =
              PeriodHelper.findPeriodForTicket(periods, ticketCompletionDate);

        assertTrue(result.isPresent());
        assertEquals(p2, result.get());
    }

    @Test
    void givenDateRangeWithinSingleMonth_whenGeneratePeriods_thenReturnOnePeriodWithExactBounds() {
        LocalDate from = LocalDate.of(2024, 3, 5);
        LocalDate to = LocalDate.of(2024, 3, 20);

        List<Period> periods = PeriodHelper.generatePeriods(from, to, Granularity.MONTH);

        assertEquals(1, periods.size());

        Period period = periods.getFirst();
        assertEquals(from, period.getStart());
        assertEquals(to, period.getEnd());
        assertEquals("MARCH 2024", period.getLabel());
    }

    @Test
    void givenDateRangeAcrossMultipleMonths_whenGeneratePeriodsWithMonthGranularity_thenSplitIntoMonthlyPeriodsBaseOnGranularityWithTrimmedEdges() {
        LocalDate from = LocalDate.of(2024, 1, 15);
        LocalDate to = LocalDate.of(2024, 3, 10);

        List<Period> periods = PeriodHelper.generatePeriods(from, to, Granularity.MONTH);

        assertEquals(3, periods.size());

        assertEquals(LocalDate.of(2024, 1, 15), periods.get(0).getStart());
        assertEquals(LocalDate.of(2024, 1, 31), periods.get(0).getEnd());

        assertEquals(LocalDate.of(2024, 2, 1), periods.get(1).getStart());
        assertEquals(LocalDate.of(2024, 2, 29), periods.get(1).getEnd());

        assertEquals(LocalDate.of(2024, 3, 1), periods.get(2).getStart());
        assertEquals(LocalDate.of(2024, 3, 10), periods.get(2).getEnd());
    }

    @Test
    void givenDateRangeAcrossMultipleYears_whenGeneratePeriodsWithYearGranularity_thenSplitIntoYearlyPeriodsBaseOnGranularityWithTrimmedEdges() {
        LocalDate from = LocalDate.of(2022, 6, 1);
        LocalDate to = LocalDate.of(2024, 3, 15);

        List<Period> periods = PeriodHelper.generatePeriods(from, to, Granularity.YEAR);

        assertEquals(3, periods.size());

        assertEquals(LocalDate.of(2022, 6, 1), periods.get(0).getStart());
        assertEquals(LocalDate.of(2022, 12, 31), periods.get(0).getEnd());

        assertEquals(LocalDate.of(2023, 1, 1), periods.get(1).getStart());
        assertEquals(LocalDate.of(2023, 12, 31), periods.get(1).getEnd());

        assertEquals(LocalDate.of(2024, 1, 1), periods.get(2).getStart());
        assertEquals(LocalDate.of(2024, 3, 15), periods.get(2).getEnd());
    }

    @Test
    void givenDateRangeWithinMonth_whenGeneratePeriodsWithWeekGranularity_thenReturnCorrectWeeklyPeriodsBaseOnGranularityWithTrimmedBounds() {
        // given
        LocalDate from = LocalDate.of(2024, 1, 3); // Wednesday
        LocalDate to = LocalDate.of(2024, 1, 21); // Sunday

        // when
        List<Period> periods = PeriodHelper.generatePeriods(from, to, Granularity.WEEK);

        // then
        assertEquals(3, periods.size());

        // Week 1: Wed -> Sun
        assertEquals(LocalDate.of(2024, 1, 3), periods.get(0).getStart());
        assertEquals(LocalDate.of(2024, 1, 7), periods.get(0).getEnd());

        // Week 2: Mon -> Sun
        assertEquals(LocalDate.of(2024, 1, 8), periods.get(1).getStart());
        assertEquals(LocalDate.of(2024, 1, 14), periods.get(1).getEnd());

        // Week 3: Mon -> Sun (trimmed to 'to')
        assertEquals(LocalDate.of(2024, 1, 15), periods.get(2).getStart());
        assertEquals(LocalDate.of(2024, 1, 21), periods.get(2).getEnd());
    }
}
