package com.taoke.user.ucenter;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * UCenter 响应 XML 的轻量解析。
 * <p>
 * UCenter 用 {@code xml_serialize} 把数组序列化为
 * {@code <root><item id="0">v0</item><item id="1">v1</item>...</root>}，
 * {@code uc_user_login} 返回的就是这种「扁平索引数组」。这里只解析顶层
 * {@code <item id="N">值</item>}（值可能被 CDATA 包裹），按 id 升序返回值列表，
 * 足以覆盖 login 等接口的需求。
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:00
 */
public final class UcXml {

    private static final Pattern ITEM = Pattern.compile(
            "<item\\s+id=\"(\\d+)\">(.*?)</item>", Pattern.DOTALL);
    private static final Pattern CDATA = Pattern.compile(
            "^\\s*<!\\[CDATA\\[(.*?)\\]\\]>\\s*$", Pattern.DOTALL);

    private static final Pattern NAMED_ITEM = Pattern.compile(
            "<item\\s+id=\"([^\"]+)\">(.*?)</item>", Pattern.DOTALL);

    private UcXml() {
    }

    /**
     * 解析 {@code select_users_by_contact} 等接口返回的首个用户字段。
     * UCenter 常见结构为 {@code <item id="0"><item id="uid">...</item>...</item>}。
     */
    public static Map<String, String> parseFirstContactUser(String xml) {
        if (xml == null || xml.isBlank()) {
            return Map.of();
        }
        Pattern outer = Pattern.compile(
                "<item\\s+id=\"0\">(.*?)</item>\\s*(?:</root>|$)", Pattern.DOTALL);
        Matcher om = outer.matcher(xml);
        if (om.find()) {
            return parseNamedItems(om.group(1));
        }
        return parseNamedItems(xml);
    }

    /**
     * 解析带语义 id 的 XML 字段（如 uid / username），值支持 CDATA 包裹。
     */
    public static Map<String, String> parseNamedItems(String xml) {
        Map<String, String> map = new LinkedHashMap<>();
        if (xml == null) {
            return map;
        }
        Matcher m = NAMED_ITEM.matcher(xml);
        while (m.find()) {
            map.put(m.group(1), unwrapCdata(m.group(2)).trim());
        }
        return map;
    }

    private static String unwrapCdata(String value) {
        if (value == null) {
            return "";
        }
        Matcher c = CDATA.matcher(value);
        return c.matches() ? c.group(1) : value;
    }

    /**
     * 解析扁平索引数组，按 id 升序返回值。非 XML（如纯整数响应）则返回空列表。
     */
    public static List<String> parseItems(String xml) {
        TreeMap<Integer, String> map = new TreeMap<>();
        if (xml == null) {
            return new ArrayList<>();
        }
        Matcher m = ITEM.matcher(xml);
        while (m.find()) {
            int id = Integer.parseInt(m.group(1));
            String value = m.group(2);
            value = unwrapCdata(value);
            map.put(id, value.trim());
        }
        return new ArrayList<>(map.values());
    }
}
