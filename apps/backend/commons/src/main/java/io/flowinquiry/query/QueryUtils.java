package io.flowinquiry.query;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.domain.Specification;

public class QueryUtils {

    public static <Entity> Specification<Entity> createSpecification(Optional<QueryDTO> queryDTO) {
        return queryDTO.map(
                        dto ->
                                (Specification<Entity>)
                                        (root, query, cb) -> {
                                            if (dto.getGroups() != null) {
                                                // Process group-based queries
                                                List<Predicate> groupPredicates =
                                                        dto.getGroups().stream()
                                                                .map(
                                                                        group ->
                                                                                createGroupPredicate(
                                                                                        group, root,
                                                                                        cb))
                                                                .toList();
                                                return cb.and(
                                                        groupPredicates.toArray(new Predicate[0]));
                                            } else if (dto.getFilters() != null) {
                                                // Backward compatibility: process simple filters
                                                List<Predicate> predicates =
                                                        dto.getFilters().stream()
                                                                .map(
                                                                        filter ->
                                                                                createPredicate(
                                                                                        filter,
                                                                                        root, cb))
                                                                .toList();
                                                return cb.and(predicates.toArray(new Predicate[0]));
                                            }
                                            return cb.conjunction(); // Return a no-op predicate
                                        })
                .orElse(null); // Return null if queryDTO is not present
    }

    private static <Entity> Predicate createGroupPredicate(
            GroupFilter groupFilter, Root<Entity> root, CriteriaBuilder cb) {

        List<Predicate> predicates = new ArrayList<>();

        // Process simple filters
        if (groupFilter.getFilters() != null) {
            predicates.addAll(
                    groupFilter.getFilters().stream()
                            .map(filter -> createPredicate(filter, root, cb))
                            .toList());
        }

        // Process nested groups
        if (groupFilter.getGroups() != null) {
            predicates.addAll(
                    groupFilter.getGroups().stream()
                            .map(nestedGroup -> createGroupPredicate(nestedGroup, root, cb))
                            .toList());
        }

        // Combine predicates based on the logical operator
        if (groupFilter.getLogicalOperator() == null) {
            throw new IllegalArgumentException("Logical operator cannot be null");
        }

        return switch (groupFilter.getLogicalOperator()) {
            case AND -> cb.and(predicates.toArray(new Predicate[0]));
            case OR -> cb.or(predicates.toArray(new Predicate[0]));
            default ->
                    throw new IllegalArgumentException(
                            "Invalid logical operator: " + groupFilter.getLogicalOperator());
        };
    }

    private static <Entity> Predicate createPredicate(
            Filter filter, Root<Entity> root, CriteriaBuilder cb) {

        String field = filter.getField();
        Object value = filter.getValue();

        // Check for multiple fields to concatenate (e.g., "firstName,lastName" or "field1,field2")
        if (field.contains(",")) {
            String likePattern = "%" + value.toString().toLowerCase() + "%";
            String[] fields = field.split(",");

            // Concatenate specified fields with spaces between them
            Expression<String> concatenatedFields = cb.lower(root.get(fields[0]));

            for (int i = 1; i < fields.length; i++) {
                concatenatedFields =
                        cb.concat(
                                concatenatedFields, cb.concat(" ", cb.lower(root.get(fields[i]))));
            }

            // Apply the like condition to the concatenated fields
            return cb.like(concatenatedFields, likePattern);
        }

        // Check if the field requires a join
        if (field.contains(".")) {
            // Split the field by dot notation to get the join entity and target field
            String[] pathParts = field.split("\\.");
            String joinEntity = pathParts[0];
            String targetField = pathParts[1];

            // Perform the join dynamically - use INNER JOIN to exclude nulls
            Join<Object, Object> join = root.join(joinEntity, JoinType.INNER);

            // Create the predicate based on the operator
            switch (filter.getOperator()) {
                case GT:
                    return cb.greaterThan(join.get(targetField), (Comparable) value);
                case LT:
                    return cb.lessThan(join.get(targetField), (Comparable) value);
                case EQ:
                    if (value == null) {
                        return cb.isNull(join.get(targetField));
                    } else {
                        // Handle enum types for join fields
                        Class<?> fieldType = join.get(targetField).getJavaType();
                        if (fieldType.isEnum() && value instanceof String) {
                            try {
                                @SuppressWarnings({"unchecked", "rawtypes"})
                                Object enumValue =
                                        Enum.valueOf((Class<Enum>) fieldType, (String) value);
                                return cb.equal(join.get(targetField), enumValue);
                            } catch (IllegalArgumentException e) {
                                // Invalid enum value provided
                                return cb.disjunction(); // Always false
                            }
                        }

                        return cb.equal(join.get(targetField), value);
                    }
                case NE:
                    if (value == null) {
                        return cb.isNotNull(join.get(targetField));
                    } else {
                        // Handle enum types for join fields
                        Class<?> fieldType = join.get(targetField).getJavaType();
                        if (fieldType.isEnum() && value instanceof String) {
                            try {
                                @SuppressWarnings({"unchecked", "rawtypes"})
                                Object enumValue =
                                        Enum.valueOf((Class<Enum>) fieldType, (String) value);
                                return cb.notEqual(join.get(targetField), enumValue);
                            } catch (IllegalArgumentException e) {
                                // Invalid enum value provided
                                return cb.conjunction(); // Always true
                            }
                        }

                        return cb.notEqual(join.get(targetField), value);
                    }
                case LK:
                    return cb.like(join.get(targetField), "%" + value + "%");
                case IN:
                    return join.get(targetField).in((List<?>) value);
                default:
                    throw new IllegalArgumentException("Invalid operator: " + filter.getOperator());
            }
        } else {
            // No join needed, access the field directly from the root
            Path<?> path = root.get(field);
            Class<?> fieldType = path.getJavaType();

            Object typedValue = convertValueIfNeeded(value, root.get(field).getJavaType());

            switch (filter.getOperator()) {
                case GT:
                    return cb.greaterThan(root.get(field), (Comparable) typedValue);
                case LT:
                    return cb.lessThan(root.get(field), (Comparable) typedValue);
                case EQ:
                    // Handle null values and type conversions for direct fields
                    if (value == null) {
                        return cb.isNull(path);
                    } else {
                        // Handle special type conversions
                        if (fieldType.equals(Boolean.class) && value instanceof String) {
                            value = Boolean.parseBoolean((String) value);
                        } else if (fieldType.isEnum() && value instanceof String) {
                            try {
                                @SuppressWarnings({"unchecked", "rawtypes"})
                                Object enumValue =
                                        Enum.valueOf((Class<Enum>) fieldType, (String) value);
                                value = enumValue;
                            } catch (IllegalArgumentException e) {
                                // Invalid enum value provided
                                return cb.disjunction(); // Always false
                            }
                        }
                        return cb.equal(path, value);
                    }
                case NE:
                    // Handle null values and type conversions for direct fields
                    if (value == null) {
                        return cb.isNotNull(path);
                    } else {
                        // Handle special type conversions
                        if (fieldType.equals(Boolean.class) && value instanceof String) {
                            value = Boolean.parseBoolean((String) value);
                        } else if (fieldType.isEnum() && value instanceof String) {
                            try {
                                @SuppressWarnings({"unchecked", "rawtypes"})
                                Object enumValue =
                                        Enum.valueOf((Class<Enum>) fieldType, (String) value);
                                value = enumValue;
                            } catch (IllegalArgumentException e) {
                                // Invalid enum value provided
                                return cb.conjunction(); // Always true
                            }
                        }
                        return cb.notEqual(path, value);
                    }
                case LK:
                    return cb.like(
                            cb.lower(root.get(field)), "%" + value.toString().toLowerCase() + "%");
                case IN:
                    // Handle enum type for IN operator
                    if (fieldType.isEnum() && value instanceof List<?>) {
                        List<?> valueList = (List<?>) value;
                        List<Object> enumValues = new ArrayList<>();
                        for (Object item : valueList) {
                            if (item instanceof String) {
                                try {
                                    @SuppressWarnings({"unchecked", "rawtypes"})
                                    Object enumValue =
                                            Enum.valueOf((Class<Enum>) fieldType, (String) item);
                                    enumValues.add(enumValue);
                                } catch (IllegalArgumentException e) {
                                    // Skip invalid enum values
                                }
                            }
                        }
                        if (enumValues.isEmpty()) {
                            return cb.disjunction(); // Always false if no valid enum values
                        }
                        return path.in(enumValues);
                    }
                    return path.in((List<?>) value);
                default:
                    throw new IllegalArgumentException("Invalid operator: " + filter.getOperator());
            }
        }
    }

    private static Object convertValueIfNeeded(Object value, Class<?> targetType) {
        if (value == null || targetType.isInstance(value)) {
            return value;
        }

        if (value instanceof String) {
            String stringValue = (String) value;

            if (targetType.equals(Instant.class)) {
                return Instant.parse(stringValue);
            } else if (targetType.equals(LocalDate.class)) {
                return LocalDate.parse(stringValue);
            } else if (targetType.equals(Long.class)) {
                return Long.valueOf(stringValue);
            } else if (targetType.equals(Integer.class)) {
                return Integer.valueOf(stringValue);
            } else if (targetType.equals(Boolean.class)) {
                return Boolean.valueOf(stringValue);
            } else if (targetType.equals(Double.class)) {
                return Double.valueOf(stringValue);
            }
            // fallback
            return stringValue;
        }

        throw new IllegalArgumentException(
                "Unsupported conversion from " + value.getClass() + " to " + targetType);
    }
}
