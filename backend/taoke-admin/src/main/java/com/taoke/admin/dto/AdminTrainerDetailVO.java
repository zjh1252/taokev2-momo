package com.taoke.admin.dto;

import com.taoke.user.dto.trainer.CategoryRefDTO;
import com.taoke.user.dto.trainer.TrainerHonorDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
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

    // ==================== 基本信息扩展 ====================

    private String resumeUrl;
    private String idCardNo;
    private Integer provinceId;
    private Integer cityId;
    private String provinceName;
    private String cityName;

    // ==================== 专业信息扩展 ====================

    private String bio;
    private String oneLineIntro;
    private String background;
    private String partialClients;
    private String goodAt;
    private String specialties;
    private String teachingStyle;
    private Integer experienceYears;
    private Integer teachingYears;
    private BigDecimal quoteMin;
    private BigDecimal quoteMax;
    private String quoteUnit;
    private String quoteRemark;
    private BigDecimal taokePrice;
    private BigDecimal taokeCommission;

    private List<TrainerHonorDTO> honors;
    private List<CategoryRefDTO> expertiseCategories;
    private List<CategoryRefDTO> industryCategories;
    private List<AdminTrainerBookItemVO> books;

    // ==================== 维护人（绑定关系） ====================

    private List<AdminTrainerMaintainerVO> maintainers;

    // ==================== 资源信息 ====================

    private List<AdminTrainerResourceItemVO> courses;
    private List<AdminTrainerResourceItemVO> cases;
    private List<AdminTrainerResourceItemVO> videos;
    private List<AdminTrainerResourceItemVO> highlights;
}
