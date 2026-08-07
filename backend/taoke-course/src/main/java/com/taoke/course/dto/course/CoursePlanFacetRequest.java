package com.taoke.course.dto.course;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CoursePlanFacetRequest {
    private String courseType = "OPEN_OFFLINE";
    private Integer categoryId;
    private Integer subCategoryId;
    private Integer isFree;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer provinceId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime planStartFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime planStartTo;
}
