package com.aimodel.compare.seed;

import com.aimodel.compare.entity.Model;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 模型演示数据 —— 对应 Node 版 src/data/models.data.js（export const models = [...]）
 * -------------------------------------------------
 * 说明：这是一份"静态快照"，与前端 mock 数据保持一致，真实项目应以官网实时定价为准。
 * 价格单位：元 / 百万 tokens。
 *
 * Java 与 JS 的数据表达差异（本类最有对比价值的地方）：
 *   - JS：数据就是对象字面量，priceList 随手写嵌套对象，null 值直接写
 *   - Java：priceList 的类型是 Map<String, Object>，嵌套结构要用 Map 套 Map 手工构造
 *   - Map.of(...) 不允许 null value，因此"价格全 null"的 glm-4.5-flash 必须用
 *     LinkedHashMap 手动 put —— 这是 JS 开发者写 Java 的经典坑
 *   - LinkedHashMap 保持 key 插入顺序，序列化出的 JSON 字段顺序与 Node 版字面量一致
 */
public final class ModelData {

    private ModelData() {
    } // 工具类禁止实例化

    /** 便捷方法：按 key 顺序构造 Map（保持 JSON 输出顺序与 Node 版一致） */
    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put((String) kv[i], kv[i + 1]);
        }
        return map;
    }

    /** 便捷方法：构造一个 Model 对象 */
    private static Model model(String id, String modelName, String vendor,
                                Integer contextLength, Integer maxOutput,
                                Map<String, Object> priceList, List<String> features,
                                String purchaseUrl, boolean free, String remark) {
        Model m = new Model();
        m.setId(id);
        m.setModelName(modelName);
        m.setVendor(vendor);
        m.setContextLength(contextLength);
        m.setMaxOutput(maxOutput);
        m.setPriceList(priceList);
        m.setFeatures(features);
        m.setPurchaseUrl(purchaseUrl);
        m.setFree(free);
        m.setRemark(remark);
        return m;
    }

    /** 10 条模型定价演示数据（与 Node 版 models.data.js 完全一致） */
    public static List<Model> models() {
        return List.of(
                model("deepseek-chat", "deepseek-chat", "DeepSeek", 128, 8,
                        mapOf(
                                "input", 0.8,
                                "output", 2,
                                "cacheHit", 0.2,
                                "peak", mapOf("input", 0.8, "output", 2),
                                "offPeak", mapOf("input", 0.4, "output", 1)),
                        List.of("通用对话", "缓存命中 0.2 元", "空闲时段 5 折"),
                        "https://platform.deepseek.com", false,
                        "V3.2 系列，非思维链模型"),
                model("deepseek-reasoner", "deepseek-reasoner", "DeepSeek", 128, 64,
                        mapOf(
                                "input", 2,
                                "output", 8,
                                "cacheHit", 0.55,
                                "peak", mapOf("input", 2, "output", 8),
                                "offPeak", mapOf("input", 1, "output", 4)),
                        List.of("深度推理", "思维链展示", "空闲时段 5 折"),
                        "https://platform.deepseek.com", false,
                        "R1 系列，数学 / 代码推理能力强"),
                model("glm-4.5", "glm-4.5", "智谱GLM", 128, 96,
                        mapOf(
                                "input", 0.8,
                                "output", 2,
                                "cacheHit", 0.28),
                        List.of("推理模式", "工具调用", "支持资源包"),
                        "https://open.bigmodel.cn", false,
                        "智谱旗舰模型，Agentic 能力突出"),
                // 注意：免费模型 input/output 为 null。Map.of 禁止 null value，
                // 必须用 LinkedHashMap 手动 put —— 对应 JS 的 { input: null, output: null }
                model("glm-4.5-flash", "glm-4.5-flash", "智谱GLM", 128, 96,
                        nullPrice(),
                        List.of("限时免费", "轻量任务"),
                        "https://open.bigmodel.cn", true,
                        "Flash 系列限免，适合高频轻量调用"),
                model("qwen-max", "qwen-max", "通义千问", 32, 8,
                        mapOf("input", 2.4, "output", 9.6),
                        List.of("旗舰能力", "复杂任务"),
                        "https://bailian.console.aliyun.com", false,
                        "阿里云百炼平台旗舰模型"),
                model("qwen-plus", "qwen-plus", "通义千问", 128, 8,
                        mapOf("input", 0.8, "output", 2),
                        List.of("均衡性价比", "128K 上下文"),
                        "https://bailian.console.aliyun.com", false,
                        "效果与成本均衡的主力模型"),
                model("qwen-flash", "qwen-flash", "通义千问", 128, 8,
                        mapOf("input", 0.3, "output", 0.6),
                        List.of("高吞吐", "超低价"),
                        "https://bailian.console.aliyun.com", false,
                        "追求极致成本的轻量模型"),
                model("doubao-1.5-pro-32k", "doubao-1.5-pro-32k", "豆包", 32, 12,
                        mapOf("input", 0.8, "output", 2),
                        List.of("火山引擎", "稳定可靠"),
                        "https://console.volcengine.com/ark", false,
                        "字节跳动旗舰模型（32K 版本）"),
                model("doubao-1.5-lite-32k", "doubao-1.5-lite-32k", "豆包", 32, 12,
                        mapOf("input", 0.3, "output", 0.6),
                        List.of("轻量低价", "高频场景"),
                        "https://console.volcengine.com/ark", false,
                        "豆包轻量版"),
                model("kimi-k2-0905", "kimi-k2-0905", "Kimi", 256, 8,
                        mapOf("input", 4, "output", 16, "cacheHit", 1),
                        List.of("万亿参数 MoE", "Agentic 强", "256K 上下文"),
                        "https://platform.moonshot.cn", false,
                        "Moonshot 旗舰，与开源版本同款"));
    }

    /** 构造 { input: null, output: null }（Map.of 不接受 null，只能用 LinkedHashMap put） */
    private static Map<String, Object> nullPrice() {
        Map<String, Object> price = new LinkedHashMap<>();
        price.put("input", null);
        price.put("output", null);
        return price;
    }
}
