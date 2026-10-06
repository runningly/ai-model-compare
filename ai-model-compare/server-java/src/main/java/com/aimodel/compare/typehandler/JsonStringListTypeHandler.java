package com.aimodel.compare.typehandler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

/**
 * JSON List 类型转换器 —— 对应 Node 版的 JSON.parse(row.features) / JSON.stringify(m.features)
 * -------------------------------------------------
 * models.features 列在 SQLite 中是 TEXT（形如 ["通用对话","推理"] 的 JSON 数组字符串），
 * Java 实体字段是 List&lt;String&gt;。转换机制同 JsonMapTypeHandler，仅泛型目标不同。
 */
public class JsonStringListTypeHandler extends BaseTypeHandler<List<String>> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Java → DB：List 序列化成 JSON 数组字符串 */
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i,
                                     List<String> parameter, JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, MAPPER.writeValueAsString(parameter));
        } catch (Exception e) {
            throw new SQLException("features 序列化 JSON 失败", e);
        }
    }

    /** DB → Java：JSON 数组字符串反序列化为 List<String> */
    @Override
    public List<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getString(columnName));
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getString(columnIndex));
    }

    @Override
    public List<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getString(columnIndex));
    }

    private List<String> parse(String json) throws SQLException {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            throw new SQLException("features 解析 JSON 失败: " + json, e);
        }
    }
}
