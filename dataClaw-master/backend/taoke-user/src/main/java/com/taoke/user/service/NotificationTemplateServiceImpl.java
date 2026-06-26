package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.NotificationTemplateService;
import com.taoke.user.dto.notification.NotificationTemplateVO;
import com.taoke.user.dto.notification.RenderedTemplate;
import com.taoke.user.entity.NotificationTemplate;
import com.taoke.user.repository.NotificationTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 通知模板管理服务实现。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
@Service
@RequiredArgsConstructor
public class NotificationTemplateServiceImpl implements NotificationTemplateService {

    private final NotificationTemplateRepository templateRepository;

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{(\\w+)}}");

    @Override
    public List<NotificationTemplateVO> list() {
        return templateRepository.findAll().stream().map(this::toVO).toList();
    }

    @Override
    public List<NotificationTemplateVO> listEnabled() {
        return templateRepository.findByEnabled(1).stream().map(this::toVO).toList();
    }

    @Override
    public NotificationTemplateVO getById(Integer id) {
        NotificationTemplate t = templateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "模板不存在"));
        return toVO(t);
    }

    @Override
    @Transactional
    public NotificationTemplateVO create(String code, String channel, String lang,
                                         String titleTemplate, String contentTemplate,
                                         Integer enabled, String remark) {
        if (templateRepository.existsByCode(code)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "模板编码已存在: " + code);
        }
        NotificationTemplate t = new NotificationTemplate();
        t.setCode(code);
        t.setChannel(channel != null ? channel : "in_app");
        t.setLang(lang != null ? lang : "zh-CN");
        t.setTitleTemplate(titleTemplate);
        t.setContentTemplate(contentTemplate);
        t.setEnabled(enabled != null ? enabled : 1);
        t.setRemark(remark);
        templateRepository.save(t);
        return toVO(t);
    }

    @Override
    @Transactional
    public NotificationTemplateVO update(Integer id, String code, String channel, String lang,
                                         String titleTemplate, String contentTemplate,
                                         Integer enabled, String remark) {
        NotificationTemplate t = templateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "模板不存在"));
        if (code != null && !code.equals(t.getCode()) && templateRepository.existsByCode(code)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "模板编码已存在: " + code);
        }
        if (code != null) t.setCode(code);
        if (channel != null) t.setChannel(channel);
        if (lang != null) t.setLang(lang);
        if (titleTemplate != null) t.setTitleTemplate(titleTemplate);
        if (contentTemplate != null) t.setContentTemplate(contentTemplate);
        if (enabled != null) t.setEnabled(enabled);
        if (remark != null) t.setRemark(remark);
        templateRepository.save(t);
        return toVO(t);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        if (!templateRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "模板不存在");
        }
        templateRepository.deleteById(id);
    }

    @Override
    public RenderedTemplate renderTemplate(String code, Map<String, String> variables) {
        NotificationTemplate t = templateRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "模板不存在: " + code));
        String title = replaceVariables(t.getTitleTemplate(), variables);
        String content = replaceVariables(t.getContentTemplate(), variables);
        return new RenderedTemplate(title, content);
    }

    /** 替换模板中的 {{变量}} 占位符 */
    private String replaceVariables(String template, Map<String, String> variables) {
        if (template == null || template.isEmpty() || variables == null || variables.isEmpty()) {
            return template;
        }
        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String key = matcher.group(1);
            String value = variables.getOrDefault(key, matcher.group(0));
            matcher.appendReplacement(sb, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private NotificationTemplateVO toVO(NotificationTemplate t) {
        NotificationTemplateVO vo = new NotificationTemplateVO();
        vo.setId(t.getId());
        vo.setCode(t.getCode());
        vo.setChannel(t.getChannel());
        vo.setLang(t.getLang());
        vo.setTitleTemplate(t.getTitleTemplate());
        vo.setContentTemplate(t.getContentTemplate());
        vo.setEnabled(t.getEnabled());
        vo.setRemark(t.getRemark());
        vo.setCreatedAt(t.getCreatedAt());
        vo.setUpdatedAt(t.getUpdatedAt());
        return vo;
    }
}
