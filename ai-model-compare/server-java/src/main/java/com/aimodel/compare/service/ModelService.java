package com.aimodel.compare.service;

import com.aimodel.compare.entity.Model;
import com.aimodel.compare.mapper.ModelMapper;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 模型业务逻辑层 —— 对应 Node 版 src/services/model.service.js（export const modelService）
 * -------------------------------------------------
 * 对比学习（JS 对象方法 vs Java 类方法）：
 *   - Node 版：定义对象字面量，方法内部直接 import 的 modelDao 调用
 *   - Java 版：@Service 把类注册为 Spring Bean，构造器注入 Mapper 依赖，
 *     方法用 Stream API 表达"过滤"语义（Java 版的 .filter/.map 链 ≈ JS 的数组方法）
 *
 * 业务规则（刻意保持与 Node 版"内存过滤"完全同构）：
 *   注意这里没有把筛选下推到 SQL 的 WHERE —— Node 版就是全量查出后内存 filter，
 *   为对比学习保留相同的逻辑形态（真实生产项目中应优先 SQL 过滤减少数据传输）。
 */
@Service // 声明为 Spring 管理的 Service 组件，Controller 即可注入使用
public class ModelService {

    private final ModelMapper modelMapper;

    /** 构造器注入依赖（推荐方式：字段可设为 final，依赖关系一目了然，便于测试） */
    public ModelService(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    /**
     * 模型列表 + 筛选。
     * 对应 Node 版：
     *   if (vendor)  result = result.filter((m) => m.vendor === vendor)
     *   if (keyword) result = result.filter((m) => `${m.modelName}${m.vendor}`.toLowerCase().includes(kw))
     *
     * 细节对齐：
     *   - StringUtils.hasText(vendor) ≈ if (vendor)：空串/null 都视为"未传"（JS falsy 语义）
     *   - toLowerCase() 大小写不敏感：输入 glm 能同时命中 glm-4.5 与厂商 GLM
     */
    public List<Model> list(String keyword, String vendor) {
        // 全量查询（Mapper 内已按 ORDER BY vendor, id 排好序）
        List<Model> result = modelMapper.findAll();

        // 厂商筛选：精确匹配（如 vendor=DeepSeek、vendor=智谱GLM）
        if (StringUtils.hasText(vendor)) {
            result = result.stream()
                    .filter(m -> m.getVendor().equals(vendor))
                    .toList();
        }

        // 关键字筛选：模型名 + 厂商 拼成大字符串后"包含"匹配（大小写不敏感）
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.toLowerCase();
            result = result.stream()
                    .filter(m -> (m.getModelName() + m.getVendor()).toLowerCase().contains(kw))
                    .toList();
        }
        return result;
    }

    /** 按 id 取模型详情；不存在返回 null（对应 model.service.js 的 getById） */
    public Model getById(String id) {
        return modelMapper.findById(id);
    }
}
