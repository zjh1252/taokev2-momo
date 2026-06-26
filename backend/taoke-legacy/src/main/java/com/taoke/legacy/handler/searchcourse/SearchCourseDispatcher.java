package com.taoke.legacy.handler.searchcourse;

import com.taoke.legacy.service.LegacyParamResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
public class SearchCourseDispatcher {

    private final Map<String, SearchCourseOptHandler> handlers;
    private final LegacyParamResolver paramResolver;

    public SearchCourseDispatcher(CourseListOptHandler courseList,
                                  CourseOrderOptHandler courseOrder,
                                  GetCourseByIdsOptHandler getCourseByIds,
                                  GetCourseBuyStatusOptHandler getCourseBuyStatus,
                                  GetCourseTopicOptHandler getCourseTopic,
                                  GetTopicCoursesOptHandler getTopicCourses,
                                  GetTopicCourseIdsOptHandler getTopicCourseIds,
                                  GenerateOrderOptHandler generateOrder,
                                  GetOrdersOptHandler getOrders,
                                  RestoreByOrderCodeOptHandler restoreByOrderCode,
                                  AdsListOptHandler adsList,
                                  GetAccountBuyVideosOptHandler getAccountBuyVideos,
                                  VideoDetailOptHandler videoDetail,
                                  GetVideoIdsByOrderCodeOptHandler getVideoIdsByOrderCode,
                                  VideoSupplierNextOptHandler videoSupplierNext,
                                  SyncCourseOptHandler syncCourse,
                                  LegacyParamResolver paramResolver) {
        this.paramResolver = paramResolver;
        this.handlers = new LinkedHashMap<>();
        handlers.put("courseList", courseList);
        handlers.put("courseOrder", courseOrder);
        handlers.put("getCourseByIds", getCourseByIds);
        handlers.put("getOrderCourseByIds", getCourseByIds);
        handlers.put("getCourseBuyStatus", getCourseBuyStatus);
        handlers.put("getCourseTopic", getCourseTopic);
        handlers.put("getTopicCourses", getTopicCourses);
        handlers.put("getTopicCourseIds", getTopicCourseIds);
        handlers.put("generateOrder", generateOrder);
        handlers.put("getOrders", getOrders);
        handlers.put("restoreByOrderCode", restoreByOrderCode);
        handlers.put("adsList", adsList);
        handlers.put("getAccountBuyVideos", getAccountBuyVideos);
        handlers.put("VideoDetail", videoDetail);
        handlers.put("getVideoIdsByOrderCode", getVideoIdsByOrderCode);
        handlers.put("videoSupplierNext", videoSupplierNext);
        handlers.put("sync_course", syncCourse);
    }

    public Object dispatch(HttpServletRequest request) {
        String opt = paramResolver.getString(request, "opt", "courseList");
        SearchCourseOptHandler handler = handlers.get(opt);
        if (handler == null) {
            log.debug("search_course unsupported opt: {}", opt);
            return Map.of();
        }
        return handler.handle(request);
    }
}
