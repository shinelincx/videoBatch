package com.lu.admin.common.utils;

import cn.hutool.http.HttpUtil;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class IPUtil {

    public static String ipFormat(String ip) {
        DecimalFormat df = new DecimalFormat("000");
        String[] ipSplits = ip.split("\\.");
        List<String> ipUnit = new ArrayList<>();
        for (String ips : ipSplits) {
            ipUnit.add(df.format(Integer.parseInt(ips)));
        }
        return ipUnit.stream().collect(Collectors.joining("."));
    }

    public static String getArea(String ip){
        if (ObjectUtils.isEmpty(ip)) {
            return "";
        }
        String ipArea = HttpUtil.get("http://whois.pconline.com.cn/ip.jsp?ip=" + ip);
        if(!StringUtils.isEmpty(ipArea)){
            return ipArea.replaceAll(" ", "").replaceAll("\r", "").replaceAll("\n", "");
        }
        return "";
    }

    public static String getRemoteIp(HttpServletRequest request){
        if(!StringUtils.isEmpty(request.getHeader("X-Real-IP"))){
            return request.getHeader("X-Real-IP");
        }
        return request.getRemoteAddr();
    }

    public static void main(String[] args) {
        System.out.println("ip --> " + getArea("120.36.254.31")
                .replaceAll("\n", ""));
    }
}
