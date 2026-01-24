package io.flowinquiry.query;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.FluentQuery;

import java.util.function.Function;

import static org.springframework.data.domain.ScrollPosition.offset;

public interface SliceSpecificationExecutor<T> extends JpaSpecificationExecutor<T> {
    default Window<T> findAllWindowed(
          Specification<T> spec, Sort sort, int limit, ScrollPosition scrollPosition) {
        return this.findBy(spec, toWindow(sort, limit, scrollPosition));
    }

    default Window<T> findAllWindowed(
          Specification<T> spec, Sort sort, ScrollPosition scrollPosition) {
        return this.findBy(spec, toWindow(sort, scrollPosition));
    }

    default Window<T> findAllWindowed(Specification<T> spec, ScrollPosition scrollPosition) {
        return this.findAllWindowed(spec, Sort.unsorted(), scrollPosition);
    }

    default Slice<T> findAllSliced(Specification<T> spec, Pageable pageable) {
        final var window =
              pageable.isUnpaged()
                    ? this.findAllWindowed(spec, pageable.getSort(), offset())
                    : this.findAllWindowed(
                    spec,
                    pageable.getSort(),
                    pageable.getPageSize(),
                    this.getInclusiveStartingOffset(pageable));
        return new SliceImpl<>(window.getContent(), pageable, window.hasNext());
    }

    private ScrollPosition getInclusiveStartingOffset(Pageable pageable) {
        return pageable.getOffset() == 0 ? offset() : offset(pageable.getOffset() - 1);
    }

    private static <T> Function<FluentQuery.FetchableFluentQuery<T>, Window<T>> toWindow(
          Sort sort, int limit, ScrollPosition scrollPosition) {
        return fetchableFluentQuery ->
              fetchableFluentQuery.sortBy(sort).limit(limit).scroll(scrollPosition);
    }

    private static <T> Function<FluentQuery.FetchableFluentQuery<T>, Window<T>> toWindow(
          Sort sort, ScrollPosition scrollPosition) {
        return fetchableFluentQuery -> fetchableFluentQuery.sortBy(sort).scroll(scrollPosition);
    }
}
