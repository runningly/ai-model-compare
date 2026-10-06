package com.aimodel.compare.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * 数据初始化执行器 —— 对应 Node 版 src/seed/seed.js（npm run seed）
 * -------------------------------------------------
 * 对比学习（独立脚本 vs Profile 条件装配）：
 *   - Node 版：seed 是独立入口文件（node src/seed/seed.js），跑完进程自然结束
 *   - Java 版：本项目只有一个 main 入口，用 Spring Profile 实现同样的效果 ——
 *     @Profile("seed") 表示"只在激活 seed 配置时才创建这个 Bean"，
 *     平时启动（不激活）该 Bean 根本不存在，Web 服务照常运行，互不干扰
 *
 *   运行方式（≈ npm run seed）：
 *     mvn spring-boot:run -Dspring-boot.run.profiles=seed
 *
 * CommandLineRunner：Spring 启动完成后自动回调 run() 一次，适合做启动后初始化。
 */
@Component
@Profile("seed") // 只有 --spring.profiles.active=seed 时生效
public class SeedRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

    private final SeedService seedService;
    private final ApplicationContext context;

    public SeedRunner(SeedService seedService, ApplicationContext context) {
        this.seedService = seedService;
        this.context = context;
    }

    @Override
    public void run(String... args) {
        int count = ModelData.models().size();
        seedService.seed(); // 通过注入的 Bean 调用，@Transactional 才经代理生效
        log.info("已写入 {} 条模型定价数据（data/models.db）", count);

        // seed 是一次性任务：灌完数据立即正常关闭应用（≈ node 脚本执行完退出）
        // SpringApplication.exit 会触发优雅关闭（释放连接池、关闭内嵌 Tomcat），返回码 0
        System.exit(SpringApplication.exit(context));
    }
}
