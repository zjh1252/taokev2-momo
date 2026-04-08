package com.taoke.course.service.interaction;

import com.taoke.course.dto.interaction.SubmitTrainerMessageRequest;
import com.taoke.course.entity.interaction.TrainerLeadMessage;
import com.taoke.course.enums.InteractionTargetType;
import com.taoke.course.enums.LeadMessageStatus;
import com.taoke.course.repository.interaction.TrainerLeadMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 专家留言业务实现
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Service
@RequiredArgsConstructor
public class TrainerMessageServiceImpl {

    private final TrainerLeadMessageRepository messageRepository;
    private final InteractionTargetValidator targetValidator;

    @Transactional
    public Integer submitMessage(Integer userId, SubmitTrainerMessageRequest req) {
        // 校验专家存在
        targetValidator.validateTargetExists(InteractionTargetType.TRAINER, req.getTrainerUserId());

        TrainerLeadMessage msg = new TrainerLeadMessage();
        msg.setTrainerUserId(req.getTrainerUserId());
        msg.setTrainingTopic(req.getTrainingTopic());
        msg.setTrainingGoal(req.getTrainingGoal());
        msg.setContactName(req.getContactName());
        msg.setContactMobile(req.getContactMobile());
        msg.setCompanyName(req.getCompanyName());
        msg.setCompanyPhone(req.getCompanyPhone());
        msg.setProvinceId(req.getProvinceId());
        msg.setCityId(req.getCityId());
        msg.setTrainingDays(req.getTrainingDays());
        msg.setEmail(req.getEmail());
        msg.setRemark(req.getRemark());
        msg.setUserId(userId);
        msg.setStatus(LeadMessageStatus.NEW.getValue());

        messageRepository.save(msg);
        return msg.getId();
    }
}
