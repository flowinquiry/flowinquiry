package io.flowinquiry.query;

import static io.flowinquiry.query.QueryUtils.createSpecification;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Selection;
import jakarta.persistence.metamodel.ManagedType;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generic reporting engine that executes any GROUP BY + aggregation query described by an {@link
 * AggregationQuery} without requiring a new {@code @Query} per report.
 *
 * <p>It delegates WHERE-clause building to the existing {@link QueryUtils#createSpecification}
 * infrastructure, then builds SELECT + GROUP BY + ORDER BY via the JPA Criteria API.
 *
 * <h3>Supported field notation</h3>
 *
 * <ul>
 *   <li>Direct field: {@code "channel"}, {@code "priority"}, {@code "isCompleted"}
 *   <li>Single join: {@code "assignUser.firstName"}, {@code "team.name"}
 * </ul>
 *
 * <h3>Usage example – channel distribution</h3>
 *
 * <pre>{@code
 * AggregationQuery q = new AggregationQuery();
 * q.setEntity("Ticket");
 * q.setGroupByFields(List.of("channel"));
 * q.setAggregations(List.of(new AggregationField("id", COUNT, "ticketCount")));
 * q.setFilters(filtersQueryDto);
 * q.setSorts(List.of(new SortField("ticketCount", SortDirection.DESC)));
 * List<AggregationResult> results = reportEngine.aggregate(q);
 * }</pre>
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class ReportEngine {

    @PersistenceContext private EntityManager em;

    /** Used to serialize enum dimension values via their Jackson {@code @JsonSerialize} config. */
    private final ObjectMapper objectMapper;

    @Autowired
    public ReportEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Resolves a JPA entity class by simple name, scanning all managed types in the persistence
     * context.
     */
    private Class<?> resolveEntityClass(String simpleEntityName) {
        return em.getMetamodel().getManagedTypes().stream()
                .map(ManagedType::getJavaType)
                .filter(c -> c.getSimpleName().equals(simpleEntityName))
                .findFirst()
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Unknown JPA entity: " + simpleEntityName));
    }

    /**
     * Resolves a possibly dot-notated field path to a JPA Criteria {@link Expression}. Supports one
     * level of join: {@code "join.field"}.
     */
    private <X> Expression<?> resolvePath(Root<X> root, String fieldPath) {
        if (fieldPath.contains(".")) {
            String[] parts = fieldPath.split("\\.", 2);
            return root.join(parts[0], jakarta.persistence.criteria.JoinType.LEFT).get(parts[1]);
        }
        return root.get(fieldPath);
    }

    /** Builds a Criteria {@link Expression} for a single {@link AggregationField}. */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private <X> Expression<? extends Number> buildAggExpression(
            CriteriaBuilder cb, Root<X> root, AggregationField agg) {
        Expression path = resolvePath(root, agg.getField());
        return switch (agg.getFunction()) {
            case COUNT -> cb.count(path);
            case SUM -> cb.sum(path);
            case AVG -> cb.avg(path);
            case MIN -> (Expression<? extends Number>) cb.min(path);
            case MAX -> (Expression<? extends Number>) cb.max(path);
        };
    }

    /**
     * Converts a dimension value to a JSON-friendly string.
     *
     * <p>For enums annotated with {@code @JsonSerialize} (e.g. {@code TicketChannel}), this uses
     * Jackson to produce the display name (e.g. {@code "web_portal"} instead of {@code
     * "WEB_PORTAL"}). For other types, falls back to {@code toString()}.
     */
    private String serializeDimensionValue(Object val) {
        if (val == null) return null;
        if (val.getClass().isEnum()) {
            try {
                // Jackson serializes the enum via its @JsonSerialize annotation,
                // e.g. TicketChannel.WEB_PORTAL → "web_portal"
                String json = objectMapper.writeValueAsString(val);
                // Strip surrounding quotes that Jackson adds for string values
                return json.replaceAll("^\"|\"$", "");
            } catch (Exception e) {
                log.warn(
                        "ReportEngine: failed to serialize enum {}, falling back to name()",
                        val,
                        e);
            }
        }
        return val.toString();
    }

    /**
     * Executes the {@link AggregationQuery} and returns a list of {@link AggregationResult} rows.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<AggregationResult> aggregate(AggregationQuery query) {
        Class<?> entityClass = resolveEntityClass(query.getEntity());

        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Tuple> cq = cb.createTupleQuery();
        Root root = cq.from(entityClass);

        // ── WHERE ────────────────────────────────────────────────────────────
        if (query.getFilters() != null) {
            Specification spec = createSpecification(query.getFilters());
            if (spec != null) {
                Predicate where = spec.toPredicate(root, cq, cb);
                if (where != null) {
                    cq.where(where);
                }
            }
        }

        // ── SELECT + GROUP BY ─────────────────────────────────────────────────
        List<Selection<?>> selections = new ArrayList<>();
        List<Expression<?>> groupByExprs = new ArrayList<>();

        // Track positional index of each alias in the tuple
        Map<String, Integer> dimensionIndex = new HashMap<>();
        Map<String, Integer> metricIndex = new HashMap<>();
        int idx = 0;

        for (String field : query.getGroupByFields()) {
            Expression<?> expr = resolvePath(root, field);
            selections.add(expr.alias(field));
            groupByExprs.add(expr);
            dimensionIndex.put(field, idx++);
        }

        for (AggregationField agg : query.getAggregations()) {
            Expression<? extends Number> aggExpr = buildAggExpression(cb, root, agg);
            selections.add(aggExpr.alias(agg.getAlias()));
            metricIndex.put(agg.getAlias(), idx++);
        }

        cq.multiselect(selections);
        cq.groupBy(groupByExprs);

        // ── ORDER BY ──────────────────────────────────────────────────────────
        if (query.getSorts() != null && !query.getSorts().isEmpty()) {
            Map<String, Integer> allAliases = new HashMap<>();
            allAliases.putAll(dimensionIndex);
            allAliases.putAll(metricIndex);

            List<Order> orders = new ArrayList<>();
            for (SortField sort : query.getSorts()) {
                Integer pos = allAliases.get(sort.getField());
                if (pos == null) {
                    log.warn("ReportEngine: unknown sort field '{}', skipping", sort.getField());
                    continue;
                }
                Expression<?> sortExpr = (Expression<?>) selections.get(pos);
                orders.add(
                        sort.getDirection() == SortDirection.ASC
                                ? cb.asc(sortExpr)
                                : cb.desc(sortExpr));
            }
            if (!orders.isEmpty()) {
                cq.orderBy(orders);
            }
        }

        // ── EXECUTE + MAP ─────────────────────────────────────────────────────
        List<Tuple> tuples = em.createQuery(cq).getResultList();
        List<AggregationResult> results = new ArrayList<>(tuples.size());

        for (Tuple tuple : tuples) {
            AggregationResult row = new AggregationResult();

            for (Map.Entry<String, Integer> e : dimensionIndex.entrySet()) {
                Object val = tuple.get(e.getValue());
                // Enums are serialized via Jackson so display names are used (e.g. "web_portal")
                row.addDimension(e.getKey(), serializeDimensionValue(val));
            }

            for (Map.Entry<String, Integer> e : metricIndex.entrySet()) {
                Number val = (Number) tuple.get(e.getValue());
                row.addMetric(e.getKey(), val != null ? val : 0L);
            }

            results.add(row);
        }

        return results;
    }
}
