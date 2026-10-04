import { modelDao } from '../dao/model.dao.js'
import { models } from '../data/models.data.js'

modelDao.clear()
modelDao.insertMany(models)

console.log(`✅ 已写入 ${models.length} 条模型定价数据（data/models.db）`)
