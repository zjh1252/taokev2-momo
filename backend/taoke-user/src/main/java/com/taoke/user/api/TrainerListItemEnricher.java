package com.taoke.user.api;

import com.taoke.user.dto.trainer.TrainerListItemResponse;

import java.util.List;

/**
 * 专家列表项扩展填充（由 taoke-course 等模块提供实现，避免 user ↔ course 循环依赖）。
 */
public interface TrainerListItemEnricher {

    void enrich(List<TrainerListItemResponse> items);
}
