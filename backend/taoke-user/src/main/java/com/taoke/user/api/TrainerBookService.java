package com.taoke.user.api;

import com.taoke.user.dto.trainerbook.SaveTrainerBookRequest;
import com.taoke.user.dto.trainerbook.TrainerBookResponse;
import com.taoke.user.entity.TrainerBook;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 专家著作业务接口
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:30
 */
public interface TrainerBookService {

    /** 自服务：我的著作列表（按 sort_order 倒序） */
    List<TrainerBookResponse> listMyBooks(Integer userId);

    /** 自服务：新增著作 */
    TrainerBookResponse createBook(Integer userId, SaveTrainerBookRequest request);

    /** 自服务：更新著作 */
    TrainerBookResponse updateBook(Integer userId, Integer bookId, SaveTrainerBookRequest request);

    /** 自服务：删除著作 */
    void deleteBook(Integer userId, Integer bookId);

    /** 自服务：批量排序（ids 顺序即展示顺序） */
    void batchSort(Integer userId, List<Integer> ids);

    /** C端公开：某专家著作列表（trainerId = user_trainers.id） */
    List<TrainerBookResponse> listPublicBooks(Integer trainerId);

    // ==================== 后台管理 ====================

    Page<TrainerBook> adminSearch(Integer status, String keyword, int page, int size);

    TrainerBook adminGetOrThrow(Integer bookId);

    TrainerBookResponse adminCreate(Integer trainerId, Integer submitterUserId, SaveTrainerBookRequest request);

    void adminApprove(Integer bookId, Integer reviewerId);

    void adminReject(Integer bookId, Integer reviewerId, String reason);
}
