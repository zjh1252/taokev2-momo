package com.taoke.common.util;

import java.util.*;

/**
 * 基于 DFA（确定有限自动机）的敏感词过滤器。
 * <p>
 * 将敏感词构建为 Trie 树，匹配时逐字符做状态转移，时间复杂度 O(n)，与词库大小无关。
 * 线程安全：构建完成后 Trie 为只读结构，多线程可并发调用匹配方法。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:00
 */
public class DfaTrieFilter {

    private static final String END_FLAG = "\u0000";

    private final Map<Character, Object> trieRoot = new HashMap<>();
    private final Map<String, String> replacementMap;

    /**
     * @param wordReplacements key=敏感词, value=替换文本
     */
    public DfaTrieFilter(Map<String, String> wordReplacements) {
        this.replacementMap = wordReplacements != null ? wordReplacements : Map.of();
        for (String word : this.replacementMap.keySet()) {
            addWord(word);
        }
    }

    @SuppressWarnings("unchecked")
    private void addWord(String word) {
        if (word == null || word.isBlank()) {
            return;
        }
        Map<Character, Object> current = trieRoot;
        for (int i = 0; i < word.length(); i++) {
            char c = word.charAt(i);
            Object next = current.get(c);
            if (next == null) {
                Map<Character, Object> node = new HashMap<>();
                current.put(c, node);
                current = node;
            } else {
                current = (Map<Character, Object>) next;
            }
        }
        current.put(END_FLAG.charAt(0), null);
    }

    /**
     * 检测文本是否包含敏感词
     */
    public boolean contains(String text) {
        if (text == null || text.isEmpty() || trieRoot.isEmpty()) {
            return false;
        }
        for (int i = 0; i < text.length(); i++) {
            int matchLen = matchAt(text, i);
            if (matchLen > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * 查找文本中所有命中的敏感词
     */
    public List<String> findAll(String text) {
        List<String> result = new ArrayList<>();
        if (text == null || text.isEmpty() || trieRoot.isEmpty()) {
            return result;
        }
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < text.length(); i++) {
            int matchLen = matchAt(text, i);
            if (matchLen > 0) {
                String matched = text.substring(i, i + matchLen);
                if (seen.add(matched)) {
                    result.add(matched);
                }
                i += matchLen - 1;
            }
        }
        return result;
    }

    /**
     * 替换文本中的敏感词
     */
    public String replace(String text) {
        if (text == null || text.isEmpty() || trieRoot.isEmpty()) {
            return text;
        }
        StringBuilder sb = new StringBuilder(text.length());
        int i = 0;
        while (i < text.length()) {
            int matchLen = matchAt(text, i);
            if (matchLen > 0) {
                String matched = text.substring(i, i + matchLen);
                sb.append(replacementMap.getOrDefault(matched, "***"));
                i += matchLen;
            } else {
                sb.append(text.charAt(i));
                i++;
            }
        }
        return sb.toString();
    }

    /**
     * 从 text[startIndex] 开始，尝试在 Trie 中做最长匹配，返回匹配长度（0 表示未匹配）
     */
    @SuppressWarnings("unchecked")
    private int matchAt(String text, int startIndex) {
        Map<Character, Object> current = trieRoot;
        int matchLen = 0;
        int lastMatchLen = 0;

        for (int i = startIndex; i < text.length(); i++) {
            char c = text.charAt(i);
            Object next = current.get(c);
            if (next == null) {
                break;
            }
            matchLen++;
            current = (Map<Character, Object>) next;
            if (current.containsKey(END_FLAG.charAt(0))) {
                lastMatchLen = matchLen;
            }
        }
        return lastMatchLen;
    }

    /**
     * 词库是否为空
     */
    public boolean isEmpty() {
        return trieRoot.isEmpty();
    }
}
