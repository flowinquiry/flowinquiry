package io.flowinquiry.modules.teams.utils;

import io.flowinquiry.modules.teams.service.dto.report.Granularity;
import io.flowinquiry.modules.teams.service.dto.report.Period;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.UtilityClass;

@UtilityClass
public class PeriodHelper {

    private final WeekFields weekFields = WeekFields.ISO;

    public static Optional<Period> findPeriodForTicket(
          List<Period> periods, LocalDate ticketCompletionDate) {
        if (ticketCompletionDate == null) {
            return Optional.empty();
        }

        for (Period period : periods) {
            if (!ticketCompletionDate.isBefore(period.getStart())
                  && !ticketCompletionDate.isAfter(period.getEnd())) {
                return Optional.of(period);
            }
        }

        return Optional.empty();
    }

    public static List<Period> generatePeriods(
          LocalDate fromDate, LocalDate toDate, Granularity granularity) {
        List<Period> periods = new ArrayList<>();

        switch (granularity) {
            case WEEK:
                List<PeriodHelper.WeekPeriod> weekPeriods = generateWeekPeriods(fromDate, toDate);
                for (WeekPeriod wp : weekPeriods) {
                    periods.add(new Period(wp.getPeriodStart(), wp.getPeriodEnd(), wp.getPeriodLabel()));
                }
                break;

            case MONTH:
                LocalDate currentMonth = fromDate.withDayOfMonth(1);
                while (!currentMonth.isAfter(toDate)) {
                    LocalDate monthEnd = currentMonth.withDayOfMonth(currentMonth.lengthOfMonth());
                    LocalDate periodStart = currentMonth.isBefore(fromDate) ? fromDate : currentMonth;
                    LocalDate periodEnd = monthEnd.isAfter(toDate) ? toDate : monthEnd;
                    String label =
                          String.format("%s %d", currentMonth.getMonth().toString(), currentMonth.getYear());
                    periods.add(new Period(periodStart, periodEnd, label));
                    currentMonth = currentMonth.plusMonths(1);
                }
                break;

            case YEAR:
                int startYear = fromDate.getYear();
                int endYear = toDate.getYear();
                for (int year = startYear; year <= endYear; year++) {
                    LocalDate yearStart = LocalDate.of(year, 1, 1);
                    LocalDate yearEnd = LocalDate.of(year, 12, 31);
                    LocalDate periodStart = yearStart.isBefore(fromDate) ? fromDate : yearStart;
                    LocalDate periodEnd = yearEnd.isAfter(toDate) ? toDate : yearEnd;
                    periods.add(new Period(periodStart, periodEnd, String.valueOf(year)));
                }
                break;
        }

        return periods;
    }

    private static List<WeekPeriod> generateWeekPeriods(LocalDate fromDate, LocalDate toDate) {
        List<WeekPeriod> periods = new ArrayList<>();

        LocalDate weekStart =
              fromDate.with(TemporalAdjusters.previousOrSame(weekFields.getFirstDayOfWeek()));

        while (!weekStart.isAfter(toDate)) {
            LocalDate weekEnd = weekStart.plusDays(6);

            if (!weekEnd.isBefore(fromDate)) {
                LocalDate periodStart = weekStart.isBefore(fromDate) ? fromDate : weekStart;
                LocalDate periodEnd = weekEnd.isAfter(toDate) ? toDate : weekEnd;

                int weekOfYear = weekStart.get(weekFields.weekOfWeekBasedYear());
                int year = weekStart.get(weekFields.weekBasedYear());

                WeekPeriod period =
                      new WeekPeriod(
                            periodStart, periodEnd, weekOfYear, year, isPartialWeek(periodStart, periodEnd));

                periods.add(period);
            }

            weekStart = weekStart.plusWeeks(1);
        }

        return periods;
    }

    private boolean isPartialWeek(LocalDate start, LocalDate end) {
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        return days < 7;
    }
    
    @AllArgsConstructor
    @Getter
    @Setter
    @Builder
    public static class WeekPeriod {
        private final LocalDate periodStart;
        private final LocalDate periodEnd;
        private final int weekOfYear;
        private final int year;
        private final boolean isPartial;

        public String getPeriodLabel() {
            if (isPartial) {
                return String.format(
                      "Week %d, %d (Partial: %s to %s)", weekOfYear, year, periodStart, periodEnd);
            }
            return String.format("Week %d, %d", weekOfYear, year);
        }
    }
}
