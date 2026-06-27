package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoPackageLabel;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 系列课名称索引（id = 老站 tk_video_topic_item.id）。
 */
public interface VideoPackageLabelRepository extends JpaRepository<VideoPackageLabel, Integer> {
}
