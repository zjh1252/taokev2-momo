package com.taoke.admin.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 后台专家详情视图。
 *
 * @author Fangxinxin
 * @date 2026-06-12 14:00
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AdminTrainerDetailVO extends AdminTrainerVO {

    private String email;
    private String trainerCode;
    private String teachingName;
    private Integer gender;
    private String intro;
    private String expertiseTags;

    /** 用户昵称 */
    private String nickname;

    /** 实名认证状态 */
    private Integer realNameCertStatus;

    /** 专业认证状态 */
    private Integer professionalCertStatus;

    /** 课程数 */
    private Integer courseCount;

    /** 案例数 */
    private Integer caseCount;

    /** 视频数 */
    private Integer videoCount;

    /** 著作数 */
    private Integer bookCount;

    /** 评价数（已通过） */
    private Integer reviewCount;

    /** 关联经纪人数量 */
    private Integer agentBindingCount;

    /** 关联机构数量 */
    private Integer institutionBindingCount;

    /** 业务角色列表 */
    private List<AdminUserRoleItem> roles;
}
