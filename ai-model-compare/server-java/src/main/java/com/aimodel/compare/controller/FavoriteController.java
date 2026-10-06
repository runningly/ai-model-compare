package com.aimodel.compare.controller;

import com.aimodel.compare.common.ApiResponse;
import com.aimodel.compare.service.FavoriteService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 收藏相关接口 —— 对应 Node 版 src/routes/favorite.routes.js（favoriteRouter）
 * -------------------------------------------------
 * 注意：本项目未实现登录，userId 由前端在每次请求中显式传入：
 *   - 列表 / 取消收藏：通过查询参数 ?userId=xxx 传递（@RequestParam）
 *   - 添加收藏：通过请求体 body 传递 { userId, modelId }（@RequestBody）
 *
 * 对比学习（try/catch + next(err) vs 直接 throw）：
 *   Node 版路由要自己 try/catch 再 next(err) 把错误交给全局错误中间件；
 *   Spring 的 DispatcherServlet 天然兜住 Controller 抛出的一切异常转给 @RestControllerAdvice，
 *   所以这里只写正常流程，错误处理零代码。
 */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    /**
     * GET /api/favorites?userId=xxx —— 查询收藏列表。
     * 返回该用户收藏的模型 id 数组（按收藏时间倒序）。
     * 缺少 userId → 抛 BusinessException(400, "缺少 userId 参数") → 全局处理器 → HTTP 400。
     */
    @GetMapping
    public ApiResponse<List<String>> list(@RequestParam(required = false) String userId) {
        return ApiResponse.ok(favoriteService.list(userId));
    }

    /**
     * POST /api/favorites —— 添加收藏，请求体 JSON：{ "userId": "u1", "modelId": "deepseek-chat" }
     *
     * 请求体的接收方式对比：
     *   Node 版：express.json() 把 body 解析挂到 req.body，再 `const { userId, modelId } = req.body || {}`
     *   Java 版：@RequestBody 把 JSON 反序列化为 Map，required = false 允许空 body
     *           （空 body / 缺 Content-Type 时 body 为 null，由 Service 判空返回 400，行为与 Node 版一致）
     *   用 Map 而非 DTO 类：结构心智与 JS 的 req.body 一致 —— body.get("userId") ≈ req.body.userId。
     */
    @PostMapping
    public ApiResponse<Void> add(@RequestBody(required = false) Map<String, String> body) {
        String userId = body != null ? body.get("userId") : null;   // ≈ req.body?.userId
        String modelId = body != null ? body.get("modelId") : null;
        favoriteService.add(userId, modelId);
        return ApiResponse.ok(null); // { code:0, message:'ok', data:null }
    }

    /**
     * DELETE /api/favorites/{modelId}?userId=xxx —— 取消收藏。
     * 路径参数指定模型、查询参数指定用户；幂等：删除不存在的收藏也返回成功。
     */
    @DeleteMapping("/{modelId}")
    public ApiResponse<Void> remove(@PathVariable String modelId,
                                     @RequestParam(required = false) String userId) {
        favoriteService.remove(userId, modelId);
        return ApiResponse.ok(null);
    }
}
