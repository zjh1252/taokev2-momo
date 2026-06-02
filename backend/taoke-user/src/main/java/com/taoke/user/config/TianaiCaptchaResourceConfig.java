package com.taoke.user.config;

import cloud.tianai.captcha.common.constant.CaptchaTypeConstant;
import cloud.tianai.captcha.resource.CrudResourceStore;
import cloud.tianai.captcha.resource.ResourceStore;
import cloud.tianai.captcha.resource.common.model.dto.Resource;
import com.taoke.user.captcha.CaptchaProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * tianai-captcha 资源初始化。
 *
 * @author Fangxinxin
 * @date 2026-05-25 20:30
 */
@Slf4j
@Configuration
public class TianaiCaptchaResourceConfig {

    /**
     * tianai 1.5.5 的 init-default-resource 只注册模板图，不注册背景底图。
     * 如果 SLIDER 背景资源为空，生成验证码时会报 "store中资源为空"。
     */
    @Bean
    public ApplicationRunner tianaiCaptchaBackgroundResourceInitializer(
            ResourceStore resourceStore,
            CaptchaProperties captchaProperties
    ) {
        return args -> {
            ResourceStore target = resourceStore.getTarget();
            if (!(target instanceof CrudResourceStore crudResourceStore)) {
                log.warn("tianai captcha ResourceStore 不支持动态注册背景资源: {}", target.getClass().getName());
                return;
            }

            List<String> backgroundImageLocations = captchaProperties.getSliderBackgroundImages();
            if (backgroundImageLocations == null) {
                backgroundImageLocations = List.of();
            }

            List<Resource> configuredResources = backgroundImageLocations
                    .stream()
                    .filter(StringUtils::hasText)
                    .map(this::toResource)
                    .toList();
            if (configuredResources.isEmpty()) {
                configuredResources = List.of(new Resource("classpath", "META-INF/cut-image/resource/1.jpg"));
            }

            Set<String> existingResourceKeys = crudResourceStore.listResourcesByTypeAndTag(CaptchaTypeConstant.SLIDER, null)
                    .stream()
                    .map(this::resourceKey)
                    .collect(Collectors.toSet());
            int addedCount = 0;
            for (Resource resource : configuredResources) {
                if (!existingResourceKeys.add(resourceKey(resource))) {
                    continue;
                }
                crudResourceStore.addResource(CaptchaTypeConstant.SLIDER, resource);
                addedCount++;
            }

            if (addedCount > 0) {
                log.info("已初始化 tianai 滑块验证码背景资源 {} 张", addedCount);
            }
        };
    }

    private Resource toResource(String location) {
        String value = location.trim();
        if (value.startsWith("classpath:")) {
            return new Resource("classpath", normalizeClasspathLocation(value.substring("classpath:".length())));
        }
        if (value.startsWith("file:")) {
            return new Resource("file", value.substring("file:".length()));
        }
        if (value.startsWith("URL:")) {
            return new Resource("URL", value.substring("URL:".length()));
        }
        if (value.startsWith("url:")) {
            return new Resource("URL", value.substring("url:".length()));
        }
        if (value.startsWith("http://") || value.startsWith("https://")) {
            return new Resource("URL", value);
        }
        return new Resource("classpath", normalizeClasspathLocation(value));
    }

    private String normalizeClasspathLocation(String location) {
        return location.startsWith("/") ? location.substring(1) : location;
    }

    private String resourceKey(Resource resource) {
        return resource.getType() + ":" + resource.getData();
    }
}
