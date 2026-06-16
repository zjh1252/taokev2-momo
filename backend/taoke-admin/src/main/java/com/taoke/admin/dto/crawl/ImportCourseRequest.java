package com.taoke.admin.dto.crawl;

import lombok.Data;

/**
 * 导入课程请求体（管理员指定分类映射和关联讲师）
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class ImportCourseRequest {

    /** 映射后的一级分类 ID */
    private Integer categoryId;

    /** 映射后的二级分类 ID */
    private Integer subCategoryId;

    /** 关联的讲师 ID（0 表示暂不关联） */
    private Integer trainerId;

    /** 修改后的标题（可选） */
    private String title;

    /** 是否忽略去重警告，强制导入 */
    private boolean forceImport;
}
