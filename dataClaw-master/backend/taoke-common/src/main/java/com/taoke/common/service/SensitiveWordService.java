package com.taoke.common.service;

import com.taoke.common.entity.SensitiveWord;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 敏感词服务接口 — 提供敏感词检测、替换与管理功能。
 * <p>
 * 其他模块注入此接口即可对文本做敏感词过滤。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:00
 */
public interface SensitiveWordService {

    // ==================== 文本检测 ====================

    /** 检测文本是否包含敏感词 */
    boolean contains(String text);

    /** 查找文本中命中的所有敏感词 */
    List<String> findAll(String text);

    /** 替换文本中的敏感词 */
    String replace(String text);

    // ==================== 词库管理 ====================

    /** 重新加载词库到内存 */
    void reload();

    /** 分页查询敏感词 */
    Page<SensitiveWord> search(String keyword, Integer category, Boolean enabled, int page, int size);

    /** 新增敏感词 */
    SensitiveWord create(String word, Integer category, String replacement, Boolean enabled);

    /** 编辑敏感词 */
    SensitiveWord update(Integer id, String word, Integer category, String replacement, Boolean enabled);

    /** 删除敏感词 */
    void delete(Integer id);

    /** 批量导入敏感词（每行一个），返回成功导入数量 */
    int batchImport(List<String> words, Integer category);
}
