package com.taoke.admin.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * Python 爬虫服务 HTTP 客户端。
 * <p>
 * 封装与 Python FastAPI 爬虫服务的通信，使用 Spring Boot 3.5 RestClient。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Slf4j
@Service
public class CrawlerClientService {

    private final RestClient restClient;
    private final String callbackUrl;
    private final String callbackToken;

    public CrawlerClientService(
            @Value("${crawler.base-url:http://localhost:8100}") String baseUrl,
            @Value("${crawler.callback-url:}") String callbackUrl,
            @Value("${crawler.callback-token:}") String callbackToken) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.callbackUrl = callbackUrl;
        this.callbackToken = callbackToken;
    }

    /**
     * 触发爬取任务
     *
     * @param source    数据源标识
     * @param dataType  数据类型：TRAINER/COURSE
     * @param maxItems  爬取数量限制（可为 null）
     * @param startUrl  起始 URL（可为 null）
     * @return Python 服务端的任务 ID
     */
    public String triggerCrawl(String source, String dataType, Integer maxItems, String startUrl) {
        Map<String, Object> builder = new HashMap<>();
        builder.put("source", source);
        builder.put("data_type", dataType);
        if (callbackUrl != null && !callbackUrl.isBlank()) builder.put("callback_url", callbackUrl);
        if (callbackToken != null && !callbackToken.isBlank()) builder.put("callback_token", callbackToken);
        if (maxItems != null) builder.put("max_items", maxItems);
        if (startUrl != null && !startUrl.isBlank()) builder.put("start_url", startUrl);

        log.info("触发爬取任务: source={}, dataType={}", source, dataType);

        Map<String, Object> response = restClient.post()
                .uri("/api/crawl/jobs")
                .contentType(MediaType.APPLICATION_JSON)
                .body(builder)
                .retrieve()
                .body(Map.class);

        String jobId = response.get("job_id").toString();
        log.info("爬取任务已创建: jobId={}", jobId);
        return jobId;
    }

    /**
     * 取消爬取任务
     */
    public void cancelCrawl(String crawlerJobId) {
        log.info("取消爬取任务: crawlerJobId={}", crawlerJobId);
        restClient.put()
                .uri("/api/crawl/jobs/{jobId}/cancel", crawlerJobId)
                .retrieve()
                .toBodilessEntity();
    }

    /**
     * 查询任务状态
     */
    public Map<String, Object> getStatus(String crawlerJobId) {
        return restClient.get()
                .uri("/api/crawl/jobs/{jobId}", crawlerJobId)
                .retrieve()
                .body(Map.class);
    }
}
