package com.taoke.legacy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import java.util.Map;

/**
 * 对齐老站 templates/mobile/video/supplier.htm。
 */
@Component
@RequiredArgsConstructor
public class LegacyMobileSupplierHtmlRenderer {

    private final ObjectMapper objectMapper;

    public String render(int vType, String playUrl, Map<String, Object> limitPayload, String errorInfo) {
        if (StringUtils.hasText(errorInfo)) {
            return wrapHtml("""
                    <div class="node-empty"><div class="icon"></div>%s</div>
                    """.formatted(HtmlUtils.htmlEscape(errorInfo)));
        }
        String proxiedUrl = LegacyPlaybackProxyUrls.toSameOriginProxy(playUrl);
        String safeUrl = HtmlUtils.htmlEscape(proxiedUrl);
        String body;
        if (vType == 9) {
            body = "<div><img src=\"" + safeUrl + "\" style=\"width: 100%;\"/></div>";
        } else {
            body = """
                    <iframe id="video-player" width="100%%" height="100%%" src="%s" \
                    allowtransparency="true" allowfullscreen="true" allowfullscreenInteractive="true" \
                    scrolling="auto" border="0" frameborder="0"></iframe>
                    """.formatted(safeUrl);
        }
        String heartbeatScript = buildHeartbeatScript(limitPayload);
        return wrapHtml(body + heartbeatScript);
    }

    private String buildHeartbeatScript(Map<String, Object> limitPayload) {
        if (limitPayload == null || limitPayload.isEmpty()) {
            return """
                    <script>
                    (function () {
                      var player = document.getElementById('video-player');
                      if (player) player.style.height = (window.innerHeight - 40) + 'px';
                    })();
                    </script>
                    """;
        }
        String json;
        try {
            Map<String, Object> postData = new java.util.LinkedHashMap<>(limitPayload);
            postData.put("action", "concurrencyLimiter");
            Map<String, Object> root = Map.of("cmd", "video_orders", "data", postData);
            json = objectMapper.writeValueAsString(root);
        } catch (JsonProcessingException e) {
            json = "{}";
        }
        String escapedJson = json.replace("\\", "\\\\").replace("'", "\\'");
        return """
                <script>
                (function () {
                  var player = document.getElementById('video-player');
                  if (player) player.style.height = (window.innerHeight - 40) + 'px';
                  var jsonstr = '%s';
                  function ajaxPostData() {
                    var url = window.location.protocol + '//' + window.location.host + '/getData?t=' + Math.random();
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url + '&json=' + encodeURIComponent(jsonstr), true);
                    xhr.send();
                  }
                  setInterval(ajaxPostData, 5000);
                })();
                </script>
                """.formatted(escapedJson);
    }

    private static String wrapHtml(String body) {
        return """
                <!DOCTYPE html>
                <html><head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>正文</title>
                <style>
                html,body{margin:0;padding:0;height:100%%;}
                .node-empty{padding:24px;text-align:center;color:#666;}
                .big-pnl .pnl2-title{background:#10c090 !important;}
                </style>
                </head><body>%s</body></html>
                """.formatted(body);
    }
}
