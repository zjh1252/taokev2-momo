package com.taoke.user.dto.buyer;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 学员档案返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class BuyerProfileResponse {

    private Integer id;
    private String occupation;
    private String learningTags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
