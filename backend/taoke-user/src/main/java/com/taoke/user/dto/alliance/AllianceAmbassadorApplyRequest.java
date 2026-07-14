package com.taoke.user.dto.alliance;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 推广大使申请请求。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Data
public class AllianceAmbassadorApplyRequest {

    @NotNull(message = "请确认是否同意协议")
    private Boolean agreementSigned;

    @Size(max = 32, message = "协议版本不超过32个字符")
    private String agreementVersion;
}
