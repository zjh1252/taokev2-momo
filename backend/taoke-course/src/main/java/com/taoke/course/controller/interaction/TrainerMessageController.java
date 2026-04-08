package com.taoke.course.controller.interaction;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.interaction.SubmitTrainerMessageRequest;
import com.taoke.course.service.interaction.TrainerMessageServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 专家留言接口
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Tag(name = "专家留言", description = "给专家留言")
@RestController
@RequiredArgsConstructor
public class TrainerMessageController {

    private final TrainerMessageServiceImpl messageService;

    @Operation(summary = "提交专家留言")
    @PostMapping("/interaction/trainer-messages")
    public ApiResponse<Integer> submitMessage(@Valid @RequestBody SubmitTrainerMessageRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        Integer msgId = messageService.submitMessage(userId, request);
        return ApiResponse.ok(msgId);
    }
}
