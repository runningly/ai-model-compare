package com.aimodel.compare.common;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

/**
 * 统一响应体 { code, message, data } —— 对应 Node 版所有 res.json({ code, message, data }) 的约定
 * -------------------------------------------------
 * Java 是静态类型语言，"响应长什么样"必须先声明成一个类（而 JS 里是随手写个对象字面量）：
 *   - 泛型 <T> 表示 data 字段的类型由调用方指定：模型列表是 List&lt;Model&gt;，收藏列表是 List&lt;String&gt;，
 *     无数据时是 ApiResponse&lt;Void&gt;（data = null）
 *   - @JsonPropertyOrder 强制 JSON 输出字段顺序为 code → message → data，
 *     与 Node 版 JSON.stringify 按对象字面量的 key 顺序输出保持一致，保证双端 diff 逐字节相同
 */
@JsonPropertyOrder({"code", "message", "data"})
public class ApiResponse<T> {

    /** 0 表示成功；非 0 为错误码（与 HTTP 状态码保持一致） */
    private final int code;

    /** 提示信息 */
    private final String message;

    /** 业务数据；无数据时为 null（对应 Node 版 data: null） */
    private final T data;

    /** 构造器私有：外部只能通过下方两个静态工厂方法创建，保证响应格式全局统一 */
    private ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /** 成功响应：{ code: 0, message: "ok", data: ... } ≈ res.json({ code: 0, message: 'ok', data }) */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(0, "ok", data);
    }

    /** 失败响应：{ code: 状态码, message: 提示, data: null } ≈ res.status(x).json({ code: x, message, data: null }) */
    public static ApiResponse<Void> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    // —— Jackson 序列化时靠 getter 方法读值（无 getter 的字段不会出现在 JSON 里）——
    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }
}
