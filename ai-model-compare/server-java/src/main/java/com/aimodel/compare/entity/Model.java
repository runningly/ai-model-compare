package com.aimodel.compare.entity;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.util.List;
import java.util.Map;

/**
 * 模型领域对象 —— 对应 Node 版 dao/model.dao.js 的 rowToModel() 转换结果
 * -------------------------------------------------
 * 对比学习（JS 动态对象 vs Java 静态类）：
 *   - Node 版：rowToModel 手动把 DB 行转成 JS 对象，字段名 camelCase，结构随手定义
 *   - Java 版：必须先声明类（字段 + getter/setter），DB 行 → 对象的转换由 MyBatis 完成
 *
 * 关键设计 —— priceList 为什么是 Map&lt;String, Object&gt; 而不是具体的价格类？
 *   因为各厂商价格结构不统一（DeepSeek 有 peak/offPeak 嵌套对象，免费模型 input/output 为 null）。
 *   JS 里天然用对象承接；Java 的对应物就是 Map&lt;String, Object&gt;：
 *   "键值对结构运行时才确定"的场景，Map 就是 JS 对象的心智映射。
 *
 * @JsonPropertyOrder：锁定 JSON 输出字段顺序，与 Node 版 rowToModel 返回对象的
 * key 顺序（id → modelName → ... → remark）一致，保证双端响应逐字节相同。
 */
@JsonPropertyOrder({"id", "modelName", "vendor", "contextLength", "maxOutput",
        "priceList", "features", "purchaseUrl", "free", "remark"})
public class Model {

    /** 模型唯一标识，主键（如 deepseek-chat） */
    private String id;

    /** 模型显示名（对应 DB 列 model_name） */
    private String modelName;

    /** 厂商（DeepSeek / 智谱GLM / 通义千问...） */
    private String vendor;

    /** 上下文长度，单位 K tokens（对应 context_length） */
    private Integer contextLength;

    /** 最大输出长度，单位 K tokens（对应 max_output） */
    private Integer maxOutput;

    /**
     * 价格表。DB 中存 JSON 字符串，经 JsonMapTypeHandler 还原为 Map。
     * 结构因厂商而异：{input, output, cacheHit?, peak?{input,output}, offPeak?{...}}，
     * 免费模型的 input/output 可能为 null —— 前端按"字段是否存在/是否为 null"做兼容展示。
     */
    private Map<String, Object> priceList;

    /** 特性标签数组。DB 中存 JSON 字符串，经 JsonStringListTypeHandler 还原 */
    private List<String> features;

    /** 官方购买/控制台地址（对应 purchase_url） */
    private String purchaseUrl;

    /** 是否免费。DB 中存 0/1 整数，经 IntegerBooleanTypeHandler 还原为 Boolean */
    private Boolean free;

    /** 备注说明，可为 null */
    private String remark;

    // ———— getter / setter ————
    // Java Bean 规范：通过 getter/setter 读写私有字段（而非 JS 的 obj.prop 直接访问）。
    // MyBatis 写库、Jackson 序列化 JSON 都靠这套方法名约定工作。

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getVendor() {
        return vendor;
    }

    public void setVendor(String vendor) {
        this.vendor = vendor;
    }

    public Integer getContextLength() {
        return contextLength;
    }

    public void setContextLength(Integer contextLength) {
        this.contextLength = contextLength;
    }

    public Integer getMaxOutput() {
        return maxOutput;
    }

    public void setMaxOutput(Integer maxOutput) {
        this.maxOutput = maxOutput;
    }

    public Map<String, Object> getPriceList() {
        return priceList;
    }

    public void setPriceList(Map<String, Object> priceList) {
        this.priceList = priceList;
    }

    public List<String> getFeatures() {
        return features;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }

    public String getPurchaseUrl() {
        return purchaseUrl;
    }

    public void setPurchaseUrl(String purchaseUrl) {
        this.purchaseUrl = purchaseUrl;
    }

    public Boolean getFree() {
        return free;
    }

    public void setFree(Boolean free) {
        this.free = free;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
