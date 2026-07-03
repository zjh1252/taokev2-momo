package com.taoke.legacy.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import java.util.Map;

/**
 * 对齐老站 templates/mobile/video/player.htm（培训宝 PC iframe / 非 pxbmobile 入口）。
 */
@Component
@RequiredArgsConstructor
public class LegacyMobilePlayerHtmlRenderer {

    private final ObjectMapper objectMapper;

    public String renderError(String message) {
        return wrapPage("""
                <div class="node-empty">%s</div>
                """.formatted(HtmlUtils.htmlEscape(message)), false, false);
    }

    public String renderVideo(String playUrl,
                              String poster,
                              boolean pxbPcOrigin,
                              boolean online,
                              Map<String, Object> limitPayload,
                              String publicBaseUrl) {
        String proxiedUrl = LegacyPlaybackProxyUrls.toAbsoluteProxy(playUrl, publicBaseUrl);
        if (online) {
            String iframe = """
                    <iframe id="taoke_video" width="100%%" height="100%%" src="%s" \
                    allowfullscreen allow="autoplay; fullscreen"></iframe>
                    """.formatted(HtmlUtils.htmlEscape(proxiedUrl));
            return wrapPage(iframe + heartbeatScript(limitPayload, false), pxbPcOrigin, true);
        }
        String posterAttr = StringUtils.hasText(poster)
                ? " poster=\"" + HtmlUtils.htmlEscape(poster) + "\""
                : "";
        String video = """
                <video id="taoke_video" controls controlsList="nodownload" \
                preload="auto" playsinline webkit-playsinline x5-playsinline width="100%%" height="100%%"%s>
                  <source src="%s" type="video/mp4"/>
                </video>
                """.formatted(posterAttr, HtmlUtils.htmlEscape(proxiedUrl));
        String autoplayScript = pxbPcOrigin ? autoplayScript() : "";
        return wrapPage(video + autoplayScript + heartbeatScript(limitPayload, true), pxbPcOrigin, true);
    }

    private static String autoplayScript() {
        return """
                <script>
                document.addEventListener('DOMContentLoaded', function () {
                  var video = document.getElementById('taoke_video');
                  if (!video) return;
                  function tryPlay() {
                    video.muted = false;
                    var playPromise = video.play();
                    if (playPromise && playPromise.catch) {
                      playPromise.catch(function () {
                        video.muted = true;
                        video.play().catch(function () {});
                      });
                    }
                  }
                  if (video.readyState >= 1) {
                    tryPlay();
                  } else {
                    video.addEventListener('loadedmetadata', tryPlay, { once: true });
                  }
                });
                </script>
                """;
    }

    private String heartbeatScript(Map<String, Object> limitPayload, boolean videoElement) {
        if (limitPayload == null || limitPayload.isEmpty()) {
            if (!videoElement) {
                return resizeIframeScript();
            }
            return "";
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
        String resize = videoElement ? "" : resizeIframeScript();
        return resize + """
                <script>
                (function () {
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

    private static String resizeIframeScript() {
        return """
                <script>
                (function () {
                  var el = document.getElementById('taoke_video');
                  if (el) el.style.height = (window.innerHeight - 40) + 'px';
                })();
                </script>
                """;
    }

    private static String wrapPage(String body, boolean pxbPcOrigin, boolean videoBox) {
        String boxStyle = pxbPcOrigin
                ? "width:910px;height:490px;margin:0 auto;border:none;"
                : "width:100%;height:100%;border:none;";
        String inner = videoBox
                ? "<div class=\"videoBox\" style=\"" + boxStyle + "\">" + body + "</div>"
                : body;
        return """
                <!DOCTYPE html>
                <html><head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>视频播放</title>
                <style>
                html,body{margin:0;padding:0;height:100%%;background:#000;}
                .videoBox video,.videoBox iframe{display:block;background:#000;}
                .node-empty{padding:24px;text-align:center;color:#666;background:#fff;}
                </style>
                </head><body>%s</body></html>
                """.formatted(inner);
    }
}
