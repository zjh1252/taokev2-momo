package com.taoke.legacy.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.Set;

/**
 * PXB 录播 CDN 同源反代：在 Security/MVC 之前拉流，避免二进制响应被安全头或编码过滤器干扰。
 */
@Slf4j
public class LegacyPxbCdnProxyFilter implements Filter {

    private static final String PXB_CDN_BASE = "https://cdn5-pxb-videos.taoke.com";
    private static final String PROXY_PREFIX = "/pxb-videos/";
    private static final Set<String> PASSTHROUGH_HEADERS = Set.of(
            HttpHeaders.CONTENT_TYPE,
            HttpHeaders.CONTENT_LENGTH,
            HttpHeaders.CONTENT_RANGE,
            HttpHeaders.ACCEPT_RANGES,
            HttpHeaders.ETAG,
            HttpHeaders.LAST_MODIFIED
    );
    private static final Set<String> FORWARD_REQUEST_HEADERS = Set.of(
            HttpHeaders.RANGE,
            "If-Range",
            HttpHeaders.IF_NONE_MATCH
    );

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest httpRequest)
                || !(response instanceof HttpServletResponse httpResponse)) {
            chain.doFilter(request, response);
            return;
        }
        String path = extractPath(httpRequest);
        if (!StringUtils.hasText(path)) {
            chain.doFilter(request, response);
            return;
        }
        proxy(httpRequest, httpResponse, path);
    }

    static void proxy(HttpServletRequest request, HttpServletResponse response, String path)
            throws IOException {
        String upstream = PXB_CDN_BASE + "/" + path + querySuffix(request);
        boolean head = "HEAD".equalsIgnoreCase(request.getMethod());

        HttpURLConnection conn = null;
        try {
            conn = openUpstream(upstream, request, head ? "HEAD" : "GET");
            int status = conn.getResponseCode();
            response.setStatus(status);
            copyHeaders(conn, response);
            response.setHeader(HttpHeaders.CACHE_CONTROL, "public, max-age=3600");
            response.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
            response.setBufferSize(64 * 1024);
            if (head || status == HttpServletResponse.SC_NO_CONTENT) {
                return;
            }
            InputStream input = status >= 400 ? conn.getErrorStream() : conn.getInputStream();
            if (input == null) {
                return;
            }
            try (input; OutputStream output = response.getOutputStream()) {
                input.transferTo(output);
                output.flush();
            }
        } catch (Exception e) {
            log.warn("PXB CDN 反代失败: upstream={}, reason={}", upstream, e.getMessage());
            if (!response.isCommitted()) {
                response.resetBuffer();
                response.sendError(HttpServletResponse.SC_BAD_GATEWAY, "PXB CDN proxy failed");
            }
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private static HttpURLConnection openUpstream(String upstream,
                                                  HttpServletRequest request,
                                                  String method) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) URI.create(upstream).toURL().openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(120000);
        conn.setInstanceFollowRedirects(true);
        for (String name : FORWARD_REQUEST_HEADERS) {
            String value = request.getHeader(name);
            if (StringUtils.hasText(value)) {
                conn.setRequestProperty(name, value);
            }
        }
        conn.connect();
        return conn;
    }

    private static void copyHeaders(HttpURLConnection conn, HttpServletResponse response) {
        for (String name : PASSTHROUGH_HEADERS) {
            String value = conn.getHeaderField(name);
            if (StringUtils.hasText(value)) {
                response.setHeader(name, value);
            }
        }
    }

    static String extractPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String prefix = request.getContextPath() + PROXY_PREFIX;
        if (!uri.startsWith(prefix)) {
            return "";
        }
        return uri.substring(prefix.length());
    }

    private static String querySuffix(HttpServletRequest request) {
        String query = request.getQueryString();
        return StringUtils.hasText(query) ? "?" + query : "";
    }
}
