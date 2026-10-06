package com.aimodel.compare.typehandler;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

/**
 * 布尔类型转换器 —— 对应 Node 版的 !!row.free（读）与 m.free ? 1 : 0（写）
 * -------------------------------------------------
 * 背景：SQLite 没有布尔类型，业界惯例用 INTEGER 0/1 表示；
 * Java 实体的 free 字段是 Boolean，读写时需要 0/1 ↔ true/false 转换。
 *
 * 说明：MyBatis 内置的 BooleanTypeHandler 在 xerial 驱动上"恰好"也能工作
 * （驱动底层会把 boolean 映射成 0/1），但显式写出这个转换器：
 *   1. 让"SQLite 用 0/1 存布尔"这一数据库知识点在代码中可见（学习价值）
 *   2. 保证写入的一定是 0/1 整数，不依赖驱动的隐式行为
 */
public class IntegerBooleanTypeHandler extends BaseTypeHandler<Boolean> {

    /** Java → DB：true 写 1，false 写 0 */
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i,
                                     Boolean parameter, JdbcType jdbcType) throws SQLException {
        ps.setInt(i, parameter ? 1 : 0);
    }

    /** DB → Java：0 → false，非 0 → true（对应 !!row.free 的归一化语义） */
    @Override
    public Boolean getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return rs.getInt(columnName) != 0;
    }

    @Override
    public Boolean getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return rs.getInt(columnIndex) != 0;
    }

    @Override
    public Boolean getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return cs.getInt(columnIndex) != 0;
    }
}
