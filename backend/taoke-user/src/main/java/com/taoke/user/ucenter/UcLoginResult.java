package com.taoke.user.ucenter;

import java.util.List;

/**
 * UCenter {@code user/login} 的返回。
 * <p>
 * 老站 {@code uc_user_login} 解出的数组依次为：
 * {@code [status, username, password, email, merge, emailstatus, mobile, mobilestatus]}。
 * {@code status > 0} 时即为 UCenter 用户 ID（uc_uid）；常见负值：-1 用户不存在、-2 密码错。
 *
 * @param status   状态码 / uc_uid（>0 表示登录成功且为用户 ID）
 * @param username UCenter 用户名
 * @param email    邮箱
 * @param mobile   手机号
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:00
 */
public record UcLoginResult(int status, String username, String email, String mobile) {

    /** 登录是否成功（status>0 即为 uc_uid）。 */
    public boolean success() {
        return status > 0;
    }

    /** 成功时的 uc_uid。 */
    public int ucUid() {
        return status;
    }

    /**
     * 从 XML 解析出的有序值列表构造结果。容错处理字段缺失。
     */
    static UcLoginResult fromItems(List<String> items) {
        int status = parseIntSafe(at(items, 0), 0);
        String username = at(items, 1);
        String email = at(items, 3);
        String mobile = at(items, 6);
        return new UcLoginResult(status, username, email, mobile);
    }

    private static String at(List<String> list, int idx) {
        return idx < list.size() ? list.get(idx) : null;
    }

    private static int parseIntSafe(String s, int def) {
        if (s == null || s.isBlank()) {
            return def;
        }
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return def;
        }
    }
}
