package com.taoke.course.mapper;

import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.CoursePlanDTO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * 课程对象映射 — Entity/DTO/VO 转换
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Mapper(componentModel = "spring")
public interface CourseMapper {

    // ==================== 课程主表 ====================

    @Mapping(target = "typeLabel", ignore = true)
    @Mapping(target = "publisherName", ignore = true)
    @Mapping(target = "categoryName", ignore = true)
    @Mapping(target = "subCategoryName", ignore = true)
    @Mapping(target = "trainerName", ignore = true)
    @Mapping(target = "statusLabel", ignore = true)
    @Mapping(target = "plans", ignore = true)
    CourseDetailVO toDetailVO(Course course);

    @Mapping(target = "typeLabel", ignore = true)
    @Mapping(target = "categoryName", ignore = true)
    @Mapping(target = "statusLabel", ignore = true)
    @Mapping(target = "publisherName", ignore = true)
    @Mapping(target = "trainerName", ignore = true)
    CourseListItemVO toListItemVO(Course course);

    // ==================== 开课计划 ====================

    CoursePlanDTO toPlanDTO(CoursePlan plan);

    List<CoursePlanDTO> toPlanDTOList(List<CoursePlan> plans);

    @Mapping(target = "courseId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CoursePlan toPlanEntity(CoursePlanDTO dto);
}
