package com.taoke.user.ucenter;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * UCenter HTTP 客户端。
 * <p>
 * 复刻老站 {@code client/client.php} 的 {@code uc_api_post} 调用方式，向
 * {@code {apiUrl}/index.php} 发送 {@code application/x-www-form-urlencoded} 请求：
 * <pre>m=user&a=&lt;action&gt;&inajax=2&input=&lt;authcode密文&gt;&appid=&lt;appid&gt;</pre>
 * 其中 input = urlencode(authcode("&lt;data&gt;&amp;agent=md5(UA)&amp;time=&lt;秒&gt;"))。
 * 仅实现接入所需的三个动作：登录、注册、改密。
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UcenterClient {

    private static final Pattern LEADING_INT = Pattern.compile("-?\\d+");

    private final UcenterProperties properties;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * 登录校验（对应 {@code uc_user_login}）。
     *
     * @param account  登录标识（用户名 / 手机号，按 UCenter 支持的方式）
     * @param password 明文密码（由 UCenter 内部比对）
     * @return 解析后的登录结果
     */
    public UcLoginResult login(String account, String password) {
        Map<String, String> args = new LinkedHashMap<>();
        args.put("username", account);
        args.put("password", password);
        args.put("isuid", "0");
        String body = post("user", "login", args);
        List<String> items = UcXml.parseItems(body);
        if (items.isEmpty()) {
            // 非 XML 响应：可能直接是负数错误码
            int code = parseLeadingInt(body, 0);
            return new UcLoginResult(code, null, null, null);
        }
        return UcLoginResult.fromItems(items);
    }

    /**
     * 注册（对应 {@code uc_user_syn_register} → UCenter user/register）。
     *
     * @return uc_uid（>0 成功）；负值为 UCenter 错误码：
     *         -1 用户名不合法 / -2 含敏感词 / -3 用户名已存在 / -4 邮箱格式错 / -5 邮箱不可用 / -6 邮箱已注册
     */
    public int register(String username, String password, String email, String mobile) {
        Map<String, String> args = new LinkedHashMap<>();
        args.put("username", username);
        args.put("password", password);
        args.put("email", email == null ? "" : email);
        if (mobile != null && !mobile.isBlank()) {
            args.put("mobile", mobile);
            args.put("mobilestatus", "1");
        }
        args.put("regip", "");
        String body = post("user", "register", args);
        return parseLeadingInt(body, Integer.MIN_VALUE);
    }

    /**
     * 按手机号反查 UCenter 用户（对应老站 {@code uc_user_select_users_by_contact}）。
     * 用于验证码登录时关联已存在的 UCenter 账号（避免重复注册）。
     *
     * @return 命中则 status=uc_uid(>0) 且带 username；未命中 status=0
     */
    public UcLoginResult lookupByMobile(String mobile) {
        Map<String, String> args = new LinkedHashMap<>();
        args.put("email", "");
        args.put("mobile", mobile);
        args.put("telephone", "");
        args.put("emailstatus", "");
        args.put("mobilestatus", "");
        String body = post("user", "select_users_by_contact", args);
        // 打印原始返回（XML），便于核对结构后校准解析
        log.info("[UCenter] select_users_by_contact mobile={} 原始返回={}", mobile, body);
        // 返回为（可能多个）用户的嵌套数组，这里取首个用户的 uid / username
        int uid = firstGroupInt(body, "<item id=\"uid\">(\\d+)</item>", 0);
        if (uid <= 0) {
            uid = firstGroupInt(body, "<item id=\"cdbid\">(\\d+)</item>", 0);
        }
        String username = firstGroup(body, "<item id=\"username\">([^<]*)</item>");
        return new UcLoginResult(uid, username, null, mobile);
    }

    /**
     * 改密（对应 {@code uc_user_edit}）。
     *
     * @param username          UCenter 用户名
     * @param oldPassword       旧密码；{@code ignoreOldPassword=true} 时可传空
     * @param newPassword       新密码
     * @param ignoreOldPassword true=忽略旧密码（找回密码场景）；false=校验旧密码（已登录改密场景）
     * @return >=0 成功（影响行数，0 表示无变化）；负值为错误码：
     *         -1 旧密码不符 / -7 无更新项 / -8 受保护会员 / -9 用户不存在
     */
    public int editPassword(String username, String oldPassword, String newPassword, boolean ignoreOldPassword) {
        Map<String, String> args = new LinkedHashMap<>();
        args.put("username", username);
        args.put("oldpw", oldPassword == null ? "" : oldPassword);
        args.put("newpw", newPassword);
        args.put("email", "");
        args.put("ignoreoldpw", ignoreOldPassword ? "1" : "0");
        String body = post("user", "edit", args);
        return parseLeadingInt(body, Integer.MIN_VALUE);
    }

    /**
     * 组装并发送一次 UCenter API 调用，返回响应体字符串。
     */
    private String post(String module, String action, Map<String, String> args) {
        String data = args.entrySet().stream()
                .map(e -> urlEncode(e.getKey()) + "=" + urlEncode(e.getValue()))
                .collect(Collectors.joining("&"));

        long time = System.currentTimeMillis() / 1000L;
        String agent = UcAuthcode.md5Hex(properties.getUserAgent().getBytes(StandardCharsets.ISO_8859_1));
        String plain = data + "&agent=" + agent + "&time=" + time;
        String input = UcAuthcode.encode(plain, properties.getKey());

        String formBody = "m=" + module
                + "&a=" + action
                + "&inajax=2"
                + "&input=" + urlEncode(input)
                + "&appid=" + properties.getAppid();

        URI uri = URI.create(trimTrailingSlash(properties.getApiUrl()) + "/index.php");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofMillis(properties.getTimeoutMs()))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("User-Agent", properties.getUserAgent())
                .POST(HttpRequest.BodyPublishers.ofString(formBody, StandardCharsets.ISO_8859_1))
                .build();

        try {
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                log.warn("UCenter 调用非 200：module={} action={} status={}", module, action, response.statusCode());
                throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE);
            }
            String bodyText = new String(response.body(), resolveCharset());
            return bodyText == null ? "" : bodyText.trim();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("UCenter 调用异常：module={} action={}", module, action, e);
            throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE);
        }
    }

    private Charset resolveCharset() {
        try {
            return Charset.forName(properties.getCharset());
        } catch (Exception e) {
            return StandardCharsets.UTF_8;
        }
    }

    private static String urlEncode(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }

    private static String trimTrailingSlash(String s) {
        if (s == null) {
            return "";
        }
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    /** 返回首个匹配分组的字符串（无匹配返回 null）。 */
    private static String firstGroup(String body, String regex) {
        if (body == null) {
            return null;
        }
        Matcher m = Pattern.compile(regex, Pattern.DOTALL).matcher(body);
        return m.find() ? m.group(1).trim() : null;
    }

    /** 返回首个匹配分组解析的整数（无匹配返回 def）。 */
    private static int firstGroupInt(String body, String regex, int def) {
        String s = firstGroup(body, regex);
        if (s == null || s.isBlank()) {
            return def;
        }
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return def;
        }
    }

    private static int parseLeadingInt(String body, int def) {
        if (body == null || body.isBlank()) {
            return def;
        }
        Matcher m = LEADING_INT.matcher(body.trim());
        if (m.find()) {
            try {
                return Integer.parseInt(m.group());
            } catch (NumberFormatException e) {
                return def;
            }
        }
        return def;
    }
}
