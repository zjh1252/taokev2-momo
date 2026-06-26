package com.taoke.common.ai;

/**
 * 通用 AI 对话服务（OpenAI 兼容协议）。
 *
 * <p>所有需要调用 LLM 的业务统一注入此接口，避免重复实现。
 * 实现需要根据配置 {@link com.taoke.common.config.AiProperties} 决定是否启用，
 * 在未启用时统一抛出业务异常，由调用方负责降级处理。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-29 20:00
 */
public interface AiChatService {

    /**
     * 普通文本对话，返回模型生成的纯文本。
     *
     * @param systemPrompt 系统提示词（角色 / 输出约束）
     * @param userPrompt   用户输入
     * @return 模型回复内容
     */
    String chat(String systemPrompt, String userPrompt);

    /**
     * 强制要求模型返回 JSON，并自动反序列化到指定类型。
     *
     * <p>实现会请求 {@code response_format=json_object}（兼容服务支持时），
     * 并对 markdown 代码块包裹做兜底剥离（``` json fence）；解析失败会重试一次。</p>
     *
     * @param systemPrompt 系统提示词
     * @param userPrompt   用户输入
     * @param type         反序列化目标类型
     * @return 反序列化后的对象
     */
    <T> T chatJson(String systemPrompt, String userPrompt, Class<T> type);

    /**
     * 当前是否可用（{@code enabled=true && api-key 非空}）。
     *
     * @return true 可用
     */
    boolean isAvailable();
}
