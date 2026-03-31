package com.taoke.common.exception;

import lombok.Getter;

/**
 * 业务异常
 * <p>
 * 在 Service 层抛出，由 GlobalExceptionHandler 统一捕获并返回标准 ApiResponse。
 * 用法示例：
 * <pre>
 *   throw new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND);
 *   throw new BusinessException(ErrorCode.PARAM_INVALID, "手机号不能为空");
 * </pre>
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

}
