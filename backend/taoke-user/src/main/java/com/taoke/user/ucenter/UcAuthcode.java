package com.taoke.user.ucenter;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * UCenter / Discuz {@code authcode} 加解密算法的 Java 移植。
 * <p>
 * 与老站 {@code client/client.php} 中的 {@code uc_authcode} 函数保持 <b>字节级一致</b>，
 * 否则 UCenter 端无法解密。算法本质是基于 RC4 的对称加密 + 头部 MAC 校验。
 * <p>
 * 关键移植要点：
 * <ul>
 *   <li>全程按字节运算；hex/明文均为 ASCII，统一用 ISO-8859-1 承载字节，避免编码漂移。</li>
 *   <li>{@code md5()} 输出为 32 位小写十六进制字符串（PHP 行为）。</li>
 *   <li>ENCODE 时 keyc 取 {@code md5(随机).substr(-4)}；DECODE 时 keyc 取密文前 4 位。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:00
 */
public final class UcAuthcode {

    private static final Charset L1 = StandardCharsets.ISO_8859_1;
    private static final int CKEY_LENGTH = 4;
    private static final SecureRandom RANDOM = new SecureRandom();

    private UcAuthcode() {
    }

    /**
     * 加密（对应 PHP {@code uc_authcode($string, 'ENCODE', $key)}，expiry=0 永不过期）。
     *
     * @param plaintext 明文（ASCII）
     * @param key       通信密钥
     * @return keyc(4hex) + base64（去除 '='）
     */
    public static String encode(String plaintext, String key) {
        return crypt(plaintext, true, key, 0);
    }

    /**
     * 解密（对应 PHP {@code uc_authcode($string, 'DECODE', $key)}）。
     *
     * @param ciphertext 密文
     * @param key        通信密钥
     * @return 还原后的明文；校验失败返回空串
     */
    public static String decode(String ciphertext, String key) {
        return crypt(ciphertext, false, key, 0);
    }

    private static String crypt(String string, boolean encode, String key, long expiry) {
        String keyMd5 = md5Hex(key.getBytes(L1));
        String keya = md5Hex(keyMd5.substring(0, 16).getBytes(L1));
        String keyb = md5Hex(keyMd5.substring(16, 32).getBytes(L1));

        String keyc;
        if (encode) {
            byte[] seed = new byte[16];
            RANDOM.nextBytes(seed);
            String rnd = md5Hex(seed);
            keyc = rnd.substring(rnd.length() - CKEY_LENGTH);
        } else {
            keyc = string.length() >= CKEY_LENGTH ? string.substring(0, CKEY_LENGTH) : string;
        }

        String cryptkey = keya + md5Hex((keya + keyc).getBytes(L1));
        byte[] cryptkeyBytes = cryptkey.getBytes(L1);
        int keyLength = cryptkeyBytes.length;

        byte[] data;
        if (encode) {
            String head = String.format("%010d", expiry != 0 ? expiry + nowSeconds() : 0);
            String mac = md5Hex((string + keyb).getBytes(L1)).substring(0, 16);
            byte[] prefix = (head + mac).getBytes(L1);
            byte[] body = string.getBytes(L1);
            data = new byte[prefix.length + body.length];
            System.arraycopy(prefix, 0, data, 0, prefix.length);
            System.arraycopy(body, 0, data, prefix.length, body.length);
        } else {
            String b64 = string.length() > CKEY_LENGTH ? string.substring(CKEY_LENGTH) : "";
            // ENCODE 时去除了 '='，PHP base64_decode 可容错；Java 解码器较严格，需补齐填充
            data = b64.isEmpty() ? new byte[0] : Base64.getDecoder().decode(padBase64(b64));
        }

        byte[] result = rc4(data, cryptkeyBytes, keyLength);

        if (encode) {
            String b64 = Base64.getEncoder().encodeToString(result).replace("=", "");
            return keyc + b64;
        }

        // DECODE：校验头部 10 位时间戳 + 16 位 MAC
        String res = new String(result, L1);
        if (res.length() < 26) {
            return "";
        }
        String tenStr = res.substring(0, 10);
        long ten;
        try {
            ten = Long.parseLong(tenStr);
        } catch (NumberFormatException e) {
            ten = -1;
        }
        String macStored = res.substring(10, 26);
        String payload = res.substring(26);
        String macCalc = md5Hex((payload + keyb).getBytes(L1)).substring(0, 16);
        if ((ten == 0 || ten - nowSeconds() > 0) && macStored.equals(macCalc)) {
            return payload;
        }
        return "";
    }

    /**
     * RC4 流加密 / 解密（自反）。box 用 cryptkey 初始化后逐字节异或。
     */
    private static byte[] rc4(byte[] data, byte[] cryptkey, int keyLength) {
        int[] box = new int[256];
        for (int i = 0; i < 256; i++) {
            box[i] = i;
        }
        int[] rndkey = new int[256];
        for (int i = 0; i <= 255; i++) {
            rndkey[i] = cryptkey[i % keyLength] & 0xff;
        }
        for (int j = 0, i = 0; i < 256; i++) {
            j = (j + box[i] + rndkey[i]) % 256;
            int tmp = box[i];
            box[i] = box[j];
            box[j] = tmp;
        }
        byte[] result = new byte[data.length];
        for (int a = 0, j = 0, i = 0; i < data.length; i++) {
            a = (a + 1) % 256;
            j = (j + box[a]) % 256;
            int tmp = box[a];
            box[a] = box[j];
            box[j] = tmp;
            int k = box[(box[a] + box[j]) % 256];
            result[i] = (byte) ((data[i] & 0xff) ^ k);
        }
        return result;
    }

    private static long nowSeconds() {
        return System.currentTimeMillis() / 1000L;
    }

    /**
     * 将去除填充的 base64 补齐为 4 的倍数长度（用于 DECODE）。
     */
    private static String padBase64(String b64) {
        int mod = b64.length() % 4;
        if (mod == 0) {
            return b64;
        }
        return b64 + "====".substring(mod);
    }

    /**
     * 计算 MD5 并返回 32 位小写十六进制（与 PHP md5() 一致）。
     */
    static String md5Hex(byte[] input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input);
            StringBuilder sb = new StringBuilder(32);
            for (byte b : digest) {
                sb.append(Character.forDigit((b >> 4) & 0xf, 16));
                sb.append(Character.forDigit(b & 0xf, 16));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 不可用", e);
        }
    }
}
