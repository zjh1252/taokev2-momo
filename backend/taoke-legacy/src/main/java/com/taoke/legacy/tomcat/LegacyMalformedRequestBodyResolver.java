package com.taoke.legacy.tomcat;

import org.apache.catalina.connector.Request;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 非法 Request-Target（如 Query 未 urlencode 的中文）被 Tomcat 拒绝时，按 Legacy 路径返回 JSON 兜底 body。
 */
public final class LegacyMalformedRequestBodyResolver {

    private static final Pattern REQUEST_TARGET_IN_MESSAGE = Pattern.compile("\\[([^\\]]+)\\]");

    private LegacyMalformedRequestBodyResolver() {
    }

    public static boolean isMalformedRequestTarget(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && message.contains("Invalid character found in the request target")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    /**
     * @return Legacy JSON body；非 Legacy 路径或无法识别时返回 null（走 Tomcat 默认错误页）
     */
    public static String resolve(Request request, Throwable throwable) {
        if (!isMalformedRequestTarget(throwable)) {
            return null;
        }
        String raw = combineRequestTarget(request, throwable);
        if (raw == null) {
            return null;
        }
        return bodyForTarget(raw.toLowerCase(Locale.ROOT));
    }

    static String bodyForTarget(String lowerTarget) {
        if (lowerTarget.contains("/api/trainer.php")) {
            return "{\"isok\":false,\"msg\":\"参数错误\"}";
        }
        if (lowerTarget.contains("/api/get.php") || lowerTarget.contains("/api/search_course.php")) {
            return "{}";
        }
        if (isTaokeVideoPlayer(lowerTarget)) {
            return "{\"isok\":false,\"data\":\"参数错误\"}";
        }
        if (isGetData(lowerTarget)) {
            return "{\"isok\":false,\"tip\":\"invalid json\"}";
        }
        return null;
    }

    private static boolean isTaokeVideoPlayer(String target) {
        return target.contains("c=taokevideo") && target.contains("a=player");
    }

    private static boolean isGetData(String target) {
        return target.contains("/getdata")
                || (target.contains("c=taokeajax") && target.contains("a=getdata"));
    }

    private static String combineRequestTarget(Request request, Throwable throwable) {
        StringBuilder sb = new StringBuilder();
        if (request != null) {
            String uri = request.getRequestURI();
            if (uri != null) {
                sb.append(uri);
            }
            String query = request.getQueryString();
            if (query != null) {
                if (sb.length() > 0) {
                    sb.append('?');
                }
                sb.append(query);
            }
        }
        if (sb.length() > 0) {
            return sb.toString();
        }
        return extractRequestTargetFromMessage(throwable);
    }

    private static String extractRequestTargetFromMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                Matcher matcher = REQUEST_TARGET_IN_MESSAGE.matcher(message);
                if (matcher.find()) {
                    return matcher.group(1).trim();
                }
            }
            current = current.getCause();
        }
        return null;
    }
}
