package com.taoke.common.config;

import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

@Configuration
public class LegacyStaticAssetConfig {

    @Bean
    LegacyStaticAssetProperties legacyStaticAssetProperties(Environment environment) {
        LegacyStaticAssetProperties properties = new LegacyStaticAssetProperties();
        Binder.get(environment).bind("taoke.legacy-static", Bindable.ofInstance(properties));
        overrideIfPresent(environment, "TAOKE_LEGACY_STATIC_CDN_BASE", properties::setCdnBase);
        overrideIfPresent(environment, "TAOKE_LEGACY_MAIN_SITE_BASE", properties::setMainSiteBase);
        return properties;
    }

    private static void overrideIfPresent(Environment environment, String key, java.util.function.Consumer<String> setter) {
        String value = environment.getProperty(key);
        if (StringUtils.hasText(value)) {
            setter.accept(value.trim());
        }
    }
}
