package com.taoke.admin.dto;

import com.taoke.user.dto.trainer.TrainerRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 后台运营代填专家入驻申请。
 *
 * @author Fangxinxin
 * @date 2026-06-27 12:00
 */
@Data
public class AdminCreateTrainerApplicationRequest {

    /** 已有用户 ID；与 phone/nickname 二选一 */
    private Integer userId;

    @Pattern(regexp = "^$|^1\\d{10}$", message = "请输入正确的手机号")
    private String phone;

    private String nickname;

    @NotNull(message = "专家资料不能为空")
    @Valid
    private TrainerRequest profile;

    /** 提交后是否自动审核通过，默认 true */
    private Boolean autoApprove = true;
}
