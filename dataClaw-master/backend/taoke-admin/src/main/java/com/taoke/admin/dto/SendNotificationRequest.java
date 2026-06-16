package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 发送通知请求体 — 支持全员/按角色/指定用户三种发送模式。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
@Data
public class SendNotificationRequest {

    /** 发送目标类型：ALL / ROLE / USERS */
    @NotNull(message = "发送目标类型不能为空")
    private TargetType targetType;

    /** 角色编码列表（targetType=ROLE 时必填） */
    private List<String> roleCodes;

    /** 用户 ID 列表（targetType=USERS 时必填） */
    private List<Integer> userIds;

    /** 通知标题（与 templateCode 二选一） */
    private String title;

    /** 通知内容（与 templateCode 二选一） */
    private String content;

    /** 模板编码（可选，与 title/content 二选一） */
    private String templateCode;

    /** 模板变量（templateCode 非空时使用） */
    private Map<String, String> templateVariables;

    /** 通知类型，默认 SYSTEM */
    private String type;

    /** 点击跳转路径（可选） */
    private String relatedUrl;

    public enum TargetType {
        ALL, ROLE, USERS
    }
}
