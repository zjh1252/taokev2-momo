package com.taoke.course.repository.video;

import com.taoke.course.entity.video.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * 录播课持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
public interface VideoRepository extends JpaRepository<Video, Integer>, JpaSpecificationExecutor<Video> {
}
