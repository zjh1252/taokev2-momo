package com.taoke.legacy.config;

import com.taoke.legacy.filter.LegacyPxbCdnProxyFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class LegacyPxbCdnProxyConfig {

    @Bean
    public FilterRegistrationBean<LegacyPxbCdnProxyFilter> legacyPxbCdnProxyFilterRegistration() {
        FilterRegistrationBean<LegacyPxbCdnProxyFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new LegacyPxbCdnProxyFilter());
        bean.addUrlPatterns("/pxb-videos/*");
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        bean.setName("legacyPxbCdnProxyFilter");
        return bean;
    }
}
