package com.taoke.legacy.handler.trainer;

import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class TrainerDispatcher {

    private final Map<String, TrainerPhpOptHandler> handlers;
    private final LegacyParamResolver paramResolver;

    public TrainerDispatcher(List<TrainerPhpOptHandler> handlerList, LegacyParamResolver paramResolver) {
        this.paramResolver = paramResolver;
        this.handlers = new LinkedHashMap<>();
        for (TrainerPhpOptHandler handler : handlerList) {
            handlers.put(handler.opt(), handler);
        }
    }

    public Object dispatch(HttpServletRequest request) {
        String opt = paramResolver.getString(request, "opt", "get_trainer_list");
        TrainerPhpOptHandler handler = handlers.get(opt);
        if (handler == null) {
            log.debug("trainer.php unsupported opt: {}", opt);
            return Map.of();
        }
        return handler.handle(request);
    }
}
