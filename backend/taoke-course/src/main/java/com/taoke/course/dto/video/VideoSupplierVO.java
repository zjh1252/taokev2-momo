package com.taoke.course.dto.video;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 录播课供应商视图对象
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class VideoSupplierVO {

    private Integer id;

    private Integer userId;

    private String userName;

    private String companyName;

    private String memberType;

    private Boolean enabled;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
