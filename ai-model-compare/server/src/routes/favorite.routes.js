import { Router } from 'express'
import { favoriteService } from '../services/favorite.service.js'

export const favoriteRouter = Router()

/** GET /api/favorites?userId=xxx —— 用户收藏的模型 id 列表 */
favoriteRouter.get('/', (req, res, next) => {
  try {
    const data = favoriteService.list(req.query.userId)
    res.json({ code: 0, message: 'ok', data })
  } catch (err) {
    next(err)
  }
})

/** POST /api/favorites  body: { userId, modelId } —— 添加收藏 */
favoriteRouter.post('/', (req, res, next) => {
  try {
    const { userId, modelId } = req.body || {}
    favoriteService.add(userId, modelId)
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/favorites/:modelId?userId=xxx —— 取消收藏 */
favoriteRouter.delete('/:modelId', (req, res, next) => {
  try {
    favoriteService.remove(req.query.userId, req.params.modelId)
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) {
    next(err)
  }
})
