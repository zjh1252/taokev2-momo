package com.taoke.legacy.config;

import com.taoke.legacy.tomcat.LegacyApiErrorReportValve;
import org.apache.catalina.Container;
import org.apache.catalina.Valve;
import org.apache.catalina.core.StandardHost;
import org.apache.catalina.valves.ErrorReportValve;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

/**
 * Legacy 入口在 Tomcat Host 层因非法 URL 字符失败时，返回 JSON 兜底而非 HTML Exception Report。
 * <p>
 * 须在 {@link StandardHost} 上替换 {@link ErrorReportValve}（Context 级无效：解析失败时请求尚未进入应用）。
 */
@Configuration
@ConditionalOnClass(TomcatServletWebServerFactory.class)
public class LegacyTomcatErrorConfig {

    @Bean
    @Order(Ordered.LOWEST_PRECEDENCE)
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> legacyTomcatErrorCustomizer() {
        return factory -> factory.addContextCustomizers(context -> {
            Container parent = context.getParent();
            if (!(parent instanceof StandardHost host)) {
                return;
            }
            host.setErrorReportValveClass(LegacyApiErrorReportValve.class.getName());
            installHostErrorReportValve(host);
        });
    }

    private static void installHostErrorReportValve(StandardHost host) {
        for (Valve valve : host.getPipeline().getValves()) {
            if (valve instanceof ErrorReportValve && !(valve instanceof LegacyApiErrorReportValve)) {
                host.getPipeline().removeValve(valve);
            }
        }
        for (Valve valve : host.getPipeline().getValves()) {
            if (valve instanceof LegacyApiErrorReportValve) {
                return;
            }
        }
        LegacyApiErrorReportValve legacyValve = new LegacyApiErrorReportValve();
        legacyValve.setShowReport(false);
        legacyValve.setShowServerInfo(false);
        host.getPipeline().addValve(legacyValve);
    }
}
