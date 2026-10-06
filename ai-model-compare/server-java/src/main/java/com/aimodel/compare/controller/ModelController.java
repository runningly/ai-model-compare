package com.aimodel.compare.controller;

import com.aimodel.compare.common.ApiResponse;
import com.aimodel.compare.common.BusinessException;
import com.aimodel.compare.entity.Model;
import com.aimodel.compare.service.ModelService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 模型相关接口 —— 对应 Node 版 src/routes/model.routes.js（modelRouter）
 * -------------------------------------------------
 * 对比学习（声明式路由 vs 中间件挂载）：
 *   - Express：app.use('/api/models', modelRouter) + router.get('/:id', (req, res) => {...})
 *     "路径"与"处理函数"是代码里显式挂载的
 *   - Spring：类上 @RequestMapping("/api/models") 定前缀，方法上 @GetMapping 定方法与路径，
 *     参数用注解声明来源（@RequestParam 查询参数 / @PathVariable 路径参数 / @RequestBody 请求体）
 *
 * 统一响应：每个方法直接 return ApiResponse 对象，
 * Spring 自动序列化成 JSON 并设 Content-Type（≈ res.json({...})）。
 */
@RestController // = @Controller + @ResponseBody：返回值不走模板渲染，直接序列化为 JSON
@RequestMapping("/api/models")
public class ModelController {

    private final ModelService modelService;

    public ModelController(ModelService modelService) {
        this.modelService = modelService;
    }

    /**
     * GET /api/models —— 模型列表（支持筛选）。
     * 对应 Node 版 modelRouter.get('/', (req, res) => {...})
     *
     * @RequestParam(required = false)：参数可不传（不传为 null）≈ req.query 上不存在的 key 是 undefined。
     * 注意 Spring 的 required=false 只允许"整个参数缺失"，传空串仍是 ""（交给 Service 的 hasText 统一判空）。
     */
    @GetMapping
    public ApiResponse<List<Model>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String vendor) {
        return ApiResponse.ok(modelService.list(keyword, vendor)); // { code:0, message:'ok', data:[...] }
    }

    /**
     * GET /api/models/{id} —— 模型详情。
     * 对应 Node 版 modelRouter.get('/:id', ...)，不存在时 404"模型不存在"。
     *
     * 差异说明：Node 版在路由里直接 res.status(404).json({...})；
     * Java 版统一抛 BusinessException，由 GlobalExceptionHandler 转成完全相同的
     * HTTP 404 + {"code":404,"message":"模型不存在","data":null} ——
     * 错误出口收敛到一处，正是 Express"错误中间件"与 Spring"@RestControllerAdvice"的对应关系。
     */
    @GetMapping("/{id}")
    public ApiResponse<Model> getById(@PathVariable String id) {
        Model model = modelService.getById(id);
        if (model == null) {
            throw new BusinessException(404, "模型不存在");
        }
        return ApiResponse.ok(model);
    }
}
