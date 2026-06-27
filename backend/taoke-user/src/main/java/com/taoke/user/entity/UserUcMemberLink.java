package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 淘课用户与 UC 成员（p_stu_id）关联。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "user_uc_member_links")
public class UserUcMemberLink extends BaseEntity {

    @Column(name = "org_link_id", nullable = false)
    private Integer orgLinkId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "identity_value", nullable = false, length = 128)
    private String identityValue;

    @Column(name = "p_stu_id")
    private Integer pStuId;

    @Column(name = "profile_json", columnDefinition = "json")
    private String profileJson;

    @Column(name = "sync_status", nullable = false, columnDefinition = "tinyint")
    private Integer syncStatus = 0;

    @Column(name = "binding_ref_type", length = 32)
    private String bindingRefType;

    @Column(name = "binding_ref_id")
    private Integer bindingRefId;
}
