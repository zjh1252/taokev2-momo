package com.taoke.legacy.handler.trainer;

import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.user.api.PxbLegacyTrainerQueryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetTrainerDetailOptHandler implements TrainerPhpOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyTrainerQueryService trainerQueryService;

    @Override
    public String opt() {
        return "get_trainer_detail";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        int roleId = params.getInt(request, "role_id", 0);
        if (roleId <= 0) {
            return Map.of("isok", false, "msg", "专家编号错误！");
        }
        Map<String, Object> detail = trainerQueryService.getDetailByRoleId(roleId);
        return Map.of("isok", true, "msg", detail);
    }
}
