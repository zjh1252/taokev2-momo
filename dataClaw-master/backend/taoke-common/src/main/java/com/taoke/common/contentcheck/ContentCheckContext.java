package com.taoke.common.contentcheck;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * 内容审查上下文
 * <p>
 * 封装一次内容检查所需的全部信息：HTTP 方法、请求路径、当前用户 ID，
 * 以及从请求体中提取的所有 String 字段（fieldName → fieldValue）。
 *
 * @author Fangxinxin
 * @date 2026-04-13 11:00
 */
@Data
@Builder
public class ContentCheckContext {

    /** HTTP 方法：POST / PUT */
    private String method;

    /** 请求路径 */
    private String uri;

    /** 当前用户 ID（未登录时为 null） */
    private Integer userId;

    /** 从请求体对象中提取的所有非空 String 字段 */
    private Map<String, String> fields;
}
