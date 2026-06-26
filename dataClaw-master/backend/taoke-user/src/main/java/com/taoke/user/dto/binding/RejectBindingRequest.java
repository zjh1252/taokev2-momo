package com.taoke.user.dto.binding;

import lombok.Data;

/**
 * 拒绝绑定请求。
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:50
 */
@Data
public class RejectBindingRequest {
    private String reason;
}
