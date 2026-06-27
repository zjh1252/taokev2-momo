package com.taoke.legacy.handler.get;

import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GetDispatcher {

    private final Map<String, GetOptHandler> handlers;
    private final LegacyParamResolver paramResolver;

    public GetDispatcher(List<GetOptHandler> handlerList, LegacyParamResolver paramResolver) {
        this.paramResolver = paramResolver;
        this.handlers = new LinkedHashMap<>();
        for (GetOptHandler handler : handlerList) {
            handlers.put(handler.opt(), handler);
        }
    }

    public Object dispatch(HttpServletRequest request) {
        String opt = paramResolver.getString(request, "opt", "trainer");
        GetOptHandler handler = handlers.get(opt);
        if (handler == null) {
            log.debug("get.php unsupported opt: {}", opt);
            return Map.of();
        }
        return handler.handle(request);
    }
}
