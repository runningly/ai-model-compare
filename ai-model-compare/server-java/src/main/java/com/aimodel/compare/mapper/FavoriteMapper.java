package com.aimodel.compare.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 收藏数据访问层 —— 对应 Node 版 src/dao/favorite.dao.js
 * -------------------------------------------------
 * 三条 SQL 与 Node 版逐字一致，行为语义完全相同：
 *   - 列表：按收藏时间倒序（最新在前），时间相同再按 model_id 排序保证顺序稳定
 *   - 新增：INSERT OR IGNORE + 联合主键 = 重复收藏静默忽略（天然幂等）
 *   - 删除：删不存在的行影响 0 行不报错（天然幂等）
 */
@Mapper
public interface FavoriteMapper {

    /**
     * 查询某用户收藏的模型 id 列表。
     * 对应 Node 版：
     *   SELECT model_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC, model_id
     * 返回 List&lt;String&gt;，前端拿到 id 数组后再拼装详情（两端约定相同）。
     */
    @Select("SELECT model_id FROM favorites WHERE user_id = #{userId} ORDER BY created_at DESC, model_id")
    List<String> listByUser(@Param("userId") String userId);

    /**
     * 添加收藏（INSERT OR IGNORE 幂等写入）。
     * created_at 由 SQLite 的 datetime('now','localtime') 生成，与 Node 版一致。
     */
    @Insert("INSERT OR IGNORE INTO favorites (user_id, model_id, created_at) "
            + "VALUES (#{userId}, #{modelId}, datetime('now', 'localtime'))")
    int add(@Param("userId") String userId, @Param("modelId") String modelId);

    /**
     * 取消收藏：按 用户 + 模型 两个条件精确删除一行。
     * 删除不存在的记录影响行数为 0，不报错 —— 前端重复点击"取消收藏"也安全。
     */
    @Delete("DELETE FROM favorites WHERE user_id = #{userId} AND model_id = #{modelId}")
    int remove(@Param("userId") String userId, @Param("modelId") String modelId);

    // ———— 对比学习：@Param 注解 ————
    // Node 版按参数顺序绑定：.run(userId, modelId)，SQL 里用 ? 占位
    // MyBatis 默认按"参数名"从对象里取值，多参数方法必须用 @Param 显式命名，
    // 否则参数会被包装成 {param1, param2}，SQL 里的 #{userId} 找不到对应值直接报错。
    // （单参数方法如 findById(String id) 则无需此注解）
}
