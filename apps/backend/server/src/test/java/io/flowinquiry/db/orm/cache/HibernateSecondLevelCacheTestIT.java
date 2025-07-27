package io.flowinquiry.db.orm.cache;

import static org.junit.jupiter.api.Assertions.assertEquals;

import io.flowinquiry.it.IntegrationTest;
import io.flowinquiry.modules.teams.domain.Team;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

@IntegrationTest
@TestPropertySource(
        properties = "spring.jpa.properties.hibernate.cache.use_second_level_cache=true")
public class HibernateSecondLevelCacheTestIT {

    @Autowired SessionFactory sessionFactory;

    @Test
    public void multipleSessionCache() {

        try (Session sessionOne = sessionFactory.openSession();
                Session sessionTwo = sessionFactory.openSession()) {

            final long entityId = 1L;
            sessionFactory.getStatistics().setStatisticsEnabled(true);

            sessionOne.get(Team.class, entityId);
            long hitCountOne = sessionFactory.getStatistics().getSecondLevelCacheHitCount();
            long missCountOne = sessionFactory.getStatistics().getSecondLevelCacheMissCount();
            assertEquals(0, hitCountOne);
            assertEquals(1, missCountOne);

            sessionTwo.get(Team.class, entityId);
            long hitCountTwo = sessionFactory.getStatistics().getSecondLevelCacheHitCount();
            long missCountTwo = sessionFactory.getStatistics().getSecondLevelCacheMissCount();
            assertEquals(2, hitCountTwo);
            assertEquals(1, missCountTwo);
        }
    }
}
