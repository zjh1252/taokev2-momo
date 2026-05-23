package com.taoke.user.ucenter;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * {@link UcAuthcode} 与 PHP {@code uc_authcode} 的一致性单测。
 * <p>
 * KNOWN_CIPHER 由老站算法（client.php）以固定 keyc=ab12、密钥 KEY 加密 KNOWN_PLAIN 生成，
 * Java 端必须能解出原文，以此保证与 UCenter 字节级互通。
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:00
 */
class UcAuthcodeTest {

    private static final String KEY = "506cq/cuxBy/XFc5nX4AvOiTDe3QSraUZCV6q+g";

    private static final String KNOWN_PLAIN =
            "username=zhangsan&password=Abc%40123&isuid=0&agent=deadbeef&time=1747900000";

    /** 由 PHP uc_authcode(KNOWN_PLAIN, 'ENCODE', KEY) 以 keyc=ab12 生成 */
    private static final String KNOWN_CIPHER =
            "ab12+t5UKBnRQyVUWeLfHWa+Fd6+VsPrSrHpwe1mVbYsmRfQlOWLvRhHDOMJ0LEvfg9EGM8iTvk2FUaE32oK4tOevSKC+M6XdHlD1FcL0Sg7iKHiAhXizQBnjDYXwInEoyM5wWPBwMo";

    @Test
    void decodesPhpGeneratedCipher() {
        assertEquals(KNOWN_PLAIN, UcAuthcode.decode(KNOWN_CIPHER, KEY),
                "Java 必须能解出 PHP 生成的密文，否则与 UCenter 不互通");
    }

    @Test
    void roundTrip() {
        String[] samples = {
                KNOWN_PLAIN,
                "username=13800138000&password=p%26w%3Dd%2B1&isuid=0&agent=ff&time=1747900001",
                "m=user&a=login",
                "",
        };
        for (String s : samples) {
            String cipher = UcAuthcode.encode(s, KEY);
            assertEquals(s, UcAuthcode.decode(cipher, KEY), "round-trip 失败: " + s);
        }
    }

    @Test
    void wrongKeyFailsToDecode() {
        String cipher = UcAuthcode.encode(KNOWN_PLAIN, KEY);
        assertEquals("", UcAuthcode.decode(cipher, "another-wrong-key"),
                "错误密钥应解密失败返回空串");
    }

    @Test
    void md5HexMatchesPhp() {
        assertEquals("d41d8cd98f00b204e9800998ecf8427e", UcAuthcode.md5Hex(new byte[0]));
        assertEquals("900150983cd24fb0d6963f7d28e17f72",
                UcAuthcode.md5Hex("abc".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1)));
    }

    @Test
    void parsesLoginXml() {
        String xml = "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?><root>"
                + "<item id=\"0\">123456</item>"
                + "<item id=\"1\">zhangsan</item>"
                + "<item id=\"2\">hashpwd</item>"
                + "<item id=\"3\"><![CDATA[a@b.com]]></item>"
                + "</root>";
        List<String> items = UcXml.parseItems(xml);
        assertEquals(4, items.size());
        assertEquals("123456", items.get(0));
        assertEquals("zhangsan", items.get(1));
        assertEquals("a@b.com", items.get(3));

        UcLoginResult r = UcLoginResult.fromItems(items);
        assertTrue(r.success());
        assertEquals(123456, r.ucUid());
        assertEquals("zhangsan", r.username());
        assertEquals("a@b.com", r.email());
    }
}
