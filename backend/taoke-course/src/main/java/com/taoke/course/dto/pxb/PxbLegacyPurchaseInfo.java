package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户对录播课的购买/有效期信息（供 legacy buystatus 计算）。
 */
@Data
@Builder
public class PxbLegacyPurchaseInfo {

    private Integer videoId;
    private LocalDateTime enrolledAt;
    private LocalDateTime expiredAt;
    /** 1=有效 0=已取消/退款 */
    private Integer status;
}
