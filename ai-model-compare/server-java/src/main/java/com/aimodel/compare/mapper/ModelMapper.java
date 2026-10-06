package com.aimodel.compare.mapper;

import com.aimodel.compare.entity.Model;
import com.aimodel.compare.typehandler.IntegerBooleanTypeHandler;
import com.aimodel.compare.typehandler.JsonMapTypeHandler;
import com.aimodel.compare.typehandler.JsonStringListTypeHandler;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

/**
 * 模型数据访问层 —— 对应 Node 版 src/dao/model.dao.js（export const modelDao = {...}）
 * -------------------------------------------------
 * 对比学习（对象字面量 DAO vs Mapper 接口）：
 *   - Node 版：定义一个对象，方法里 db.prepare(SQL) 手动执行 + rowToModel 手动转换
 *   - Java 版：只声明"接口"（方法签名 + SQL），实现类由 MyBatis 在运行时动态生成
 *     （@MapperScan 扫描 + 动态代理）。这又是"控制反转"：写什么由你定，怎么实现框架包办。
 *
 * SQL 写在注解里，与 Node 版 DAO 顶部预编译的 SQL 常量逐字对照：
 *   - 查询：#{参数} 占位符 ≈ better-sqlite3 的 ? 参数绑定（防 SQL 注入）
 *   - 排序：ORDER BY vendor, id 保证多次查询顺序稳定
 */
@Mapper // 标记这是一个 MyBatis Mapper 接口（配合 Application 上的 @MapperScan 生效）
public interface ModelMapper {

    /**
     * 查询全部模型，按厂商 + id 排序。
     * 对应 Node 版：db.prepare(`${SELECT_ALL} ORDER BY vendor, id`).all().map(rowToModel)
     *
     * @Results 定义"DB 行 → Model 对象"的映射规则（id 起名后可供其他方法用 @ResultMap 复用），
     * 对应 rowToModel 函数的职责：snake_case 列名 → camelCase 属性、JSON 字符串还原、0/1 转布尔。
     * 显式写全每个字段的映射（而非依赖自动映射），就是为了跟 Node 版的转换逻辑一一对照。
     */
    @Select("SELECT * FROM models ORDER BY vendor, id")
    @Results(id = "modelResult", value = {
            @Result(column = "id", property = "id"),
            @Result(column = "model_name", property = "modelName"),
            @Result(column = "vendor", property = "vendor"),
            @Result(column = "context_length", property = "contextLength"),
            @Result(column = "max_output", property = "maxOutput"),
            // price_list 是 JSON 字符串 → 用自定义 TypeHandler 反序列化为 Map（≈ JSON.parse）
            @Result(column = "price_list", property = "priceList",
                    typeHandler = JsonMapTypeHandler.class),
            // features 是 JSON 数组字符串 → List<String>
            @Result(column = "features", property = "features",
                    typeHandler = JsonStringListTypeHandler.class),
            @Result(column = "purchase_url", property = "purchaseUrl"),
            // free 是 0/1 整数 → Boolean
            @Result(column = "free", property = "free",
                    typeHandler = IntegerBooleanTypeHandler.class),
            @Result(column = "remark", property = "remark")
    })
    List<Model> findAll();

    /**
     * 按 id 查询单个模型；查不到返回 null（由上层据此返回 404）。
     * 对应 Node 版：SELECT_BY_ID + db.prepare(...).get(id)，返回 row ? rowToModel(row) : null
     * @ResultMap 复用上面 findAll 定义好的映射规则，等价于两处共用同一个 rowToModel。
     */
    @Select("SELECT * FROM models WHERE id = #{id}")
    @ResultMap("modelResult")
    Model findById(String id);

    /**
     * 写入一条模型（seed 脚本使用）。
     * 对应 Node 版 DAO 顶部的 INSERT 常量 —— INSERT OR REPLACE：主键冲突时删旧插新，幂等。
     * 注意三个特殊字段的 typeHandler 参数：写库时让 MyBatis 用自定义转换器把
     * Map/List/Boolean 序列化成 JSON 字符串 / 0/1（≈ JSON.stringify 与 free ? 1 : 0）。
     *
     * 坑点：内联 typeHandler 必须写"全限定类名"且【不带 .class 后缀】
     * （Java 注解属性里可以写 X.class，但 SQL 字符串里 MyBatis 是拿整个字符串去
     * Class.forName 加载的，写成 X.class 等于找名为"X.class"的类，直接 ClassNotFoundException）。
     */
    @Insert("""
            INSERT OR REPLACE INTO models
              (id, model_name, vendor, context_length, max_output, price_list, features, purchase_url, free, remark)
            VALUES
              (#{id}, #{modelName}, #{vendor}, #{contextLength}, #{maxOutput},
               #{priceList, typeHandler = com.aimodel.compare.typehandler.JsonMapTypeHandler},
               #{features, typeHandler = com.aimodel.compare.typehandler.JsonStringListTypeHandler},
               #{purchaseUrl}, #{free, typeHandler = com.aimodel.compare.typehandler.IntegerBooleanTypeHandler}, #{remark})
            """)
    int insert(Model model);

    /** 清空 models 表（seed 写入前调用）≈ db.prepare('DELETE FROM models').run() */
    @Delete("DELETE FROM models")
    int clear();
}
