package io.flowinquiry.modules.teams.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.Test;

public class ProjectIterationNameGeneratorTest {
    @Test
    public void testGetNextIterationWithValidData() {
        // Given
        String currentIterationName1 = "Sprint 1";
        String currentIterationName2 = "Iteration 2024-W20";
        String currentIterationName3 = "Sprint";
        String currentIterationName4 = "Sprin1t";
        String currentIterationName5 = "Sprint9";

        // When
        String nextIterationName1 =
                ProjectIterationNameGenerator.getNextIteration(currentIterationName1);
        String nextIterationName2 =
                ProjectIterationNameGenerator.getNextIteration(currentIterationName2);
        String nextIterationName3 =
                ProjectIterationNameGenerator.getNextIteration(currentIterationName3);
        String nextIterationName4 =
                ProjectIterationNameGenerator.getNextIteration(currentIterationName4);
        String nextIterationName5 =
                ProjectIterationNameGenerator.getNextIteration(currentIterationName5);

        // Then
        assertEquals("Sprint 2", nextIterationName1);
        assertEquals("Iteration 2024-W21", nextIterationName2);
        assertEquals("Sprint 1", nextIterationName3);
        assertEquals("Sprin1t 1", nextIterationName4);
        assertEquals("Sprint10", nextIterationName5);
    }
}
