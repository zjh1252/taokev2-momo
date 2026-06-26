package com.taoke.user.service;

import com.taoke.user.entity.RoleApplicationChangeLog;
import com.taoke.user.repository.RoleApplicationChangeLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 角色申请变更日志服务 — 记录已生效用户"资料重审"时的字段级变更。
 *
 * @author Fangxinxin
 * @date 2026-06-25 18:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleApplicationChangeLogService {

    private final RoleApplicationChangeLogRepository repository;

    /** 生成批次号 */
    public static String batchKey(Integer userId, String role) {
        return role + "-" + userId + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    /**
     * 比较新旧值，仅记录真正有变化的字段。
     *
     * @param userId   用户 ID
     * @param role     角色编码
     * @param batch    批次号
     * @param oldMap   旧值映射（fieldName → 展示用字符串）
     * @param newMap   新值映射（fieldName → 展示用字符串）
     * @param labelMap 字段名 → 中文标签
     */
    @Transactional
    public void recordChanges(Integer userId, String role, String batch,
                              Map<String, String> oldMap,
                              Map<String, String> newMap,
                              Map<String, String> labelMap) {
        if (oldMap.isEmpty() && newMap.isEmpty()) return;

        List<RoleApplicationChangeLog> logs = new ArrayList<>();
        Set<String> allKeys = new HashSet<>();
        allKeys.addAll(oldMap.keySet());
        allKeys.addAll(newMap.keySet());

        for (String field : allKeys) {
            String oldVal = oldMap.getOrDefault(field, "");
            String newVal = newMap.getOrDefault(field, "");
            if (Objects.equals(oldVal, newVal)) continue;

            RoleApplicationChangeLog log = new RoleApplicationChangeLog();
            log.setUserId(userId);
            log.setRole(role);
            log.setChangeBatch(batch);
            log.setFieldName(field);
            log.setFieldLabel(labelMap.getOrDefault(field, field));
            log.setOldValue(oldVal);
            log.setNewValue(newVal);
            logs.add(log);
        }

        if (!logs.isEmpty()) {
            repository.saveAll(logs);
        }
    }

    /**
     * 查询某用户某角色的所有变更日志（最近在前）。
     */
    public List<RoleApplicationChangeLog> listByUserAndRole(Integer userId, String role) {
        return repository.findByUserIdAndRoleOrderByCreatedAtDesc(userId, role);
    }

    /**
     * 查询最近一次变更批次号。
     */
    public Optional<String> getLastBatch(Integer userId, String role) {
        return repository.findFirstByUserIdAndRoleOrderByCreatedAtDesc(userId, role)
                .map(RoleApplicationChangeLog::getChangeBatch);
    }

    /**
     * 查询最近批次的变更字段名集合（用于前端高亮）。
     */
    public Set<String> getLastChangedFields(Integer userId, String role) {
        return getLastBatch(userId, role)
                .map(batch -> repository.findByUserIdAndRoleAndChangeBatch(userId, role, batch))
                .orElse(List.of())
                .stream()
                .map(RoleApplicationChangeLog::getFieldName)
                .collect(Collectors.toSet());
    }
}
