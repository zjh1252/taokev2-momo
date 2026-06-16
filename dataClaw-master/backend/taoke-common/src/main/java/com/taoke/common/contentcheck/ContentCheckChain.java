package com.taoke.common.contentcheck;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

/**
 * 内容审查策略链
 * <p>
 * 自动收集所有 {@link ContentCheckStrategy} Bean，按 {@code getOrder()} 升序排列后依次执行。
 * 首个不通过的策略即抛出 {@link ContentCheckException}，终止后续策略。
 *
 * @author Fangxinxin
 * @date 2026-04-13 11:00
 */
@Slf4j
@Component
public class ContentCheckChain {

    private final List<ContentCheckStrategy> strategies;

    public ContentCheckChain(List<ContentCheckStrategy> strategies) {
        this.strategies = strategies.stream()
                .sorted(Comparator.comparingInt(ContentCheckStrategy::getOrder))
                .toList();
        log.info("内容审查策略链初始化完成，共 {} 个策略: {}", this.strategies.size(),
                this.strategies.stream().map(s -> s.getClass().getSimpleName()).toList());
    }

    /**
     * 执行内容审查
     *
     * @param context 检查上下文
     * @throws ContentCheckException 如果任一策略未通过
     */
    public void check(ContentCheckContext context) {
        if (strategies.isEmpty()) {
            return;
        }
        for (ContentCheckStrategy strategy : strategies) {
            ContentCheckResult result = strategy.check(context);
            if (!result.isPassed()) {
                log.warn("内容审查未通过: strategy={}, uri={}, message={}",
                        result.getStrategyName(), context.getUri(), result.getMessage());
                throw new ContentCheckException(result);
            }
        }
    }
}
