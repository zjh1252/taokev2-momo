package com.taoke.common.search;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * ES 文档基类 — 所有业务文档的公共字段。
 * <p>
 * 使用单索引 + {@code docType} 区分不同实体类型（课程、专家等），
 * {@code docId} 作为 ES 文档唯一标识，格式 {@code "{docType}_{id}"}。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Data
public abstract class BaseDocument {

    /**
     * ES 文档唯一 ID，格式: "{docType}_{id}"
     */
    private String docId;

    /**
     * 文档类型标识，如 "course"、"trainer"
     */
    private String docType;

    /**
     * 业务主键
     */
    private Integer id;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * 根据 docType 和 id 生成 docId
     */
    public String buildDocId() {
        this.docId = docType + "_" + id;
        return this.docId;
    }
}
