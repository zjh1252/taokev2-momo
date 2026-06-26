package com.taoke.legacy.handler.trainer;

import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.user.api.PxbLegacyTrainerQueryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetTrainerListOptHandler implements TrainerPhpOptHandler {

    private static final int PICK_COUNT = 6;

    private final LegacyParamResolver params;
    private final PxbLegacyTrainerQueryService trainerQueryService;

    @Override
    public String opt() {
        return "get_trainer_list";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        String trade = params.getString(request, "trade");
        String keyword = params.getString(request, "keyword");
        String extKeyword = params.getString(request, "extkeyword");
        List<Map<String, Object>> members = trainerQueryService.listTrainersForPxb(
                trade, keyword, extKeyword, PICK_COUNT);
        return Map.of("isok", true, "msg", members);
    }
}
