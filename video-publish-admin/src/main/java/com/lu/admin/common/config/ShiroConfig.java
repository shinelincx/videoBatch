package com.lu.admin.common.config;

import com.lu.admin.common.shiro.ShiroAuthFilter;
import com.lu.admin.common.shiro.UserRealm;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.spring.web.config.DefaultShiroFilterChainDefinition;
import org.apache.shiro.spring.web.config.ShiroFilterChainDefinition;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.servlet.Filter;
import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class ShiroConfig {

    @Bean
    public Realm realm() {
        return new UserRealm();
    }

    @Bean
    public ShiroFilterFactoryBean shiroFilterFactoryBean(@Autowired DefaultWebSecurityManager securityManager) {
        ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
        shiroFilterFactoryBean.setSecurityManager(securityManager);

        Map<String, Filter> filters = new LinkedHashMap<>();
        filters.put("authc", new ShiroAuthFilter());
        shiroFilterFactoryBean.setFilters(filters);

        shiroFilterFactoryBean.setFilterChainDefinitionMap(shiroFilterChainDefinition().getFilterChainMap());

        return shiroFilterFactoryBean;
    }

    @Bean
    public static DefaultAdvisorAutoProxyCreator getDefaultAdvisorAutoProxyCreator() {
        DefaultAdvisorAutoProxyCreator creator = new DefaultAdvisorAutoProxyCreator();
        creator.setUsePrefix(true);
        return creator;
    }

    @Bean
    public ShiroFilterChainDefinition shiroFilterChainDefinition() {
        DefaultShiroFilterChainDefinition chain = new DefaultShiroFilterChainDefinition();
        chain.addPathDefinition("/auth/login", "anon");
        chain.addPathDefinition("/auth/logout", "anon");
        chain.addPathDefinition("/page/401", "anon");
        chain.addPathDefinition("/page/403", "anon");
        chain.addPathDefinition("/page/index", "anon");
        chain.addPathDefinition("/macau/*", "anon");
        chain.addPathDefinition("/v3/api-docs/**", "anon");
        chain.addPathDefinition("/v3/api-docs.yaml", "anon");
        chain.addPathDefinition("/swagger-ui.html", "anon");
        chain.addPathDefinition("/swagger-ui/**", "anon");
        chain.addPathDefinition("/swagger-resources/**", "anon");
        chain.addPathDefinition("/webjars/**", "anon");

        chain.addPathDefinition("/**", "authc");
        return chain;
    }
}
