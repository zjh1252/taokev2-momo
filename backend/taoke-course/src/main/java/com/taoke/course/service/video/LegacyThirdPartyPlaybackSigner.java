package com.taoke.course.service.video;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.config.LegacyThirdPartyVideoProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 对齐老站 eceibs_video / kuaike_video 的播放 URL 本地签发（无需额外 HTTP 请求）。
 *
 * @author Fangxinxin
 * @date 2026-06-11 10:00
 */
@Component
@RequiredArgsConstructor
public class LegacyThirdPartyPlaybackSigner {

    private static final Pattern ECEIBS_SCHEME = Pattern.compile("^eceibs:([^:]+):(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern KUAIKE_SCHEME = Pattern.compile("^kuaike:([^:]+):?(.*)$", Pattern.CASE_INSENSITIVE);

    private final LegacyThirdPartyVideoProperties properties;

    /**
     * 根据章节存储的 canonical scheme 或遗留 @@ 格式签发 embed URL。
     */
    public SignedPlayback sign(String storedUrl, int userId, String loginName) {
        String raw = storedUrl == null ? "" : storedUrl.trim();
        if (raw.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "章节无播放地址");
        }

        Matcher eceibsMatcher = ECEIBS_SCHEME.matcher(raw);
        if (eceibsMatcher.matches() || raw.contains("@@")) {
            return signEceibs(raw, userId, loginName);
        }

        Matcher kuaikeMatcher = KUAIKE_SCHEME.matcher(raw);
        if (kuaikeMatcher.matches()) {
            return signKuaike(
                    kuaikeMatcher.group(1),
                    kuaikeMatcher.group(2),
                    userId,
                    loginName
            );
        }

        throw new BusinessException(ErrorCode.PARAM_INVALID, "该章节不支持第三方播放签发");
    }

    private SignedPlayback signEceibs(String raw, int userId, String loginName) {
        LegacyThirdPartyVideoProperties.Eceibs cfg = properties.getEceibs();
        if (!cfg.isEnabled()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "中欧录播播放暂未启用");
        }

        String tid;
        String cid;
        Matcher scheme = ECEIBS_SCHEME.matcher(raw);
        if (scheme.matches()) {
            tid = scheme.group(1);
            cid = scheme.group(2);
        } else {
            String part = raw.split("###")[0].trim();
            int at = part.indexOf("@@");
            if (at < 0) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "中欧播放参数无效");
            }
            tid = part.substring(0, at).trim();
            cid = part.substring(at + 2).trim();
        }

        Map<String, String> params = new LinkedHashMap<>();
        params.put("corpid", cfg.getCorpId());
        params.put("uid", String.valueOf(userId));
        params.put("loginname", loginName);
        params.put("username", loginName);
        params.put("tid", tid);
        params.put("cid", cid);
        params.put("timestamp", String.valueOf(System.currentTimeMillis() / 1000));
        params.put("sig", eceibsCourseSig(cfg.getApiKey(), cfg.getCorpId(), userId, loginName, tid, cid));

        String base = normalizeBase(cfg.getApiUrl()) + "index.php?r=front/scorm/shareViewScormWithTrainplan";
        String embedUrl = appendQuery(base, params);
        return new SignedPlayback(embedUrl, "eceibs");
    }

    private SignedPlayback signKuaike(String courseId, String lectureId, int userId, String loginName) {
        LegacyThirdPartyVideoProperties.Kuaike cfg = properties.getKuaike();
        if (!cfg.isEnabled()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "快课录播播放暂未启用");
        }

        long timestampMs = System.currentTimeMillis();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("method_", "showLecture");
        params.put("caller_", "TK");
        params.put("videoOnly", "true");
        params.put("corpCode", cfg.getCorpCode());
        params.put("corpName", cfg.getCorpName());
        params.put("timestamp_", String.valueOf(timestampMs));
        params.put("preview", "true");
        params.put("loginName", loginName);
        params.put("userId", String.valueOf(userId));
        params.put("userName", loginName);
        params.put("courseId", courseId);
        if (lectureId != null && !lectureId.isBlank()) {
            params.put("lectureId", lectureId);
        }
        if (courseId.length() > 1) {
            params.put("courseToken", courseId.substring(1, Math.min(6, courseId.length())));
        }
        params.put("sign_", kuaikeSign(cfg.getApiKey(), "showLecture", "TK", timestampMs));

        String embedUrl = appendQuery(normalizeBase(cfg.getApiUrl()), params);
        return new SignedPlayback(embedUrl, "kuaike");
    }

    private static String eceibsCourseSig(String apiKey, String corpId, int uid, String loginName, String tid, String cid) {
        String inner = md5Hex(corpId + uid + loginName + loginName + tid + cid);
        return md5Hex(apiKey + inner);
    }

    private static String kuaikeSign(String secret, String method, String caller, long timestampMs) {
        return md5Hex(secret + method + caller + timestampMs + secret);
    }

    private static String md5Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).toLowerCase(Locale.ROOT);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 不可用", e);
        }
    }

    private static String normalizeBase(String base) {
        if (base == null || base.isBlank()) {
            return "";
        }
        return base.endsWith("/") ? base : base + "/";
    }

    private static String appendQuery(String base, Map<String, String> params) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(base);
        params.forEach(builder::queryParam);
        return builder.encode(StandardCharsets.UTF_8).build().toUriString();
    }

    public record SignedPlayback(String embedUrl, String provider, String playbackMode) {
        public SignedPlayback(String embedUrl, String provider) {
            this(embedUrl, provider, "embed");
        }
    }
}
