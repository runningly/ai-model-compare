package com.aimodel.compare.seed;

import com.aimodel.compare.entity.Model;
import com.aimodel.compare.mapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 数据初始化业务 —— 对应 Node 版 model.dao.js 的 insertMany 事务包裹逻辑
 * -------------------------------------------------
 * 对比学习（声明式事务 vs 手动开事务）：
 *   - Node 版：db.transaction((list) => {...}) 手动把一批操作包进 BEGIN / COMMIT
 *   - Java 版：@Transactional 一个注解，AOP 自动包裹 —— 方法正常返回则提交，
 *     抛异常则回滚，要么全部成功、要么整体不生效
 *   注意：@Transactional 必须通过"另一个 Bean 调用"才生效（事务基于代理实现），
 *   所以 SeedRunner 注入本类来调用，而不是把事务方法写在 Runner 自己身上。
 */
@Service
public class SeedService {

    private final ModelMapper modelMapper;

    public SeedService(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    /**
     * 清空 + 批量写入（一个事务内完成）。
     * clear + INSERT OR REPLACE 的组合保证 seed 可反复执行、结果始终一致（幂等）。
     */
    @Transactional // 全部成功才提交；任何一条失败则整个回滚，避免库里残留"半份"数据
    public void seed() {
        // 1. 清空旧数据：每次 seed 从干净状态开始，避免旧数据残留
        modelMapper.clear();

        // 2. 批量写入（INSERT OR REPLACE：主键冲突时覆盖旧记录）
        for (Model m : ModelData.models()) {
            modelMapper.insert(m);
        }
    }
}
