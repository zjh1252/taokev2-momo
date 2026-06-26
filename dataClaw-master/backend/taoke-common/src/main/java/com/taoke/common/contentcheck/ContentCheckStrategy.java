package com.taoke.common.contentcheck;

/**
 * 内容审查策略接口
 * <p>
 * 通过策略模式实现可插拔的内容检查。每个实现负责一种检查维度（敏感词、内容审核、频率限制等），
 * 由 {@link ContentCheckChain} 按 {@link #getOrder()} 顺序编排执行。
 *
 * @author Fangxinxin
 * @date 2026-04-13 11:00
 */
public interface ContentCheckStrategy {

    /**
     * 执行顺序，数值越小越先执行
     */
    int getOrder();

    /**
     * 执行内容检查
     *
     * @param context 检查上下文（含待检查字段、请求信息等）
     * @return 检查结果
     */
    ContentCheckResult check(ContentCheckContext context);
}
