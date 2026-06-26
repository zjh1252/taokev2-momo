package com.taoke.legacy.tomcat;

import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.Request;
import org.apache.catalina.connector.Response;
import org.apache.catalina.valves.ErrorReportValve;

import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;

/**
 * Tomcat 解析 Request-Target 失败时，对 Legacy 入口返回 HTTP 200 + JSON，避免 HTML Exception Report。
 */
@Slf4j
public class LegacyApiErrorReportValve extends ErrorReportValve {

    @Override
    protected void report(Request request, Response response, Throwable throwable) {
        String body = LegacyMalformedRequestBodyResolver.resolve(request, throwable);
        if (body == null) {
            super.report(request, response, throwable);
            return;
        }

        if (response.isCommitted()) {
            return;
        }
        if (!response.setErrorReported()) {
            return;
        }

        try {
            response.setStatus(200);
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());

            Writer writer = response.getReporter();
            if (writer != null) {
                writer.write(body);
            } else {
                response.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));
            }
            response.finishResponse();
            log.warn("Legacy malformed request-target, JSON fallback applied: {}", throwable.toString());
        } catch (IOException | IllegalStateException e) {
            log.debug("Failed to write legacy malformed-request response", e);
        }
    }
}
