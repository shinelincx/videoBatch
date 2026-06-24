package com.lu.admin.common.utils;

import lombok.extern.log4j.Log4j2;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * @Description sign参数加解密
 * @Date 2019/1/21 10:53 AM
 */
@Log4j2
public class SignUtil {

    /**
     * 将传参按照ASCII 码字典序排序，并将生成的字符串进行MD5加密
     *
     * @param map
     * @return
     */
    public static String ASCIISort(Map<String, String> map) {
        String result;
        try {
            List<Map.Entry<String, String>> infoIds = new ArrayList<Map.Entry<String, String>>(map.entrySet());
            // 对所有传入参数按照字段名的 ASCII 码从小到大排序（字典序）
            Collections.sort(infoIds, new Comparator<Map.Entry<String, String>>() {
                public int compare(Map.Entry<String, String> o1, Map.Entry<String, String> o2) {
                    return (o1.getKey()).toString().compareTo(o2.getKey());
                }
            });
            // 构造签名键值对的格式
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, String> item : infoIds) {
                if (item.getKey() != null || item.getKey() != "") {
                    String key = item.getKey();
                    String val = item.getValue();
                    if (!(val == "" || val == null)) {
                        sb.append(key + "=" + val + "&");
                    }
                }
            }
            result = sb.toString();
            char last = result.charAt(result.length() - 1);
            if ("&".equals(String.valueOf(last))) {
                result = result.substring(0, result.length() - 1);
            }
        } catch (Exception e) {
            return null;
        }
        return result;
    }

    public static String ObjectASCIISort(Map<String, Object> map) {
        String result;
        try {
            List<Map.Entry<String, Object>> infoIds = new ArrayList<>(map.entrySet());
            // 对所有传入参数按照字段名的 ASCII 码从小到大排序（字典序）
            Collections.sort(infoIds, new Comparator<Map.Entry<String, Object>>() {
                public int compare(Map.Entry<String, Object> o1, Map.Entry<String, Object> o2) {
                    return (o1.getKey()).compareTo(o2.getKey());
                }
            });
            // 构造签名键值对的格式
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, Object> item : infoIds) {
                if (item.getKey() != null || item.getKey() != "") {
                    String key = item.getKey();
                    Object val = item.getValue();
                    if (!(val == "" || val == null)) {
                        sb.append(key + "=" + val + "&");
                    }
                }
            }
            result = sb.toString();
            char last = result.charAt(result.length() - 1);
            if ("&".equals(String.valueOf(last))) {
                result = result.substring(0, result.length() - 1);
            }
        } catch (Exception e) {
            return null;
        }
        return result;
    }

    /**
     * @param str
     * @return 签名结果中字母为小写
     */
    public static String str2md5(String str) {
        return DigestUtils.md5DigestAsHex(str.getBytes(StandardCharsets.UTF_8)).toLowerCase();
    }

    /**
     * @param map 待校验参数
     * @param key 加密key
     * @return 加密后的sign
     */
    public static String getSign(Map<String, String> map, final String key) {
        String appendResult = SignUtil.ASCIISort(map);
        String signTemp = appendResult + "&key=" + key;
        return SignUtil.str2md5(signTemp);
    }


}
