package com.taoke.user.ucenter;

import java.util.Map;

/**
 * UC 租户 unique_value 枚举与字段文案映射（对齐 UC config unique_value 1~4）。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
public final class UcUniqueValueMapper {

    private static final Map<Integer, String> INDEX_TO_FIELD = Map.of(
            1, "chinese_name",
            2, "employee_id",
            3, "mobile",
            4, "email"
    );

    private static final Map<String, String> FIELD_TO_LABEL = Map.of(
            "chinese_name", "姓名",
            "employee_id", "工号",
            "mobile", "手机号",
            "email", "邮箱"
    );

    private UcUniqueValueMapper() {
    }

    public static String fieldCodeOfIndex(int uniqueValueIndex) {
        return INDEX_TO_FIELD.getOrDefault(uniqueValueIndex, "mobile");
    }

    public static String labelOfFieldCode(String fieldCode) {
        return FIELD_TO_LABEL.getOrDefault(fieldCode, "身份标识");
    }

    public static String placeholderOfFieldCode(String fieldCode) {
        return "请输入" + labelOfFieldCode(fieldCode);
    }
}
