package com.taoke.common.contentcheck;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import lombok.Getter;

import java.util.Collections;
import java.util.List;

/**
 * 内容审查异常
 * <p>
 * 继承 {@link BusinessException}，携带策略名称和命中敏感词列表，
 * 前端可根据 {@code code = 100422} 统一拦截并展示友好提示。
 *
 * @author Fangxinxin
 * @date 2026-04-13 11:00
 */
@Getter
public class ContentCheckException extends BusinessException {

    /** 触发拦截的策略名称 */
    private final String strategyName;

    /** 命中的敏感词列表 */
    private final List<String> matchedWords;

    public ContentCheckException(String strategyName, String message, List<String> matchedWords) {
        super(ErrorCode.CONTENT_CHECK_FAILED, message);
        this.strategyName = strategyName;
        this.matchedWords = matchedWords != null ? matchedWords : Collections.emptyList();
    }

    public ContentCheckException(ContentCheckResult result) {
        this(result.getStrategyName(), result.getMessage(), result.getMatchedWords());
    }
}
