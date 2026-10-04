import { modelDao } from '../dao/model.dao.js'

export const modelService = {
  /** 模型列表，支持 keyword / vendor 筛选 */
  list({ keyword, vendor } = {}) {
    let result = modelDao.findAll()
    if (vendor) {
      result = result.filter((m) => m.vendor === vendor)
    }
    if (keyword) {
      const kw = keyword.toLowerCase()
      result = result.filter((m) => `${m.modelName}${m.vendor}`.toLowerCase().includes(kw))
    }
    return result
  },

  getById(id) {
    return modelDao.findById(id)
  },
}
