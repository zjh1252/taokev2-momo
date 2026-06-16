package com.taoke.course.repository;



import com.taoke.course.entity.OpsMaterial;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;



/**

 * 运营素材库持久化

 *

 * @author Fangxinxin

 * @date 2026-06-12 16:00

 */

public interface OpsMaterialRepository extends JpaRepository<OpsMaterial, Integer>,

        JpaSpecificationExecutor<OpsMaterial> {

}

