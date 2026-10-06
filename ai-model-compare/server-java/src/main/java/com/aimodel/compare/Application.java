package com.aimodel.compare;

import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

/**
 * 应用入口（启动类）
 * -------------------------------------------------
 * 对应 Node 版：src/app.js（应用入口：中间件、路由挂载、错误处理）
 *
 * Java 与 Node 最大的组织差异：
 *   - Node：入口是"代码"，手动 app.use() 逐个组装中间件和路由，顺序即执行顺序
 *   - Spring Boot：入口只是一个"启动开关"，真正干活的是"注解 + 组件扫描"——
 *     @SpringBootApplication 会扫描本包及子包下所有带 @RestController/@Service
 *     等注解的类，自动创建对象（称为 Bean）并装配好，无需手动 new / 手动挂载。
 *   这种"控制反转（IoC）/ 依赖注入（DI）"是 Java 后端的核心心智模型：
 *   对象的创建与组装交给框架，开发者只声明"我需要什么"。
 */
@SpringBootApplication // = @Configuration + @ComponentScan + @EnableAutoConfiguration（自动装配中枢）
@MapperScan("com.aimodel.compare.mapper") // 扫描 mapper 包下的接口并生成实现（MyBatis 动态代理，无需手写实现类）
public class Application {

    public static void main(String[] args) throws Exception {
        // 对应 db.js 的 fs.mkdirSync：数据库文件父目录不存在时，SQLite 驱动会直接报错，
        // 而连接池的首次连接发生在 Spring 启动早期 —— 所以必须赶在 SpringApplication.run 之前建目录。
        Files.createDirectories(Path.of("data"));

        // 启动 Spring：初始化 IoC 容器 → 内嵌 Tomcat → 挂载所有 Controller → 监听 8080
        // ≈ Node 版的 app.listen(PORT, ...) + 一整套自动装配流程
        SpringApplication.run(Application.class, args);
        // Spring Boot 3.3 启动成功后默认会打印 "Started Application in x.xxx seconds"
    }
}
