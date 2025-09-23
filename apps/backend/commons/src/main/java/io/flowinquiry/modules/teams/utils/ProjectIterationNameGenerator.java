package io.flowinquiry.modules.teams.utils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ProjectIterationNameGenerator {

    public static String getNextIteration(String currentIteration) {
        int iterationCount = 0;
        Pattern regex = Pattern.compile("^\\D+(\\d+)$");
        Matcher matcher = regex.matcher(currentIteration);
        if (matcher.matches()) {

            String currentIterationCount = matcher.group(1);
            iterationCount = Integer.parseInt(currentIterationCount) + 1;
            return currentIteration.replaceFirst("\\d+$", "" + iterationCount);
        }
        iterationCount++;
        return String.format("%s %d", currentIteration, iterationCount);
    }
}
