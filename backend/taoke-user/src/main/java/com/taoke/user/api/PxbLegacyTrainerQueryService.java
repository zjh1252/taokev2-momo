package com.taoke.user.api;

import java.util.Map;

/**
 * 培训宝 legacy get.php opt=trainer。
 */
public interface PxbLegacyTrainerQueryService {

    /**
     * 按讲师姓名搜索已发布讲师。
     *
     * @param trainerName 关键词
     * @param limit       最大条数
     * @param accurate    是否精确匹配
     * @return key=讲师 userId，value=老站字段 map
     */
    Map<Integer, Map<String, Object>> searchByName(String trainerName, int limit, boolean accurate);
}
