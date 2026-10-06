package com.aimodel.compare.service;

import com.aimodel.compare.common.BusinessException;
import com.aimodel.compare.mapper.FavoriteMapper;
import com.aimodel.compare.mapper.ModelMapper;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 收藏业务逻辑层 —— 对应 Node 版 src/services/favorite.service.js
 * -------------------------------------------------
 * 职责：参数校验 + 业务规则（收藏的模型必须真实存在）。
 * 出错时抛带 status 的 BusinessException，由 GlobalExceptionHandler 统一转成 JSON 响应
 * —— 对应 Node 版 fail(status, message) → 全局错误中间件的流转链路。
 */
@Service
public class FavoriteService {

    private final FavoriteMapper favoriteMapper;
    private final ModelMapper modelMapper;

    /** 一个 Service 可组合多个 DAO/Mapper —— 对应 Node 版 favorite.service.js 同时 import 两个 dao */
    public FavoriteService(FavoriteMapper favoriteMapper, ModelMapper modelMapper) {
        this.favoriteMapper = favoriteMapper;
        this.modelMapper = modelMapper;
    }

    /**
     * 查询某用户的收藏 id 列表（userId 必填）。
     * 对应 Node 版：if (!userId) fail(400, '缺少 userId 参数')
     */
    public List<String> list(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new BusinessException(400, "缺少 userId 参数"); // 400 = 请求参数不合法
        }
        return favoriteMapper.listByUser(userId);
    }

    /**
     * 添加收藏。
     * 业务规则：参数非空 + 目标模型必须真实存在，全部校验通过后才真正写库。
     * 重复收藏由 SQL 的 INSERT OR IGNORE 静默忽略（天然幂等）。
     */
    public void add(String userId, String modelId) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(modelId)) {
            throw new BusinessException(400, "userId 与 modelId 不能为空");
        }
        if (modelMapper.findById(modelId) == null) {
            throw new BusinessException(404, "模型不存在");
        }
        favoriteMapper.add(userId, modelId);
    }

    /**
     * 取消收藏。
     * SQL 的 DELETE 删除不存在的记录不会报错（影响行数为 0），直接删即可 ——
     * 幂等设计，前端重复点击"取消收藏"也不会出错。
     */
    public void remove(String userId, String modelId) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(modelId)) {
            throw new BusinessException(400, "userId 与 modelId 不能为空");
        }
        favoriteMapper.remove(userId, modelId);
    }
}
