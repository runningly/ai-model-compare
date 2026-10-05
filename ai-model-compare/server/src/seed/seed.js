/**
 * 数据初始化脚本（seed）
 * -------------------------------------------------
 * 运行方式：npm run seed（即 node src/seed/seed.js），
 * 也可在服务启动前手动执行一次，把演示数据灌入 SQLite。
 *
 * 原理：把 data/models.data.js 里的静态演示数据写入 models 表。
 * 流程：先清空旧数据 → 再事务性批量写入。
 * 因为 clear + INSERT OR REPLACE 的组合，脚本可反复执行，数据始终一致。
 */
import { modelDao } from '../dao/model.dao.js'
import { models } from '../data/models.data.js'

// 1. 清空旧数据：保证每次 seed 从干净状态开始，避免旧数据残留造成脏数据
modelDao.clear()

// 2. 批量写入（内部走事务：全部成功或整体回滚）
modelDao.insertMany(models)

console.log(`✅ 已写入 ${models.length} 条模型定价数据（data/models.db）`)
