package com.taoke.common.search;

import com.taoke.common.exception.ErrorCode;
import lombok.Getter;

/**
 * 搜索模块异常 — ES 连接失败、索引操作失败、搜索执行失败等场景统一抛出此异常。
 * <p>
 * 与业务异常 {@link com.taoke.common.exception.BusinessException} 区分，
 * 方便在全局异常处理器中做针对性处理（如 ES 不可用时降级返回空结果）。
 *
 * @author Fangxinxin
 * @date 2026-04-14 20:00
 */
@Getter
public class SearchException extends RuntimeException {

    private final ErrorCode errorCode;

    public SearchException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public SearchException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public SearchException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}
