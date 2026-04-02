package com.taoke.user.api;

import com.taoke.user.dto.notification.NotificationTemplateVO;
import com.taoke.user.dto.notification.RenderedTemplate;

import java.util.List;
import java.util.Map;

/**
 * 通知模板管理能力接口。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
public interface NotificationTemplateService {

    /** 获取全部模板 */
    List<NotificationTemplateVO> list();

    /** 获取仅启用的模板 */
    List<NotificationTemplateVO> listEnabled();

    /** 根据 ID 获取模板 */
    NotificationTemplateVO getById(Integer id);

    /** 创建模板 */
    NotificationTemplateVO create(String code, String channel, String lang,
                                  String titleTemplate, String contentTemplate,
                                  Integer enabled, String remark);

    /** 更新模板 */
    NotificationTemplateVO update(Integer id, String code, String channel, String lang,
                                  String titleTemplate, String contentTemplate,
                                  Integer enabled, String remark);

    /** 删除模板 */
    void delete(Integer id);

    /**
     * 渲染模板 — 替换 {{变量}} 占位符
     *
     * @param code      模板编码
     * @param variables 变量键值对
     * @return 渲染后的 title + content
     */
    RenderedTemplate renderTemplate(String code, Map<String, String> variables);
}
