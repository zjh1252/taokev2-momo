package com.taoke.common.exception;

import com.taoke.common.contentcheck.ContentCheckException;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.search.SearchException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * <p>
 * 捕获所有异常，统一转换为 ApiResponse + 对应的 HTTP 状态码。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 内容审查异常 — 返回结构化信息（含策略名 + 命中词），前端可按 code=100422 统一拦截
     */
    @ExceptionHandler(ContentCheckException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleContentCheck(ContentCheckException e) {
        ErrorCode ec = e.getErrorCode();
        log.warn("内容审查拦截: strategy={}, message={}", e.getStrategyName(), e.getMessage());
        Map<String, Object> detail = Map.of(
                "strategyName", e.getStrategyName(),
                "matchedWords", e.getMatchedWords()
        );
        return ResponseEntity
                .status(ec.getHttpStatus())
                .body(ApiResponse.error(ec.getCode(), e.getMessage(), detail));
    }

    /**
     * 搜索模块异常 — ES 连接/索引/搜索执行等失败
     */
    @ExceptionHandler(SearchException.class)
    public ResponseEntity<ApiResponse<Void>> handleSearchException(SearchException e) {
        ErrorCode ec = e.getErrorCode();
        log.warn("搜索异常: code={}, message={}", ec.getCode(), e.getMessage(), e);
        return ResponseEntity
                .status(ec.getHttpStatus())
                .body(ApiResponse.error(ec.getCode(), e.getMessage()));
    }

    /**
     * 业务异常 — 由 Service 层主动抛出
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        ErrorCode ec = e.getErrorCode();
        log.warn("业务异常: code={}, message={}", ec.getCode(), e.getMessage());
        return ResponseEntity
                .status(ec.getHttpStatus())
                .body(ApiResponse.error(ec.getCode(), e.getMessage()));
    }

    /**
     * @RequestBody 参数校验失败（@Valid + @NotBlank 等注解触发）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.warn("参数校验失败: {}", msg);
        return ResponseEntity
                .status(ErrorCode.PARAM_INVALID.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.PARAM_INVALID.getCode(), msg));
    }

    /**
     * @RequestParam / @PathVariable 约束校验失败
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException e) {
        String msg = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));
        log.warn("约束校验失败: {}", msg);
        return ResponseEntity
                .status(ErrorCode.PARAM_INVALID.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.PARAM_INVALID.getCode(), msg));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(MissingServletRequestParameterException e) {
        String msg = "缺少必填参数: " + e.getParameterName();
        log.warn(msg);
        return ResponseEntity
                .status(ErrorCode.PARAM_INVALID.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.PARAM_INVALID.getCode(), msg));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        String msg = "参数类型错误: " + e.getName();
        log.warn(msg);
        return ResponseEntity
                .status(ErrorCode.PARAM_INVALID.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.PARAM_INVALID.getCode(), msg));
    }

    /**
     * 资源不存在（Spring 6 的静态资源 404）
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResource(NoResourceFoundException e) {
        return ResponseEntity
                .status(ErrorCode.NOT_FOUND.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.NOT_FOUND));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMessageNotReadable(HttpMessageNotReadableException e) {
        log.warn("请求体解析失败: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.PARAM_INVALID.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.PARAM_INVALID.getCode(), "请求参数格式错误，请检查表单数据"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException e) {
        log.warn("数据约束冲突: {}", e.getMessage());
        return ResponseEntity
                .status(ErrorCode.PARAM_INVALID.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.PARAM_INVALID.getCode(), "数据保存失败，请检查填写内容后重试"));
    }

    /**
     * 兜底 — 未预料的异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAll(Exception e) {
        log.error("未处理异常: {}", e.getMessage(), e);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.getHttpStatus())
                .body(ApiResponse.error(ErrorCode.INTERNAL_ERROR));
    }

}
