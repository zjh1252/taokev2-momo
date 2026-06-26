package com.taoke.legacy.handler.get;

import com.taoke.legacy.service.LegacyParamResolver;
import com.taoke.user.api.PxbLegacyTrainerQueryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class TrainerOptHandler implements GetOptHandler {

    private final LegacyParamResolver params;
    private final PxbLegacyTrainerQueryService trainerQueryService;

    @Override
    public String opt() {
        return "trainer";
    }

    @Override
    public Object handle(HttpServletRequest request) {
        String trainerName = params.getString(request, "trainer_name");
        boolean accurate = params.getInt(request, "accurate", 0) > 0;
        return trainerQueryService.searchByName(trainerName, 10, accurate);
    }
}
