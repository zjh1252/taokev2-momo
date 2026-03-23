package com.taoke.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.taoke.common.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一 API 响应封装
 * <p>
 * 所有接口统一返回此结构：{ code, message, data }
 * <ul>
 *   <li>code: 业务状态码，0 表示成功，非 0 表示具体错误</li>
 *   <li>message: 提示信息</li>
 *   <li>data: 业务数据，错误时为 null</li>
 * </ul>
 * HTTP 状态码由 GlobalExceptionHandler 通过 ResponseEntity 控制，
 * 本类只负责 body 部分。
 *
 * @param <T> 业务数据类型
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private int code;
    private String message;
    private T data;

    /* ==================== 成功 ==================== */

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(0, "success", data);
    }

    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(0, "success", null);
    }

    /* ==================== 失败 ==================== */

    public static ApiResponse<Void> error(ErrorCode errorCode) {
        return new ApiResponse<>(errorCode.getCode(), errorCode.getMessage(), null);
    }

    public static ApiResponse<Void> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    public static ApiResponse<Void> error(ErrorCode errorCode, String message) {
        return new ApiResponse<>(errorCode.getCode(), message, null);
    }

}
