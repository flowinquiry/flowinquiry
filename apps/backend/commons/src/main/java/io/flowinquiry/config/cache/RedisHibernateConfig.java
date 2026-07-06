package io.flowinquiry.config.cache;

import java.util.Map;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.cache.spi.RegionFactory;
import org.hibernate.cfg.AvailableSettings;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.redisson.hibernate.RedissonRegionFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:cache/hibernate-redis.properties")
@EnableConfigurationProperties(RedisHibernateProps.class)
@ConditionalOnProperty(
        prefix = "flowinquiry.hibernate.second_level_cache",
        name = "provider",
        havingValue = "redis")
public class RedisHibernateConfig {

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer(
            RegionFactory regionFactory) {
        return hibernateProperties -> {
            hibernateProperties.put(AvailableSettings.USE_SECOND_LEVEL_CACHE, true);
            hibernateProperties.put(AvailableSettings.CACHE_REGION_FACTORY, regionFactory);
        };
    }

    @Bean
    public RegionFactory redisRegionFactory(RedissonClient redissonClient) {
        return new DynamicRedissonRegionFactory(redissonClient);
    }

    @Bean
    public RedissonClient redissonClient(RedisHibernateProps props) {
        Config config = new Config();
        config.useSingleServer()
                .setIdleConnectionTimeout(props.idleConnectionTimeout())
                .setConnectTimeout(props.connectTimeout())
                .setTimeout(props.timeout())
                .setRetryAttempts(props.retryAttempts())
                .setRetryInterval(props.retryInterval())
                .setPassword(props.password())
                .setSubscriptionsPerConnection(props.subscriptionsPerConnection())
                .setClientName(props.clientName())
                .setAddress(props.address())
                .setSubscriptionConnectionMinimumIdleSize(
                        props.subscriptionConnectionMinimumIdleSize())
                .setSubscriptionConnectionPoolSize(props.subscriptionConnectionPoolSize())
                .setConnectionMinimumIdleSize(props.connectionMinimumIdleSize())
                .setConnectionPoolSize(props.connectionPoolSize())
                .setDatabase(props.database())
                .setDnsMonitoringInterval(props.dnsMonitoringInterval());
        return Redisson.create(config);
    }

    public static class DynamicRedissonRegionFactory extends RedissonRegionFactory {

        private final RedissonClient redissonClient;

        public DynamicRedissonRegionFactory(RedissonClient redissonClient) {
            this.redissonClient = redissonClient;
        }

        @Override
        protected RedissonClient createRedissonClient(
                StandardServiceRegistry registry, Map properties) {
            return redissonClient;
        }
    }
}
