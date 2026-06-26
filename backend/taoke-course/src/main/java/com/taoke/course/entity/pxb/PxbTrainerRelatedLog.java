package com.taoke.course.entity.pxb;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 培训宝 legacy 讲师关联日志（老站 pxb_related_log）。
 */
@Getter
@Setter
@Entity
@Table(name = "pxb_trainer_related_logs")
public class PxbTrainerRelatedLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "trainer_uid", nullable = false)
    private Integer trainerUid;

    @Column(name = "pxb_uid", nullable = false)
    private Integer pxbUid;

    @Column(name = "pxb_username", nullable = false, length = 100)
    private String pxbUsername = "";

    @Column(name = "mobile", nullable = false, length = 32)
    private String mobile = "";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
