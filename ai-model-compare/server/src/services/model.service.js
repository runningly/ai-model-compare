/**
 * 模型业务逻辑层（Service）
 * -------------------------------------------------
 * 职责：实现业务规则，组合 DAO 层能力，向上层（routes）提供语义化方法。
 * 当前业务规则比较简单：在内存中对 DAO 查询结果做 keyword / vendor 过滤。
 */
import { modelDao } from '../dao/model.dao.js'

export const modelService = {
  /**
   * 模型列表 + 筛选
   * @param {Object}  [query]          筛选条件（解构带默认值，可整体省略）
   * @param {string}  [query.keyword]  关键字：匹配模型名或厂商，不区分大小写
   * @param {string}  [query.vendor]   厂商名：精确匹配
   * @returns {Array} 过滤后的模型数组
   */
  list({ keyword, vendor } = {}) {
    let result = modelDao.findAll()

    // 厂商筛选：精确匹配（如 vendor=DeepSeek、vendor=智谱GLM）
    if (vendor) {
      result = result.filter((m) => m.vendor === vendor)
    }

    // 关键字筛选：把 模型名 + 厂商 拼成一个大字符串后做"包含"匹配。
    // 统一转小写实现大小写不敏感（如输入 glm 能同时命中 glm-4.5 和厂商 GLM）
    if (keyword) {
      const kw = keyword.toLowerCase()
      result = result.filter((m) => `${m.modelName}${m.vendor}`.toLowerCase().includes(kw))
    }
    return result
  },

  /** 按 id 取模型详情；不存在返回 null */
  getById(id) {
    return modelDao.findById(id)
  },
}
