package com.taoke.common.contentcheck;

import com.taoke.common.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

import java.lang.reflect.Field;
import java.lang.reflect.Type;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 全局内容审查拦截器
 * <p>
 * 基于 Spring 的 {@link org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdvice}，
 * 在 {@code @RequestBody} 反序列化完成后、进入 Controller 方法之前，自动提取对象中的所有
 * String 字段值，交给 {@link ContentCheckChain} 执行策略检查。
 * <p>
 * {@code afterBodyRead()} 接收的是已反序列化的 Java 对象引用（非原始 InputStream），
 * 仅读取字段值、不修改对象、原样返回，不影响请求流。
 * <p>
 * 跳过规则：
 * <ul>
 *   <li>仅拦截 POST / PUT 请求</li>
 *   <li>跳过 {@code /admin/} 开头的请求路径</li>
 *   <li>跳过标注了 {@link SkipContentCheck} 的 Controller 类或方法</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-13 11:00
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class ContentCheckRequestBodyAdvice extends RequestBodyAdviceAdapter {

    private final ContentCheckChain chain;

    @Override
    public boolean supports(MethodParameter methodParameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        // 方法或类上标注了 @SkipContentCheck 则跳过
        if (methodParameter.hasMethodAnnotation(SkipContentCheck.class)) {
            return false;
        }
        if (methodParameter.getContainingClass().isAnnotationPresent(SkipContentCheck.class)) {
            return false;
        }

        HttpServletRequest request = getHttpServletRequest();
        if (request == null) {
            return false;
        }

        // 仅拦截 POST / PUT
        String method = request.getMethod();
        if (!"POST".equalsIgnoreCase(method) && !"PUT".equalsIgnoreCase(method)) {
            return false;
        }

        // 跳过不需要内容审查的路径
        String uri = request.getRequestURI();
        if (uri.startsWith("/admin/") || uri.startsWith("/auth/")) {
            return false;
        }
        return true;
    }

    @Override
    public Object afterBodyRead(Object body, HttpInputMessage inputMessage,
                                MethodParameter parameter, Type targetType,
                                Class<? extends HttpMessageConverter<?>> converterType) {
        if (body == null) {
            return null;
        }

        Map<String, String> fields = extractStringFields(body);
        if (fields.isEmpty()) {
            return body;
        }

        HttpServletRequest request = getHttpServletRequest();
        String method = request != null ? request.getMethod() : "UNKNOWN";
        String uri = request != null ? request.getRequestURI() : "UNKNOWN";

        ContentCheckContext context = ContentCheckContext.builder()
                .method(method)
                .uri(uri)
                .userId(SecurityUtils.getCurrentUserId())
                .fields(fields)
                .build();

        chain.check(context);

        return body;
    }

    /**
     * 通过反射提取对象中所有非空 String 字段
     */
    private Map<String, String> extractStringFields(Object obj) {
        Map<String, String> result = new LinkedHashMap<>();
        if (obj == null) {
            return result;
        }

        Class<?> clazz = obj.getClass();
        while (clazz != null && clazz != Object.class) {
            for (Field field : clazz.getDeclaredFields()) {
                if (field.getType() != String.class) {
                    continue;
                }
                try {
                    field.setAccessible(true);
                    Object value = field.get(obj);
                    if (value instanceof String str && !str.isBlank()) {
                        result.put(field.getName(), str);
                    }
                } catch (IllegalAccessException e) {
                    log.debug("内容审查: 无法读取字段 {}.{}", clazz.getSimpleName(), field.getName());
                }
            }
            clazz = clazz.getSuperclass();
        }
        return result;
    }

    private HttpServletRequest getHttpServletRequest() {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest() : null;
    }
}
