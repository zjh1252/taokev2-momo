package com.taoke.common.service.impl;

import com.taoke.common.entity.SensitiveWord;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.repository.SensitiveWordRepository;
import com.taoke.common.service.SensitiveWordService;
import com.taoke.common.util.DfaTrieFilter;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 敏感词服务实现
 * <p>
 * 启动时从数据库加载所有已启用的敏感词构建 DFA Trie，后续匹配为纯内存操作。
 * 词库变更后需调用 {@link #reload()} 重建 Trie。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SensitiveWordServiceImpl implements SensitiveWordService {

    private final SensitiveWordRepository sensitiveWordRepository;

    private volatile DfaTrieFilter filter = new DfaTrieFilter(Map.of());

    @PostConstruct
    public void init() {
        reload();
    }

    // ==================== 文本检测 ====================

    @Override
    public boolean contains(String text) {
        return filter.contains(text);
    }

    @Override
    public List<String> findAll(String text) {
        return filter.findAll(text);
    }

    @Override
    public String replace(String text) {
        return filter.replace(text);
    }

    // ==================== 词库管理 ====================

    @Override
    public synchronized void reload() {
        List<Object[]> rows = sensitiveWordRepository.findAllEnabledWordAndReplacement();
        Map<String, String> wordMap = new HashMap<>(rows.size());
        for (Object[] row : rows) {
            String word = (String) row[0];
            String replacement = (String) row[1];
            wordMap.put(word, replacement);
        }
        this.filter = new DfaTrieFilter(wordMap);
        log.info("敏感词库已重新加载，共 {} 个词", wordMap.size());
    }

    @Override
    public Page<SensitiveWord> search(String keyword, Integer category, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        return sensitiveWordRepository.search(keyword, category, pageable);
    }

    @Override
    @Transactional
    public SensitiveWord create(String word, Integer category, String replacement, Boolean enabled) {
        if (sensitiveWordRepository.existsByWord(word)) {
            throw new BusinessException(ErrorCode.SENSITIVE_WORD_EXISTS);
        }
        SensitiveWord entity = new SensitiveWord();
        entity.setWord(word.trim());
        entity.setCategory(category != null ? category : 5);
        entity.setReplacement(replacement != null ? replacement : "***");
        entity.setEnabled(enabled != null ? enabled : true);
        entity = sensitiveWordRepository.save(entity);
        reload();
        return entity;
    }

    @Override
    @Transactional
    public SensitiveWord update(Integer id, String word, Integer category, String replacement, Boolean enabled) {
        SensitiveWord entity = sensitiveWordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SENSITIVE_WORD_NOT_FOUND));

        if (word != null && !word.equals(entity.getWord())) {
            if (sensitiveWordRepository.existsByWord(word)) {
                throw new BusinessException(ErrorCode.SENSITIVE_WORD_EXISTS);
            }
            entity.setWord(word.trim());
        }
        if (category != null) {
            entity.setCategory(category);
        }
        if (replacement != null) {
            entity.setReplacement(replacement);
        }
        if (enabled != null) {
            entity.setEnabled(enabled);
        }
        entity = sensitiveWordRepository.save(entity);
        reload();
        return entity;
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        if (!sensitiveWordRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.SENSITIVE_WORD_NOT_FOUND);
        }
        sensitiveWordRepository.deleteById(id);
        reload();
    }

    @Override
    @Transactional
    public int batchImport(List<String> words, Integer category) {
        int count = 0;
        int cat = category != null ? category : 5;
        for (String w : words) {
            String trimmed = w.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (sensitiveWordRepository.existsByWord(trimmed)) {
                continue;
            }
            SensitiveWord entity = new SensitiveWord();
            entity.setWord(trimmed);
            entity.setCategory(cat);
            entity.setReplacement("***");
            entity.setEnabled(true);
            sensitiveWordRepository.save(entity);
            count++;
        }
        if (count > 0) {
            reload();
        }
        log.info("批量导入敏感词完成，共导入 {} 个（跳过已存在的）", count);
        return count;
    }
}
