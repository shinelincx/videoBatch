package com.lu.admin.modules.publish.service;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PublishAccountServiceTest {

    @Test
    void remainingPublishCountStopsTaskAssignmentWhenDailyLimitIsExceededDespiteActiveCondition() throws Exception {
        Map<String, Object> publishAccount = new HashMap<>();
        publishAccount.put("todayPublishCount", 6);
        publishAccount.put("publishConditionRemainingCount", 2);
        publishAccount.put("publishConditionAllowedCount", 2);
        Map<String, Object> baseAccount = new HashMap<>();
        baseAccount.put("dailyMaxPublishCount", 5);

        assertEquals(0, remainingPublishCount(publishAccount, baseAccount));
    }

    private int remainingPublishCount(Map<String, Object> publishAccount, Map<String, Object> baseAccount) throws Exception {
        Class<?> serviceClass = Class.forName("com.lu.admin.modules.publish.service.PublishAccountService");
        Method method = serviceClass.getDeclaredMethod(
                "remainingPublishCount", Map.class, Map.class);
        method.setAccessible(true);
        return (Integer) method.invoke(serviceClass.getDeclaredConstructor().newInstance(), publishAccount, baseAccount);
    }
}
