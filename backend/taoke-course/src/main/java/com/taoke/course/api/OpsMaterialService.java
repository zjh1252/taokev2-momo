package com.taoke.course.api;

import com.taoke.course.entity.OpsMaterial;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 运营素材库能力接口
 *
 * @author Fangxinxin
 * @date 2026-06-12 16:00
 */
public interface OpsMaterialService {

    Page<OpsMaterial> listForAdmin(String materialType, String keyword, String category,
                                   String scene, Boolean enabled, Boolean isDefault,
                                   Pageable pageable);

    Page<OpsMaterial> listForUser(String materialType, String category, String scene, Pageable pageable);

    OpsMaterial getById(Integer id);

    OpsMaterial create(String materialType, String name, String url, String category,
                       String scene, Boolean enabled, Boolean isDefault);

    OpsMaterial update(Integer id, String name, String url, String category,
                       String scene, Boolean enabled, Boolean isDefault);

    void delete(Integer id);

    void setEnabled(Integer id, boolean enabled);

    void setDefault(Integer id, boolean isDefault);

    void batchOperate(List<Integer> ids, String action);

    void incrementUsage(Integer id);
}
