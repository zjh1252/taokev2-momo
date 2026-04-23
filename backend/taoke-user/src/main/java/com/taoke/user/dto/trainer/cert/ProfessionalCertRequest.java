package com.taoke.user.dto.trainer.cert;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 专业认证提交请求 — 上传多个证书附件 URL。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class ProfessionalCertRequest {

    @NotEmpty(message = "请至少上传一份专业认证附件")
    private List<@Size(max = 500, message = "附件 URL 不超过500个字符") String> files;
}
