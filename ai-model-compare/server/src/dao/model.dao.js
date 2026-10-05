/**
 * 模型数据访问层（DAO = Data Access Object）
 * -------------------------------------------------
 * 职责：封装对 models 表的所有 SQL 读写操作，向上层（service）提供
 *       语义化的 JS 对象方法，屏蔽数据库细节。
 *
 * 关键设计：
 *   - db.prepare() 预编译 SQL 语句并缓存复用：执行更快，且参数化传值可防 SQL 注入
 *   - 数据库字段为 snake_case，对外统一转成 camelCase 领域对象，前端直接用
 */
import { db } from './db.js'

/**
 * 数据库行（row）→ 领域对象转换
 * - snake_case 字段名转 camelCase，方便 JS 层使用
 * - price_list / features 在库里是 JSON 字符串，用 JSON.parse 还原为对象 / 数组
 * - free 在库里是 0/1 整数，转成布尔值
 */
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

// 在模块顶层预编译 SQL 语句，只编译一次，之后反复复用
const SELECT_ALL = 'SELECT * FROM models'
const SELECT_BY_ID = 'SELECT * FROM models WHERE id = ?'
/**
 * INSERT OR REPLACE：主键（id）冲突时先删除旧记录再插入新记录，
 * 用于 seed 脚本的幂等写入 —— 无论执行多少次，数据始终保持一致。
 * 使用 @字段名 命名参数绑定对象，避免拼接字符串带来的 SQL 注入风险。
 */
const INSERT = `
  INSERT OR REPLACE INTO models
    (id, model_name, vendor, context_length, max_output, price_list, features, purchase_url, free, remark)
  VALUES
    (@id, @modelName, @vendor, @contextLength, @maxOutput, @priceList, @features, @purchaseUrl, @free, @remark)
`

export const modelDao = {
  /** 查询全部模型，按厂商 + id 排序，保证多次查询返回顺序稳定 */
  findAll() {
    return db.prepare(`${SELECT_ALL} ORDER BY vendor, id`).all().map(rowToModel)
  },

  /** 按 id 查询单个模型；查不到返回 null（由上层据此返回 404） */
  findById(id) {
    const row = db.prepare(SELECT_BY_ID).get(id)
    return row ? rowToModel(row) : null
  },

  /**
   * 批量写入（seed 脚本调用）
   * db.transaction() 开启事务：要么全部成功、要么整体回滚，
   * 避免中途出错导致库里残留"半份"数据。
   */
  insertMany(models) {
    const stmt = db.prepare(INSERT)
    // better-sqlite3 会把传入的函数自动包在 BEGIN / COMMIT 中执行
    const insertTx = db.transaction((list) => {
      for (const m of list) {
        stmt.run({
          id: m.id,
          modelName: m.modelName,
          vendor: m.vendor,
          contextLength: m.contextLength,
          maxOutput: m.maxOutput,
          priceList: JSON.stringify(m.priceList), // 对象序列化成 JSON 字符串入库
          features: JSON.stringify(m.features),
          purchaseUrl: m.purchaseUrl,
          free: m.free ? 1 : 0, // 布尔值 → 0/1
          remark: m.remark ?? null, // undefined 归一化为 null，保证字段可写
        })
      }
    })
    insertTx(models) // 执行事务
  },

  /** 清空 models 表（seed 脚本写入前调用，保证从干净状态开始） */
  clear() {
    db.prepare('DELETE FROM models').run()
  },
}
