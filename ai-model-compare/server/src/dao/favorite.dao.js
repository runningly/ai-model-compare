import { db } from './db.js'

export const favoriteDao = {
  /** 某用户收藏的模型 id 列表（按收藏时间倒序） */
  listByUser(userId) {
    const rows = db
      .prepare('SELECT model_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC, model_id')
      .all(userId)
    return rows.map((r) => r.model_id)
  },

  /** 添加收藏（重复收藏直接忽略，天然幂等；created_at 存本地时间） */
  add(userId, modelId) {
    db.prepare(
      "INSERT OR IGNORE INTO favorites (user_id, model_id, created_at) VALUES (?, ?, datetime('now', 'localtime'))"
    ).run(userId, modelId)
  },

  remove(userId, modelId) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND model_id = ?').run(userId, modelId)
  },
}
