package com.taoke.common.contentcheck;

import lombok.Builder;
import lombok.Data;

import java.util.Collections;
import java.util.List;

/**
 * 内容审查结果
 *
 * @author Fangxinxin
 * @date 2026-04-13 11:00
 */
@Data
@Builder
public class ContentCheckResult {

    /** 是否通过 */
    private boolean passed;

    /** 策略名称 */
    private String strategyName;

    /** 提示信息 */
    private String message;

    /** 命中的敏感词列表（仅敏感词策略适用） */
    @Builder.Default
    private List<String> matchedWords = Collections.emptyList();

    public static ContentCheckResult pass() {
        return ContentCheckResult.builder().passed(true).build();
    }

    public static ContentCheckResult fail(String strategyName, String message) {
        return ContentCheckResult.builder()
                .passed(false)
                .strategyName(strategyName)
                .message(message)
                .build();
    }

    public static ContentCheckResult fail(String strategyName, String message, List<String> matchedWords) {
        return ContentCheckResult.builder()
                .passed(false)
                .strategyName(strategyName)
                .message(message)
                .matchedWords(matchedWords != null ? matchedWords : Collections.emptyList())
                .build();
    }
}
