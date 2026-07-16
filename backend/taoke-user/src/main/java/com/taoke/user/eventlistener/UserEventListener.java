package com.taoke.user.eventlistener;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.enums.NotificationType;
import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.events.user.AgentWorkCertificationAuditedEvent;
import com.taoke.common.events.user.ApplyPassedEvent;
import com.taoke.common.events.user.ApplyRejectedEvent;
import com.taoke.common.events.user.EnterpriseAgentCertificationAuditedEvent;
import com.taoke.common.events.user.InstitutionCompanyInfoAuditedEvent;
import com.taoke.common.events.user.NewUserRegisteredEvent;
import com.taoke.common.events.user.TrainerCertificationAuditedEvent;
import com.taoke.user.api.NotificationService;
import com.taoke.user.repository.InstitutionRepository;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.support.PublicTrainerListCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * 用户模块事件消费者 — 处理用户相关领域事件。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventListener {

    private final TrainerRepository trainerRepository;
    private final InstitutionRepository institutionRepository;
    private final NotificationService notificationService;
    private final PublicTrainerListCache publicTrainerListCache;

    /**
     * 角色入驻审核通过 — 同步更新业务主表状态、发送站内信。
     */
    @DomainEventListener
    @Transactional
    public void onApplyPassed(ApplyPassedEvent event) {
        Integer userId = Integer.valueOf(event.getAggregateId());
        String role = event.getRole();
        log.info("收到角色审核通过事件: userId={}, role={}, eventId={}",
                userId, role, event.getEventId());

        if (BusinessRole.Code.TRAINER.equals(role)) {
            trainerRepository.findByUserId(userId).ifPresent(trainer -> {
                trainer.setStatus(2);
                trainer.setApprovedAt(LocalDateTime.now());
                if (trainer.getTrainerCode() == null) {
                    trainer.setTrainerCode(generateUniqueTrainerCode());
                }
                trainerRepository.save(trainer);
                publicTrainerListCache.evictPublicListCaches();
                log.info("专家档案状态已更新为审核通过: trainerId={}, trainerCode={}, userId={}",
                        trainer.getId(), trainer.getTrainerCode(), userId);
            });
        } else if (BusinessRole.Code.INSTITUTION.equals(role)) {
            institutionRepository.findByUserId(userId).ifPresent(inst -> {
                inst.setStatus(1);
                institutionRepository.save(inst);
                log.info("机构档案状态已更新为已发布: institutionId={}, userId={}", inst.getId(), userId);
            });
        }

        String roleName = getRoleName(role);
        notificationService.send(userId, NotificationType.APPLY_RESULT,
                roleName + "入驻申请已通过",
                "恭喜！您的" + roleName + "入驻申请已审核通过，相关功能已开放。",
                String.valueOf(userId), null);
    }

    /**
     * 新用户注册 — 发送欢迎站内通知。
     */
    @DomainEventListener
    public void onNewUserRegistered(NewUserRegisteredEvent event) {
        Integer userId = Integer.valueOf(event.getAggregateId());
        log.info("收到新用户注册事件: userId={}, phone={}, eventId={}",
                userId, event.getPhone(), event.getEventId());

        notificationService.send(userId, NotificationType.WELCOME,
                "欢迎加入淘课网！",
                "恭喜您注册成为淘课网的一员！在这里，您可以浏览海量培训课程、发现优质专家资源、"
                        + "发布培训需求。您还可以在「修改身份」中申请成为专家、经纪人、机构等角色，解锁更多功能。祝您使用愉快！",
                null, "/dashboard");
    }

    /**
     * 角色入驻审核驳回 — 更新业务主表状态、发送站内信。
     */
    @DomainEventListener
    @Transactional
    public void onApplyRejected(ApplyRejectedEvent event) {
        Integer userId = Integer.valueOf(event.getAggregateId());
        String role = event.getRole();
        String reason = event.getReason();
        log.info("收到角色审核驳回事件: userId={}, role={}, reason={}, eventId={}",
                userId, role, reason, event.getEventId());

        if (BusinessRole.Code.TRAINER.equals(role)) {
            trainerRepository.findByUserId(userId).ifPresent(trainer -> {
                trainer.setStatus(3);
                trainer.setRejectReason(reason);
                trainerRepository.save(trainer);
                publicTrainerListCache.evictPublicListCaches();
                log.info("专家档案状态已更新为驳回: trainerId={}, userId={}", trainer.getId(), userId);
            });
        } else if (BusinessRole.Code.INSTITUTION.equals(role)) {
            institutionRepository.findByUserId(userId).ifPresent(inst -> {
                inst.setStatus(0);
                institutionRepository.save(inst);
                log.info("机构档案状态已更新为待审核: institutionId={}, userId={}", inst.getId(), userId);
            });
        }

        String roleName = getRoleName(role);
        notificationService.send(userId, NotificationType.APPLY_RESULT,
                roleName + "入驻申请未通过",
                "很遗憾，您的" + roleName + "入驻申请未通过审核。原因：" + reason + "。您可以修改资料后重新提交。",
                String.valueOf(userId), null);
    }

    /**
     * 专家资质认证审核结果 — 发送站内信给专家。
     * <p>
     * 维度文案：实名认证 / 专业认证 / 学历认证 / 工作认证；
     * 通过则提示「已通过」，驳回则附带原因；点击跳转专家用户中心相应认证页面。
     */
    @DomainEventListener
    public void onTrainerCertificationAudited(TrainerCertificationAuditedEvent event) {
        Integer userId = event.getTrainerUserId();
        String dimensionLabel = certDimensionLabel(event.getDimension());
        String routeUrl = certDimensionRoute(event.getDimension());

        log.info("收到专家资质认证审核事件: userId={}, dimension={}, approved={}, recordId={}, eventId={}",
                userId, event.getDimension(), event.isApproved(), event.getRecordId(), event.getEventId());

        String title;
        String content;
        if (event.isApproved()) {
            title = dimensionLabel + "已通过";
            String summary = (event.getSummary() == null || event.getSummary().isBlank())
                    ? "" : "（" + event.getSummary() + "）";
            content = "您提交的" + dimensionLabel + summary + "已审核通过。";
        } else {
            title = dimensionLabel + "未通过";
            String summary = (event.getSummary() == null || event.getSummary().isBlank())
                    ? "" : "（" + event.getSummary() + "）";
            String reason = event.getRejectReason() == null ? "" : event.getRejectReason();
            content = "您提交的" + dimensionLabel + summary + "未通过审核。原因：" + reason + "。您可以修改后重新提交。";
        }

        notificationService.send(userId, NotificationType.APPLY_RESULT,
                title, content,
                event.getRecordId() == null ? null : String.valueOf(event.getRecordId()),
                routeUrl);
    }

    private String certDimensionLabel(String dim) {
        if (TrainerCertificationAuditedEvent.Dimension.REAL_NAME.equals(dim)) return "实名认证";
        if (TrainerCertificationAuditedEvent.Dimension.PROFESSIONAL.equals(dim)) return "专业认证";
        if (TrainerCertificationAuditedEvent.Dimension.EDUCATION.equals(dim)) return "学历认证";
        if (TrainerCertificationAuditedEvent.Dimension.WORK.equals(dim)) return "工作认证";
        return "资质认证";
    }

    private String certDimensionRoute(String dim) {
        if (TrainerCertificationAuditedEvent.Dimension.REAL_NAME.equals(dim)) return "/dashboard/account/certification/real-name";
        if (TrainerCertificationAuditedEvent.Dimension.PROFESSIONAL.equals(dim)) return "/dashboard/account/certification/professional";
        if (TrainerCertificationAuditedEvent.Dimension.EDUCATION.equals(dim)) return "/dashboard/account/certification/education";
        if (TrainerCertificationAuditedEvent.Dimension.WORK.equals(dim)) return "/dashboard/account/certification/work";
        return "/dashboard";
    }

    /** 经纪人工作认证审核结果 → 站内信。 */
    @DomainEventListener
    public void onAgentWorkCertificationAudited(AgentWorkCertificationAuditedEvent event) {
        sendCertificationNotice(
                event.getAgentUserId(),
                "工作认证",
                event.getSummary(),
                event.getRejectReason(),
                event.isApproved(),
                event.getRecordId(),
                "/dashboard/account/certification/agent/work");
    }

    /** 经纪公司资质认证审核结果 → 站内信。 */
    @DomainEventListener
    public void onEnterpriseAgentCertificationAudited(EnterpriseAgentCertificationAuditedEvent event) {
        sendCertificationNotice(
                event.getEnterpriseAgentUserId(),
                "资质认证",
                event.getSummary(),
                event.getRejectReason(),
                event.isApproved(),
                event.getEnterpriseAgentId(),
                "/dashboard/account/certification/agency/qualification");
    }

    /** 培训机构「公司资料」审核结果 → 站内信。 */
    @DomainEventListener
    public void onInstitutionCompanyInfoAudited(InstitutionCompanyInfoAuditedEvent event) {
        sendCertificationNotice(
                event.getInstitutionUserId(),
                "公司资料",
                event.getSummary(),
                event.getRejectReason(),
                event.isApproved(),
                event.getInstitutionId(),
                "/dashboard/account/certification/institution/company-info");
    }

    /**
     * 通用认证审核站内信发送。
     *
     * @param userId       目标用户 ID
     * @param dimensionLabel 维度文案（实名认证 / 工作认证 等）
     * @param summary      业务摘要（公司名 / 单位名）
     * @param rejectReason 驳回原因
     * @param approved     是否通过
     * @param recordId     业务记录 ID
     * @param routeUrl     站内信跳转路径
     */
    private void sendCertificationNotice(Integer userId, String dimensionLabel, String summary,
                                         String rejectReason, boolean approved, Integer recordId, String routeUrl) {
        if (userId == null) return;
        String summaryText = (summary == null || summary.isBlank()) ? "" : "（" + summary + "）";
        String title;
        String content;
        if (approved) {
            title = dimensionLabel + "已通过";
            content = "您提交的" + dimensionLabel + summaryText + "已审核通过。";
        } else {
            title = dimensionLabel + "未通过";
            String reason = rejectReason == null ? "" : rejectReason;
            content = "您提交的" + dimensionLabel + summaryText + "未通过审核。原因：" + reason + "。您可以修改后重新提交。";
        }
        notificationService.send(userId, NotificationType.APPLY_RESULT,
                title, content,
                recordId == null ? null : String.valueOf(recordId),
                routeUrl);
    }

    private String getRoleName(String roleCode) {
        try {
            return BusinessRole.valueOf(roleCode).getLabel();
        } catch (IllegalArgumentException e) {
            return roleCode;
        }
    }

    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    /** 生成唯一专家编号 TK-{6位大写字母数字}，重复则重试 */
    private String generateUniqueTrainerCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder("TK-");
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!trainerRepository.existsByTrainerCode(code)) {
                return code;
            }
        }
        throw new RuntimeException("无法生成唯一的专家编号，请重试");
    }
}
