package com.taoke.course.entity;



import com.taoke.common.entity.BaseEntity;

import jakarta.persistence.*;

import lombok.Getter;

import lombok.Setter;

import org.hibernate.annotations.DynamicInsert;

import org.hibernate.annotations.DynamicUpdate;



/**

 * 运营素材库

 *

 * @author Fangxinxin

 * @date 2026-06-12 16:00

 */

@Getter

@Setter

@Entity

@DynamicInsert

@DynamicUpdate

@Table(name = "ops_materials")

public class OpsMaterial extends BaseEntity {



    @Column(name = "material_type", nullable = false, length = 32)

    private String materialType = "COVER";



    @Column(name = "name", nullable = false, length = 128)

    private String name = "";



    @Column(name = "url", nullable = false, length = 512)

    private String url;



    /** 课程分类名称（封面素材） */

    @Column(name = "category", nullable = false, length = 64)

    private String category = "其它";



    @Column(name = "scene", nullable = false, length = 32)

    private String scene = "GENERAL";



    @Column(name = "enabled", nullable = false, columnDefinition = "tinyint(1)")

    private Boolean enabled = true;



    @Column(name = "is_default", nullable = false, columnDefinition = "tinyint(1)")

    private Boolean isDefault = false;



    @Column(name = "usage_count", nullable = false)

    private Integer usageCount = 0;

}

