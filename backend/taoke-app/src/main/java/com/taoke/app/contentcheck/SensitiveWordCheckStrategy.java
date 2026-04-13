package com.taoke.app.contentcheck;

import com.taoke.common.contentcheck.ContentCheckContext;
import com.taoke.common.contentcheck.ContentCheckResult;
import com.taoke.common.contentcheck.ContentCheckStrategy;
import com.taoke.common.service.SensitiveWordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 敏感词拦截策略
 * <p>
 * 遍历请求体中所有 String 字段，调用 DFA 敏感词服务检查。
 * 命中任一敏感词即返回失败结果。
 *
 * @author Fangxinxin
 * @date 2026-04-13 11:30
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SensitiveWordCheckStrategy implements ContentCheckStrategy {

    private final SensitiveWordService sensitiveWordService;

    @Override
    public int getOrder() {
        return 10;
    }

    @Override
    public ContentCheckResult check(ContentCheckContext context) {
        for (Map.Entry<String, String> entry : context.getFields().entrySet()) {
            String value = entry.getValue();
            if (value == null || value.isBlank()) {
                continue;
            }
            List<String> matched = sensitiveWordService.findAll(value);
            if (!matched.isEmpty()) {
                log.warn("敏感词命中: field={}, uri={}, matchedWords={}",
                        entry.getKey(), context.getUri(), matched);
                return ContentCheckResult.fail("sensitiveWord",
                        "内容包含敏感词: " + String.join(", ", matched), matched);
            }
        }
        return ContentCheckResult.pass();
    }
}
