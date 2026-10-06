package com.aimodel.compare.common;

/**
 * 业务异常 —— 对应 Node 版 favorite.service.js 的 fail(status, message)
 * -------------------------------------------------
 * Node 版做法：
 *   const err = new Error(message); err.status = status; throw err
 *   给 JS 对象"随手挂"一个 status 属性即可（动态语言的灵活性）。
 *
 * Java 做法：
 *   静态类型语言不能往对象上随意加属性，必须定义一个真正的异常类来"承载" status。
 *   继承 RuntimeException（非受检异常）：方法签名上无需声明 throws，
 *   调用体验与 JS 的 throw 一致 —— 业务代码想抛就抛，抛出后由全局异常处理器统一兜住。
 */
public class BusinessException extends RuntimeException {

    /** 业务错误对应的 HTTP 状态码（对应 Node 版 err.status） */
    private final int status;

    public BusinessException(int status, String message) {
        super(message); // message 存进父类 Throwable，用 getMessage() 取
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
