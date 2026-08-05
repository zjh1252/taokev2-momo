package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PxbLegacyOrderPage {

    private long total;
    private List<PxbLegacyOrderRow> orders;
}
