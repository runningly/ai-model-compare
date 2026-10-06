package com.aimodel.compare.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 全局异常处理器 —— 对应 Node 版 app.js 的兜底 404 + 统一错误处理中间件
 * -------------------------------------------------
 * 对比学习（Express 错误中间件 vs Spring @RestControllerAdvice）：
 *   - Express：app.use((err, req, res, next) => {...})，靠"4 个参数"这一约定被识别为错误中间件，
 *     任何地方 throw / next(err) 都会流转到这里，一个函数处理所有错误。
 *   - Spring：@RestControllerAdvice 是"AOP 切面"思想 —— 框架拦截所有 Controller 抛出的异常，
 *     按 @ExceptionHandler 声明的异常类型分发到对应方法（比 Express 的 if/else 更结构化）。
 *
 * 三个方法精确复刻 Node 版 app.js 的三条分支：
 *   1. 业务错误（带 status 的异常）→ 透传状态码与 message
 *   2. 未匹配路由 → 404 "接口不存在"
 *   3. 意外异常 → 500，且 message 不对外暴露（防内部信息泄露）
 */
@RestControllerAdvice // 拦截所有 @RestController 抛出的异常，返回值自动序列化为 JSON
public class GlobalExceptionHandler {

    /** SLF4J 日志门面：对应 console.error，但分级别、带时间戳，输出更规范 */
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 分支 1：业务异常（BusinessException）
     * 对应 Node 版：const status = err.status || 500; 4xx 直接透传 err.message
     * 状态码由抛出方决定（400 参数不合法 / 404 模型不存在），message 原样返回给前端。
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e) {
        return ResponseEntity.status(e.getStatus())
                .body(ApiResponse.error(e.getStatus(), e.getMessage()));
    }

    /**
     * 分支 2：路由未匹配（NoResourceFoundException）
     * 对应 Node 版：app.use((req, res) => res.status(404).json({ code: 404, message: '接口不存在', data: null }))
     *
     * Spring Boot 3.2+ 对"无任何 Controller 匹配"的请求抛出 NoResourceFoundException，
     * 不捕获的话会返回 Spring 默认的错误格式（含 timestamp/path 的 JSON 或 HTML），
     * 这里把它统一转成项目约定的 { code, message, data } JSON。
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NoResourceFoundException e) {
        return ResponseEntity.status(404).body(ApiResponse.error(404, "接口不存在"));
    }

    /**
     * 分支 2.5：请求体不可读 / Content-Type 不支持（如 POST 不带 JSON body）
     * 对应 Node 版 express.json() 解析失败或 req.body 为 undefined 的情况 ——
     * Node 版此时 req.body 为空对象，由 service 校验返回 400"userId 与 modelId 不能为空"；
     * Java 版这里统一按 400 转成中文提示，行为与 Node 版"4xx 透传"原则一致。
     */
    @ExceptionHandler({HttpMessageNotReadableException.class, HttpMediaTypeNotSupportedException.class})
    public ResponseEntity<ApiResponse<Void>> handleUnreadable(Exception e) {
        return ResponseEntity.status(400).body(ApiResponse.error(400, "请求体不是合法的 JSON"));
    }

    /**
     * 分支 3：兜底（任意未预期异常）
     * 对应 Node 版：const status = err.status || 500; message = status >= 500 ? '服务器内部错误' : err.message
     * 完整堆栈只打到服务端日志（log.error ≈ console.error('[server error]', err)），
     * 对外只返回"服务器内部错误"，避免泄露内部实现。
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception e) {
        log.error("[server error]", e); // 服务端留全量堆栈，便于排查
        return ResponseEntity.status(500).body(ApiResponse.error(500, "服务器内部错误"));
    }
}
