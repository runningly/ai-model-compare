import { favoriteDao } from '../dao/favorite.dao.js'
import { modelDao } from '../dao/model.dao.js'

/** 抛出带状态码的业务错误，由 app.js 统一错误中间件处理 */
function fail(status, message) {
  const err = new Error(message)
  err.status = status
  throw err
}

export const favoriteService = {
  /** 用户收藏的模型 id 列表 */
  list(userId) {
    if (!userId) fail(400, '缺少 userId 参数')
    return favoriteDao.listByUser(userId)
  },

  /** 添加收藏（模型不存在时 404） */
  add(userId, modelId) {
    if (!userId || !modelId) fail(400, 'userId 与 modelId 不能为空')
    if (!modelDao.findById(modelId)) fail(404, '模型不存在')
    favoriteDao.add(userId, modelId)
  },

  /** 取消收藏（删除不存在的记录也视为成功，幂等） */
  remove(userId, modelId) {
    if (!userId || !modelId) fail(400, 'userId 与 modelId 不能为空')
    favoriteDao.remove(userId, modelId)
  },
}
