package com.taoke.course.entity.cms;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 静态页面
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "static_pages")
public class StaticPage extends BaseEntity {

    @Column(name = "page_code", nullable = false, length = 50)
    private String pageCode;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "published", nullable = false)
    private Boolean published = true;

    @Column(name = "version", nullable = false)
    private Integer version = 1;
}
