package com.aimodel.compare.config;

import jakarta.annotation.PostConstruct;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 建表初始化器 —— 对应 Node 版 src/dao/db.js 的 db.exec(`CREATE TABLE IF NOT EXISTS ...`)
 * -------------------------------------------------
 * 为什么用 Java 代码执行 DDL 而不是配置文件？
 *   保持与 Node 版"单文件建表"的形态一致：建表逻辑就在项目里，打开即见，DDL 文本逐字可比。
 *
 * 两条建表语句与 db.js 逐字符一致（含 datetime('now','localtime') 默认值），
 * CREATE TABLE IF NOT EXISTS 保证幂等 —— 表已存在则跳过，应用可反复重启。
 *
 * 执行时机：@PostConstruct = 该 Bean 注入完成后自动执行一次。
 * 数据源由 HikariCP 提供（sqlite-jdbc 驱动，首次连接时若 data/models.db 不存在会自动建库文件）。
 */
@Component
public class SchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    /** 构造器注入：Spring 自动把 JdbcTemplate Bean 传进来（依赖注入的最常见形态） */
    public SchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 表1 models —— AI 模型定价信息表
     *   - id             主键，模型唯一标识（如 'deepseek-chat'）
     *   - model_name     模型显示名
     *   - vendor         厂商
     *   - context_length 上下文长度（单位：K tokens）
     *   - max_output     最大输出长度（单位：K tokens）
     *   - price_list     价格表，JSON 字符串（结构因厂商而异，读取时还原）
     *   - features       特性标签，JSON 数组字符串
     *   - purchase_url   官方购买 / 控制台地址
     *   - free           是否免费：0/1（SQLite 没有布尔类型）
     *   - remark         备注说明
     *
     * 表2 favorites —— 用户收藏表
     *   - user_id    用户标识
     *   - model_id   收藏的模型 id，逻辑上关联 models.id（未建外键约束）
     *   - created_at 收藏时间，默认取数据库当前本地时间
     *   联合主键 (user_id, model_id)：同一用户对同一模型只能收藏一次
     */
    @PostConstruct
    public void init() {
        jdbcTemplate.execute("""
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
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                  user_id    TEXT NOT NULL,
                  model_id   TEXT NOT NULL,
                  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                  PRIMARY KEY (user_id, model_id)
                )
                """);
        // jdbcTemplate.execute 一条一条执行（SQLite JDBC 不支持一次 execute 多条 DDL，
        // Node 版 better-sqlite3 的 db.exec 可以一次跑多句 —— 驱动实现差异，无行为区别）
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('models','favorites')",
                String.class);
        if (tables.size() == 2) {
            System.out.println("✅ 数据表已就绪（models / favorites）");
        }
    }
}
