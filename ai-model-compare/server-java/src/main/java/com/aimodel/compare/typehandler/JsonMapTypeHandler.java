package com.aimodel.compare.typehandler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

/**
 * JSON Map 类型转换器 —— 对应 Node 版 rowToModel 里的 JSON.parse(row.price_list) / JSON.stringify(m.priceList)
 * -------------------------------------------------
 * 背景：models.price_list 列在 SQLite 中是 TEXT（JSON 字符串），而 Java 实体字段是
 * Map&lt;String, Object&gt;。两者之间的双向转换逻辑没有魔法，必须有人实现 ——
 * MyBatis 把这种"某类型在某 JDBC 场景下怎么存/怎么读"抽象成 TypeHandler 扩展点。
 *
 * 对比学习：
 *   - Node 版在 DAO 的 rowToModel / insert 两处手写 JSON.parse / JSON.stringify
 *   - Java 版把转换收敛成一个可复用的类，由 MyBatis 在读写该字段时自动调用
 *   这正是"框架扩展点"思想：与其在每个使用处手写，不如声明一次、处处生效。
 *
 * 注意：TypeHandler 由 MyBatis 自行 new 出实例（不受 Spring IoC 容器管理），
 * 所以 ObjectMapper 只能是静态字段，不能用 @Autowired 注入。
 */
public class JsonMapTypeHandler extends BaseTypeHandler<Map<String, Object>> {

    /** Jackson 的 ObjectMapper：线程安全，作为静态单例复用（≈ Node 里直接用全局 JSON 对象） */
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Java → DB：把 Map 序列化成 JSON 字符串写入 price_list 列（≈ JSON.stringify） */
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i,
                                     Map<String, Object> parameter, JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, MAPPER.writeValueAsString(parameter));
        } catch (Exception e) {
            throw new SQLException("priceList 序列化 JSON 失败", e);
        }
    }

    /** DB → Java：把 price_list 列的 JSON 字符串反序列化为 Map（≈ JSON.parse） */
    @Override
    public Map<String, Object> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getString(columnName));
    }

    @Override
    public Map<String, Object> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getString(columnIndex));
    }

    @Override
    public Map<String, Object> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getString(columnIndex));
    }

    /** 反序列化：空值防御（列为 NULL 或空串时返回 null），TypeReference 保留泛型信息 */
    private Map<String, Object> parse(String json) throws SQLException {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new SQLException("priceList 解析 JSON 失败: " + json, e);
        }
    }
}
