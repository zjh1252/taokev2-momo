package com.taoke.user.api;

import java.util.List;
import java.util.Map;

/**
 * 培训宝 legacy 讲师查询（get.php opt=trainer、trainer.php）。
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

    /**
     * trainer.php opt=get_trainer_list：按行业/关键词筛选后随机抽取讲师。
     *
     * @param trade      行业 ID 或名称（可 tab 分隔多个名称，取首个匹配）
     * @param keyword    主搜索词
     * @param extKeyword 扩展搜索词
     * @param pickCount  随机抽取条数（老站固定 6）
     */
    List<Map<String, Object>> listTrainersForPxb(String trade, String keyword, String extKeyword, int pickCount);

    /**
     * trainer.php opt=get_trainer_detail：按老站 roleid（v2 user_trainers.id）查详情。
     */
    Map<String, Object> getDetailByRoleId(int roleId);
}
