package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoSupplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

/**
 * 录播课供应商持久化
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
public interface VideoSupplierRepository extends JpaRepository<VideoSupplier, Integer>,
        JpaSpecificationExecutor<VideoSupplier> {

    Optional<VideoSupplier> findByUserId(Integer userId);

    boolean existsByUserId(Integer userId);

    boolean existsByUserIdAndIdNot(Integer userId, Integer id);
}
