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
 * 底部链接项
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "footer_links")
public class FooterLink extends BaseEntity {

    @Column(name = "section_code", nullable = false, length = 30)
    private String sectionCode;

    @Column(name = "item_code", nullable = false, length = 50)
    private String itemCode;

    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @Column(name = "link_type", nullable = false, length = 20)
    private String linkType;

    @Column(name = "link_target", length = 500)
    private String linkTarget;

    @Column(name = "icon_key", length = 30)
    private String iconKey;

    @Column(name = "qr_image_url", length = 500)
    private String qrImageUrl;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "open_in_new_tab", nullable = false)
    private Boolean openInNewTab = false;
}
