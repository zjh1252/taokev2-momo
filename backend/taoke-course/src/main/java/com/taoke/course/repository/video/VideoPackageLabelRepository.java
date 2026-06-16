package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoPackageLabel;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 录播课视频包名称仓储
 *
 * @author Fangxinxin
 * @date 2026-06-10 14:00
 */
public interface VideoPackageLabelRepository extends JpaRepository<VideoPackageLabel, Integer> {
}
