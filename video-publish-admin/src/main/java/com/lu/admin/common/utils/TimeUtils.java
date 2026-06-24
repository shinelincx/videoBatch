package com.lu.admin.common.utils;

import org.springframework.util.ObjectUtils;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class TimeUtils {

    public static Map<String, String> getStartAndEndTime(String timeType,String format) {
        Calendar c = Calendar.getInstance();
        SimpleDateFormat sdf = new SimpleDateFormat(format);
        String timeStart = "";
        String timeEnd = "";
        if (!ObjectUtils.isEmpty(timeType)) {
            if ("today".equals(timeType)) {
                timeStart = sdf.format(new Date());
                timeEnd = sdf.format(new Date());
            } else if ("trid".equals(timeType)) {
                c.add(Calendar.DATE, -3);
                timeStart = sdf.format(c.getTime());
                timeEnd = sdf.format(new Date());
            }else if ("sevenDays".equals(timeType)) {
                c.add(Calendar.DATE, -7);
                timeStart = sdf.format(c.getTime());
                timeEnd = sdf.format(new Date());
            } else if ("thirtyDays".equals(timeType)) {
                c.add(Calendar.DATE, -30);
                timeStart = sdf.format(c.getTime());
                timeEnd = sdf.format(new Date());
            }else if ("thisMonth".equals(timeType)) {
                c.set(Calendar.DAY_OF_MONTH, 1);
                timeStart = sdf.format(c.getTime());
                timeEnd = sdf.format(new Date());
            }else if ("lastMonth".equals(timeType)) {
                c.add(Calendar.MONTH, -1);
                c.set(Calendar.DATE, 1);
                timeStart = sdf.format(c.getTime());
                timeEnd = sdf.format(new Date());
            }
        }
        Map<String,String>map = new HashMap<>();
        map.put("timeStart",timeStart);
        map.put("timeEnd",timeEnd);
        return map;
    }


    public static Map<String, String> getStartStrAndEndTimeStrMap(Map<String, Object> params, String format){
        Map<String,String>map = new HashMap<>();
        String timeType =params.get("timeType").toString();
        String timeStart ="";
        String timeEnd ="";

        if ("other".equals(timeType)){
            SimpleDateFormat sdf = new SimpleDateFormat(format);
            if(params.get("timeStart")!= null ){
                timeStart = sdf.format(new Date(Long.valueOf(params.get("timeStart")+"000")));
            }
            if(params.get("timeEnd")!= null){
                timeEnd = sdf.format(new Date(Long.valueOf(params.get("timeEnd")+"000")));
            }
        }else{
            map = TimeUtils.getStartAndEndTime(timeType,format);
            timeStart = map.get("timeStart");
            timeEnd = map.get("timeEnd");
            if("yyyy-MM-dd HH:mm:ss".equals(format)){
                timeStart = timeStart.split(" ")[0]+" 00:00:00";
                timeEnd = timeStart.split(" ")[0]+" 23:59:59";
            }

        }
        map.put("timeStart",timeStart);
        map.put("timeEnd",timeEnd);
        return map;
    }





}
