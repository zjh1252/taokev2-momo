package com.taoke.course.entity.cms;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.persistence.EntityListeners;

import java.time.LocalDateTime;

/**
 * 底部全局配置（单行 id=1）
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@EntityListeners(AuditingEntityListener.class)
@Table(name = "footer_config")
public class FooterConfig {

    @Id
    private Integer id = 1;

    @Column(name = "brand_tagline", nullable = false, length = 200)
    private String brandTagline;

    @Column(name = "company_intro", columnDefinition = "TEXT")
    private String companyIntro;

    @Column(name = "phone", nullable = false, length = 50)
    private String phone;

    @Column(name = "main_qr_image_url", length = 500)
    private String mainQrImageUrl;

    @Column(name = "copyright_text", nullable = false, length = 500)
    private String copyrightText;

    @Column(name = "company_copyright_text", nullable = false, length = 200)
    private String companyCopyrightText;

    @Column(name = "company_copyright_url", length = 500)
    private String companyCopyrightUrl;

    @Column(name = "icp_text", nullable = false, length = 200)
    private String icpText;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
