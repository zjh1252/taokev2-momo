package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 培训宝 legacy search_course 录播课行（内部传输，非 HTTP 响应）。
 */
@Data
@Builder
public class PxbLegacyVideoRow {

    private Integer id;
    private String title;
    private BigDecimal price;
    private String teacherName;
    private String coverUrl;
    private String videoUrl;
    private Integer vType;
    private BigDecimal score;
    private Integer duration;
    private Integer categoryId;
    private String categoryName;
    private Integer totalEpisodes;
}
