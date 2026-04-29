package com.taoke.course.mapper;

import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.CoursePlanDTO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 课程对象映射器，负责 Entity/DTO/VO 之间的转换。
 * <p>
 * 该模块的 MapStruct 生成实现存在增量编译产物不稳定问题，
 * 此处改为显式 Spring 组件，避免运行时注入依赖于生成类。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-03 13:20
 */
@Component
public class CourseMapper {

    public CourseDetailVO toDetailVO(Course course) {
        if (course == null) {
            return null;
        }

        CourseDetailVO vo = new CourseDetailVO();
        vo.setId(course.getId());
        vo.setTitle(course.getTitle());
        vo.setType(course.getType() == null ? null : course.getType().name());
        vo.setPublisherId(course.getPublisherId());
        vo.setPublisherType(course.getPublisherType());
        vo.setCategoryId(course.getCategoryId());
        vo.setSubCategoryId(course.getSubCategoryId());
        vo.setCoverUrl(course.getCoverUrl());
        vo.setIntro(course.getIntro());
        vo.setSummary(course.getSummary());
        vo.setSyllabus(course.getSyllabus());
        vo.setMaterialUrl(course.getMaterialUrl());
        vo.setMaterialText(course.getMaterialText());
        vo.setAudience(course.getAudience());
        vo.setHighlights(course.getHighlights());
        vo.setDurationDays(course.getDurationDays());
        vo.setTotalHours(course.getTotalHours());
        vo.setPrice(course.getPrice());
        vo.setOriginalPrice(course.getOriginalPrice());
        vo.setKeywords(course.getKeywords());
        vo.setTrainerId(course.getTrainerId());
        vo.setIsFeatured(course.getIsFeatured());
        vo.setIsFree(course.getIsFree());
        vo.setHasPlan(course.getHasPlan());
        vo.setStatus(course.getStatus());
        vo.setRejectReason(course.getRejectReason());
        vo.setSortOrder(course.getSortOrder());
        vo.setViewCount(course.getViewCount());
        vo.setEnrollmentCount(course.getEnrollmentCount());
        vo.setScore(course.getScore());
        vo.setPublishedAt(course.getPublishedAt());
        vo.setCreatedAt(course.getCreatedAt());
        vo.setUpdatedAt(course.getUpdatedAt());
        return vo;
    }

    public CourseListItemVO toListItemVO(Course course) {
        if (course == null) {
            return null;
        }

        CourseListItemVO vo = new CourseListItemVO();
        vo.setId(course.getId());
        vo.setTitle(course.getTitle());
        vo.setType(course.getType() == null ? null : course.getType().name());
        vo.setCoverUrl(course.getCoverUrl());
        vo.setCategoryId(course.getCategoryId());
        vo.setDurationDays(course.getDurationDays());
        vo.setTotalHours(course.getTotalHours());
        vo.setPrice(course.getPrice());
        vo.setOriginalPrice(course.getOriginalPrice());
        vo.setIsFeatured(course.getIsFeatured());
        vo.setIsFree(course.getIsFree());
        vo.setStatus(course.getStatus());
        vo.setViewCount(course.getViewCount());
        vo.setEnrollmentCount(course.getEnrollmentCount());
        vo.setScore(course.getScore());
        vo.setPublisherType(course.getPublisherType());
        vo.setKeywords(course.getKeywords());
        vo.setPublishedAt(course.getPublishedAt());
        vo.setCreatedAt(course.getCreatedAt());
        return vo;
    }

    public CoursePlanDTO toPlanDTO(CoursePlan plan) {
        if (plan == null) {
            return null;
        }

        CoursePlanDTO dto = new CoursePlanDTO();
        dto.setId(plan.getId());
        dto.setStartTime(plan.getStartTime());
        dto.setEndTime(plan.getEndTime());
        dto.setProvinceId(plan.getProvinceId());
        dto.setCityId(plan.getCityId());
        dto.setDistrictId(plan.getDistrictId());
        dto.setAddress(plan.getAddress());
        dto.setOnlineUrl(plan.getOnlineUrl());
        dto.setSortOrder(plan.getSortOrder());
        return dto;
    }

    public List<CoursePlanDTO> toPlanDTOList(List<CoursePlan> plans) {
        if (plans == null) {
            return null;
        }
        return plans.stream().map(this::toPlanDTO).toList();
    }

    public CoursePlan toPlanEntity(CoursePlanDTO dto) {
        if (dto == null) {
            return null;
        }

        CoursePlan plan = new CoursePlan();
        plan.setId(dto.getId());
        plan.setStartTime(dto.getStartTime());
        plan.setEndTime(dto.getEndTime());
        plan.setProvinceId(dto.getProvinceId());
        plan.setCityId(dto.getCityId());
        plan.setDistrictId(dto.getDistrictId());
        plan.setAddress(dto.getAddress());
        plan.setOnlineUrl(dto.getOnlineUrl());
        plan.setSortOrder(dto.getSortOrder());
        return plan;
    }
}
