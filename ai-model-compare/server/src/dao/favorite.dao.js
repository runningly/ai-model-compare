/**
 * 收藏数据访问层（DAO）
 * 封装 favorites 表的增、删、查操作。
 */
import { db } from './db.js'

export const favoriteDao = {
  /**
   * 查询某用户收藏的模型 id 列表
   * - 按收藏时间倒序（最新收藏在前），时间相同再按 model_id 排序，保证顺序稳定
   * - 返回的是 id 字符串数组，前端拿到后再按 id 拼装模型详情
   */
  listByUser(userId) {
    const rows = db
      .prepare('SELECT model_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC, model_id')
      .all(userId)
    return rows.map((r) => r.model_id)
  },

  /**
   * 添加收藏
   * INSERT OR IGNORE：因为 (user_id, model_id) 是联合主键，
   * 重复收藏时插入会被数据库静默忽略 —— 天然幂等，无需"先查重再插入"两步。
   * created_at 直接取数据库当前本地时间
   */
  add(userId, modelId) {
    db.prepare(
      "INSERT OR IGNORE INTO favorites (user_id, model_id, created_at) VALUES (?, ?, datetime('now', 'localtime'))"
    ).run(userId, modelId)
  },

  /** 取消收藏：按 用户 + 模型 两个条件精确删除一行 */
  remove(userId, modelId) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND model_id = ?').run(userId, modelId)
  },
}
