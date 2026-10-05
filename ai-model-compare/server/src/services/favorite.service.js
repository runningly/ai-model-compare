/**
 * 收藏业务逻辑层（Service）
 * -------------------------------------------------
 * 职责：参数校验 + 业务规则（如"收藏的模型必须真实存在"）。
 * 出错时抛出带 status 的错误对象，由 app.js 的全局错误中间件统一转成 JSON 响应。
 */
import { favoriteDao } from '../dao/favorite.dao.js'
import { modelDao } from '../dao/model.dao.js'

/**
 * 抛出带 HTTP 状态码的业务错误
 * 原理：Express 约定，抛出的异常 / next(err) 都会传到错误中间件，
 * 中间件根据 err.status 决定返回 4xx（参数或业务错误）还是 500（服务器内部错误）。
 */
function fail(status, message) {
  const err = new Error(message)
  err.status = status // 挂上自定义状态码，供错误中间件识别
  throw err
}

export const favoriteService = {
  /** 查询某用户的收藏 id 列表（userId 必填） */
  list(userId) {
    if (!userId) fail(400, '缺少 userId 参数') // 400 = 请求参数不合法
    return favoriteDao.listByUser(userId)
  },

  /**
   * 添加收藏
   * 业务规则：参数非空 + 目标模型必须真实存在（否则前端会收藏一个不存在的模型）。
   * 全部校验通过后才真正写库。
   */
  add(userId, modelId) {
    if (!userId || !modelId) fail(400, 'userId 与 modelId 不能为空')
    if (!modelDao.findById(modelId)) fail(404, '模型不存在')
    favoriteDao.add(userId, modelId)
  },

  /**
   * 取消收藏
   * SQL 的 DELETE 删除一条不存在的记录不会报错（影响行数为 0），
   * 所以直接删除即可 —— 幂等设计，前端重复点击"取消收藏"也不会出错。
   */
  remove(userId, modelId) {
    if (!userId || !modelId) fail(400, 'userId 与 modelId 不能为空')
    favoriteDao.remove(userId, modelId)
  },
}
