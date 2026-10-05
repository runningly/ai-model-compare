/**
 * 数据库连接与建表模块
 * ------------------------------------------------
 * 职责：
 *   1. 创建 SQLite 数据库文件（server/data/models.db）
 *   2. 初始化两张核心表：models（模型定价）、favorites（用户收藏）
 *   3. 导出共享的数据库连接对象 db，供各 DAO 模块使用
 *
 * 为什么用 better-sqlite3？
 *   - 同步 API（无需 await / 回调），代码写起来像普通函数调用，逻辑直白
 *   - SQLite 是文件型数据库，零配置，非常适合演示 / 学习项目
 *   - 后续所有 DAO 都通过 `import { db } from './db.js'` 复用同一个连接
 */
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * 计算当前模块所在目录的绝对路径。
 * 注意：Node 的 ESM 模块（"type": "module"）没有 CommonJS 的 __dirname 全局变量，
 * 需要通过 import.meta.url（当前文件的 file:// URL）手动推导。
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 数据库文件放在 server/data 目录下（相对 src/dao 上溯两级：../../data）
const dataDir = path.resolve(__dirname, '../../data')

// 目录不存在则递归创建，避免第一次启动时因目录缺失而报错
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 打开（或自动创建）SQLite 数据库文件，后续所有 SQL 操作都基于这个连接
export const db = new Database(path.join(dataDir, 'models.db'))

/**
 * 建表语句（CREATE TABLE IF NOT EXISTS：表已存在则跳过，脚本可重复执行）
 * -------------------------------------------------------------------
 * 表1 models —— AI 模型定价信息表
 *   - id             主键，模型唯一标识（如 'deepseek-chat'）
 *   - model_name     模型显示名
 *   - vendor         厂商（DeepSeek / 智谱GLM / 通义千问 ...）
 *   - context_length 上下文长度（单位：K tokens，128 即 128K）
 *   - max_output     最大输出长度（单位：K tokens）
 *   - price_list     价格表，存 JSON 字符串（如 {"input":0.8,"output":2}）。
 *                    因为不同厂商价格结构不一致（有缓存价、峰谷价等），
 *                    统一用 JSON 字符串存储，读取时再 JSON.parse 还原
 *   - features       特性标签，JSON 字符串数组（如 ["通用对话","推理"]）
 *   - purchase_url   官方购买 / 控制台地址
 *   - free           是否免费：0/1 整数（SQLite 没有布尔类型，用 0/1 表示）
 *   - remark         备注说明
 *
 * 表2 favorites —— 用户收藏表
 *   - user_id    用户标识（本项目未做登录，由前端自定义传入即可）
 *   - model_id   收藏的模型 id，逻辑上关联 models.id（未建外键约束）
 *   - created_at 收藏时间，默认取数据库当前本地时间
 *   联合主键 (user_id, model_id)：保证同一用户对同一模型只能收藏一次
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS models (
    id             TEXT PRIMARY KEY,
    model_name     TEXT NOT NULL,
    vendor         TEXT NOT NULL,
    context_length INTEGER NOT NULL,
    max_output     INTEGER NOT NULL,
    price_list     TEXT NOT NULL,
    features       TEXT NOT NULL,
    purchase_url   TEXT NOT NULL,
    free           INTEGER DEFAULT 0,
    remark         TEXT
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id    TEXT NOT NULL,
    model_id   TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    PRIMARY KEY (user_id, model_id)
  )
`)
