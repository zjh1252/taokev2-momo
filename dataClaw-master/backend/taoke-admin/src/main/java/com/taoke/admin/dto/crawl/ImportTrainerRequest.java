package com.taoke.admin.dto.crawl;

import lombok.Data;

/**
 * 导入专家请求体（管理员可选编辑部分字段后再导入）
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class ImportTrainerRequest {

    /** 修改后的姓名（可选） */
    private String name;

    /** 修改后的头衔（可选） */
    private String title;

    /** 修改后的简介（可选） */
    private String bio;

    /** 是否忽略去重警告，强制导入 */
    private boolean forceImport;
}
