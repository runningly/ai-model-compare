/**
 * 收藏相关路由（路由层）
 * -------------------------------------------------
 * 注意：本项目未实现登录，userId 由前端在每次请求中显式传入：
 *   - 列表 / 取消收藏：通过查询参数 ?userId=xxx 传递
 *   - 添加收藏：通过请求体 body 传递 { userId, modelId }
 */
import { Router } from 'express'
import { favoriteService } from '../services/favorite.service.js'

export const favoriteRouter = Router()

/**
 * GET /api/favorites?userId=xxx —— 查询收藏列表
 * 返回该用户收藏的模型 id 数组（按收藏时间倒序）
 */
favoriteRouter.get('/', (req, res, next) => {
  try {
    const data = favoriteService.list(req.query.userId)
    res.json({ code: 0, message: 'ok', data })
  } catch (err) {
    next(err) // 把错误抛给 app.js 的全局错误中间件统一处理
  }
})

/**
 * POST /api/favorites —— 添加收藏
 * 请求体（JSON）：{ "userId": "u1", "modelId": "deepseek-chat" }
 * 说明：req.body 依赖 app.js 中注册的 express.json() 中间件解析；
 *      重复收藏会被数据库静默忽略（天然幂等）
 */
favoriteRouter.post('/', (req, res, next) => {
  try {
    const { userId, modelId } = req.body || {}
    favoriteService.add(userId, modelId)
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/favorites/:modelId?userId=xxx —— 取消收藏
 * 路径参数 :modelId 指定要取消的模型，查询参数 userId 指定用户
 * 幂等：删除不存在的收藏也返回成功
 */
favoriteRouter.delete('/:modelId', (req, res, next) => {
  try {
    favoriteService.remove(req.query.userId, req.params.modelId)
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) {
    next(err)
  }
})
