package com.aimodel.compare.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 跨域配置 —— 对应 Node 版 app.js 的 app.use(cors())
 * -------------------------------------------------
 * 浏览器同源策略下，H5 前端（如 localhost:5173）请求后端（localhost:8080）属于跨域，
 * 必须由后端在响应头声明"允许谁访问"。
 *
 * 对比学习：
 *   - Express：引入 cors 中间件包，一行 app.use(cors()) 默认放行所有来源
 *   - Spring：实现 WebMvcConfigurer 的 addCorsMappings 方法做同样的事（无需额外依赖）
 *   两边默认都允许跨域但不带 cookie（allowCredentials 默认 false），行为一致。
 */
@Configuration // 声明这是一个配置类，其中的回调会被框架在启动时调用
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")            // 对所有接口生效（≈ cors() 不限路径）
                .allowedOriginPatterns("*")   // 允许任意来源（≈ cors() 默认 Access-Control-Allow-Origin: *）
                .allowedMethods("*")          // 允许所有 HTTP 方法（GET/POST/DELETE...）
                .allowedHeaders("*");         // 允许所有请求头（含 Content-Type: application/json）
    }
}
