import { db } from './db.js'

/** 数据行 → 领域对象（snake_case → camelCase，JSON 字段还原） */
function rowToModel(row) {
  return {
    id: row.id,
    modelName: row.model_name,
    vendor: row.vendor,
    contextLength: row.context_length,
    maxOutput: row.max_output,
    priceList: JSON.parse(row.price_list),
    features: JSON.parse(row.features),
    purchaseUrl: row.purchase_url,
    free: !!row.free,
    remark: row.remark,
  }
}

const SELECT_ALL = 'SELECT * FROM models'
const SELECT_BY_ID = 'SELECT * FROM models WHERE id = ?'
const INSERT = `
  INSERT OR REPLACE INTO models
    (id, model_name, vendor, context_length, max_output, price_list, features, purchase_url, free, remark)
  VALUES
    (@id, @modelName, @vendor, @contextLength, @maxOutput, @priceList, @features, @purchaseUrl, @free, @remark)
`

export const modelDao = {
  findAll() {
    return db.prepare(`${SELECT_ALL} ORDER BY vendor, id`).all().map(rowToModel)
  },

  findById(id) {
    const row = db.prepare(SELECT_BY_ID).get(id)
    return row ? rowToModel(row) : null
  },

  /** 批量写入（事务保证原子性） */
  insertMany(models) {
    const stmt = db.prepare(INSERT)
    const insertTx = db.transaction((list) => {
      for (const m of list) {
        stmt.run({
          id: m.id,
          modelName: m.modelName,
          vendor: m.vendor,
          contextLength: m.contextLength,
          maxOutput: m.maxOutput,
          priceList: JSON.stringify(m.priceList),
          features: JSON.stringify(m.features),
          purchaseUrl: m.purchaseUrl,
          free: m.free ? 1 : 0,
          remark: m.remark ?? null,
        })
      }
    })
    insertTx(models)
  },

  clear() {
    db.prepare('DELETE FROM models').run()
  },
}
