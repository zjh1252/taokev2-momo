package com.taoke.user.dto.trainer;

import lombok.Data;

/**
 * 专家「荣誉与资质」文件条目。
 *
 * @author Fangxinxin
 * @date 2026-06-02 10:30
 */
@Data
public class TrainerHonorFileItem {

    /** 文件名（含扩展名，用于展示） */
    private String name;

    /** 文件可访问 URL（图片或 PDF） */
    private String url;
}
