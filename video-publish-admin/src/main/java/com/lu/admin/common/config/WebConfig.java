package com.lu.admin.common.config;

import com.lu.admin.common.interceptor.LoggerValidateInterceptor;
import com.lu.admin.common.interceptor.ReqParamInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String[] API_DOC_PATHS = {
            "/v3/api-docs/**",
            "/v3/api-docs.yaml",
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/swagger-resources/**",
            "/webjars/**"
    };

    @Autowired
    private ReqParamInterceptor reqParamInterceptor;
    @Autowired
    private LoggerValidateInterceptor loggerValidateInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 参数校验
        registry.addInterceptor(reqParamInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(API_DOC_PATHS);
        registry.addInterceptor(loggerValidateInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(API_DOC_PATHS);
    }

    //解决跨域
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration conf = new CorsConfiguration();
        conf.addAllowedHeader("*");
        conf.addAllowedMethod("*");
        conf.addAllowedOrigin("*");
        conf.setAllowCredentials(true);
        conf.setMaxAge(3600L);
        conf.addExposedHeader("set-cookie");
        conf.addExposedHeader("access-control-allow-headers");
        conf.addExposedHeader("access-control-allow-methods");
        conf.addExposedHeader("access-control-allow-origin");
        conf.addExposedHeader("access-control-max-age");
        conf.addExposedHeader("X-Frame-Options");
        conf.addExposedHeader("biu-token");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", conf); // 4 对接口配置跨域设置
        return new CorsFilter(source);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/static/*").addResourceLocations("classpath:/static/");
    }


}
