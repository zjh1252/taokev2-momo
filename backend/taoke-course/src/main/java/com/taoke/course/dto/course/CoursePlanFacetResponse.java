package com.taoke.course.dto.course;

import java.util.List;

public record CoursePlanFacetResponse(List<Bucket> provinces, List<Bucket> cities) {
    public record Bucket(Integer id, long count) {
    }
}
