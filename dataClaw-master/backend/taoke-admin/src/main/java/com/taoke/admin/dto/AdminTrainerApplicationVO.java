package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台专家申请列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-02 10:00
 */
@Data
public class AdminTrainerApplicationVO {

    /** UserRole 记录 ID */
    private Integer id;

    /** 用户 ID */
    private Integer userId;

    /** 用户手机号 */
    private String phone;

    /** 用户昵称 */
    private String nickname;

    /** 专家姓名（来自 trainer 档案） */
    private String trainerName;

    /** 专家头衔 */
    private String trainerTitle;

    /** 专家头像 */
    private String trainerAvatar;

    /** 申请状态：1=生效，2=待审核，3=已驳回，4=已禁用 */
    private Integer status;

    /** 驳回原因 */
    private String rejectReason;

    /** 申请时间 */
    private LocalDateTime createdAt;

    /** 审核通过时间 */
    private LocalDateTime approvedAt;
}
