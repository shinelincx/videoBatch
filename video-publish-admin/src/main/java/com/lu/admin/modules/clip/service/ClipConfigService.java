package com.lu.admin.modules.clip.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lu.admin.common.exception.BizException;
import com.lu.admin.common.utils.TenantUtils;
import com.lu.admin.modules.clip.entity.ClipConfig;
import com.lu.admin.modules.clip.mapper.ClipConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ClipConfigService extends ServiceImpl<ClipConfigMapper, ClipConfig> {

    private static final String TABLE_NAME = "clip_config";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private volatile boolean tableShapeReady = false;

    public synchronized void ensureTableShape() {
        if (tableShapeReady) {
            return;
        }
        jdbcTemplate.execute("create table if not exists `" + TABLE_NAME + "` (" +
                "`id` bigint not null auto_increment comment '主键ID', " +
                "`code` varchar(64) character set utf8mb4 collate utf8mb4_unicode_ci not null comment '配置代码', " +
                "`name` varchar(100) character set utf8mb4 collate utf8mb4_unicode_ci not null comment '配置名称', " +
                "`version` int not null default 1 comment '配置版本', " +
                "`clip_mode` varchar(64) character set utf8mb4 collate utf8mb4_unicode_ci not null comment '剪辑模式', " +
                "`img_video_position` varchar(32) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '图片视频位置', " +
                "`frame_extraction` tinyint not null default 0 comment '抽帧', " +
                "`cropping` tinyint not null default 0 comment '裁剪', " +
                "`blur` tinyint not null default 0 comment '模糊', " +
                "`shake` tinyint not null default 0 comment '抖动', " +
                "`watermark` tinyint not null default 0 comment '水印', " +
                "`brightness` tinyint not null default 0 comment '亮度', " +
                "`contrast` tinyint not null default 0 comment '对比度', " +
                "`saturation` tinyint not null default 0 comment '饱和度', " +
                "`color_balance` tinyint not null default 0 comment '色彩平衡', " +
                "`gamma` tinyint not null default 0 comment '伽马', " +
                "`vintage_bw` tinyint not null default 0 comment '复古黑白', " +
                "`subtitles` tinyint not null default 0 comment '字幕', " +
                "`danmaku` tinyint not null default 0 comment '弹幕', " +
                "`sticker` tinyint not null default 0 comment '贴纸', " +
                "`prepend_enabled` tinyint not null default 0 comment '片头', " +
                "`append_enabled` tinyint not null default 0 comment '片尾', " +
                "`background_music_enabled` tinyint not null default 0 comment '背景音乐', " +
                "`speed_adjustment_enabled` tinyint not null default 0 comment '速度调整', " +
                "`pitch_enabled` tinyint not null default 0 comment '音调调整', " +
                "`loop_count` int not null default 1 comment '循环次数', " +
                "`default_duration_per_image` decimal(10,2) not null default 3.00 comment '单张图片默认时长', " +
                "`status` tinyint not null default 1 comment '状态：1启用、0禁用', " +
                "`remark` varchar(500) character set utf8mb4 collate utf8mb4_unicode_ci null default null comment '备注', " +
                "`create_time` datetime null default current_timestamp comment '创建时间', " +
                "`update_time` datetime null default null on update current_timestamp comment '更新时间', " +
                "`deleted` tinyint null default 0 comment '删除标识：0正常 1删除', " +
                "`tenant_id` bigint null default null comment '租户标识', " +
                "primary key (`id`), " +
                "key `idx_code` (`code`), " +
                "key `idx_tenant_id` (`tenant_id`)" +
                ") engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci comment='剪辑配置' row_format=Dynamic");
        tableShapeReady = true;
        seedDefaultsIfEmpty();
        fillMissingNames();
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean createConfig(ClipConfig config) {
        ensureTableShape();
        validateAndNormalize(config, false);
        config.setVersion(1);
        if (config.getTenantId() == null) {
            config.setTenantId(TenantUtils.currentTenantId());
        }
        return save(config);
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean updateConfig(ClipConfig config) {
        ensureTableShape();
        validateAndNormalize(config, true);
        config.setVersion(nextVersion(config.getId()));
        if (TenantUtils.currentTenantId() != null) {
            config.setTenantId(TenantUtils.currentTenantId());
        }
        QueryWrapper<ClipConfig> wrapper = TenantUtils.filter(new QueryWrapper<ClipConfig>())
                .eq("id", config.getId());
        return update(config, wrapper);
    }

    private int nextVersion(Long id) {
        QueryWrapper<ClipConfig> wrapper = TenantUtils.filter(new QueryWrapper<ClipConfig>())
                .select("version")
                .eq("id", id)
                .last("limit 1");
        ClipConfig existing = getOne(wrapper);
        if (existing == null) {
            throw new BizException("剪辑配置不存在或无权限");
        }
        Integer version = existing.getVersion();
        return version == null || version < 1 ? 2 : version + 1;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean deleteConfig(Long id) {
        ensureTableShape();
        if (id == null) {
            throw new BizException("配置ID不能为空");
        }
        QueryWrapper<ClipConfig> wrapper = TenantUtils.filter(new QueryWrapper<ClipConfig>())
                .eq("id", id);
        return remove(wrapper);
    }

    public Map<String, Object> configMap() {
        ensureTableShape();
        List<ClipConfig> configs = list(TenantUtils.filter(new QueryWrapper<ClipConfig>())
                .eq("status", 1)
                .orderByAsc("id"));
        Map<String, Object> result = new LinkedHashMap<>();
        for (ClipConfig config : configs) {
            if (hasText(config.getCode())) {
                result.put(config.getCode().trim(), toNestedConfig(config));
            }
        }
        return result;
    }

    public Map<String, Object> toNestedConfig(ClipConfig config) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("version", config.getVersion());

        Map<String, Object> clipMode = new LinkedHashMap<>();
        clipMode.put("mode", config.getClipMode());
        if (hasText(config.getImgVideoPosition())) {
            clipMode.put("img_video_position", config.getImgVideoPosition());
        }
        root.put("clip_mode", clipMode);

        Map<String, Object> videoItems = new LinkedHashMap<>();
        videoItems.put("frame_extraction", enabled(config.getFrameExtraction()));
        videoItems.put("cropping", enabled(config.getCropping()));
        videoItems.put("blur", enabled(config.getBlur()));
        videoItems.put("shake", enabled(config.getShake()));
        videoItems.put("watermark", enabled(config.getWatermark()));
        videoItems.put("brightness", enabled(config.getBrightness()));
        videoItems.put("contrast", enabled(config.getContrast()));
        videoItems.put("saturation", enabled(config.getSaturation()));
        videoItems.put("color_balance", enabled(config.getColorBalance()));
        videoItems.put("gamma", enabled(config.getGamma()));
        videoItems.put("vintage_bw", enabled(config.getVintageBw()));
        root.put("video_items", videoItems);

        Map<String, Object> textItems = new LinkedHashMap<>();
        textItems.put("subtitles", enabled(config.getSubtitles()));
        textItems.put("danmaku", enabled(config.getDanmaku()));
        textItems.put("sticker", enabled(config.getSticker()));
        root.put("text_items", textItems);

        Map<String, Object> affix = new LinkedHashMap<>();
        affix.put("prepend_enabled", enabled(config.getPrependEnabled()));
        affix.put("append_enabled", enabled(config.getAppendEnabled()));
        root.put("affix", affix);

        Map<String, Object> audio = new LinkedHashMap<>();
        audio.put("background_music_enabled", enabled(config.getBackgroundMusicEnabled()));
        audio.put("speed_adjustment_enabled", enabled(config.getSpeedAdjustmentEnabled()));
        audio.put("pitch_enabled", enabled(config.getPitchEnabled()));
        root.put("audio", audio);

        Map<String, Object> repetition = new LinkedHashMap<>();
        repetition.put("loop_count", config.getLoopCount());
        root.put("repetition", repetition);

        Map<String, Object> clipDuration = new LinkedHashMap<>();
        clipDuration.put("default_duration_per_image", config.getDefaultDurationPerImage());
        root.put("clip_duration", clipDuration);
        return root;
    }

    private void validateAndNormalize(ClipConfig config, boolean update) {
        if (config == null) {
            throw new BizException("剪辑配置不能为空");
        }
        if (update && config.getId() == null) {
            throw new BizException("配置ID不能为空");
        }
        if (!hasText(config.getCode())) {
            throw new BizException("配置代码不能为空");
        }
        config.setCode(config.getCode().trim());
        if (!hasText(config.getName())) {
            config.setName(config.getCode());
        } else {
            config.setName(config.getName().trim());
        }
        if (!hasText(config.getClipMode())) {
            config.setClipMode("image-to-video");
        } else {
            config.setClipMode(config.getClipMode().trim());
        }
        if (hasText(config.getImgVideoPosition())) {
            config.setImgVideoPosition(config.getImgVideoPosition().trim());
        } else {
            config.setImgVideoPosition(null);
        }
        if (config.getVersion() == null || config.getVersion() <= 0) {
            config.setVersion(1);
        }
        if (config.getLoopCount() == null || config.getLoopCount() <= 0) {
            config.setLoopCount(1);
        }
        if (config.getDefaultDurationPerImage() == null
                || config.getDefaultDurationPerImage().compareTo(BigDecimal.ZERO) <= 0) {
            config.setDefaultDurationPerImage(new BigDecimal("3.0"));
        }
        if (config.getStatus() == null) {
            config.setStatus(1);
        }
        fillBooleanDefaults(config);
        validateUniqueCode(config, update);
    }

    private void validateUniqueCode(ClipConfig config, boolean update) {
        QueryWrapper<ClipConfig> wrapper = TenantUtils.filter(new QueryWrapper<ClipConfig>())
                .eq("code", config.getCode());
        if (update) {
            wrapper.ne("id", config.getId());
        }
        if (count(wrapper) > 0) {
            throw new BizException("配置代码已存在");
        }
    }

    private void fillBooleanDefaults(ClipConfig config) {
        config.setFrameExtraction(enabled(config.getFrameExtraction()));
        config.setCropping(enabled(config.getCropping()));
        config.setBlur(enabled(config.getBlur()));
        config.setShake(enabled(config.getShake()));
        config.setWatermark(enabled(config.getWatermark()));
        config.setBrightness(enabled(config.getBrightness()));
        config.setContrast(enabled(config.getContrast()));
        config.setSaturation(enabled(config.getSaturation()));
        config.setColorBalance(enabled(config.getColorBalance()));
        config.setGamma(enabled(config.getGamma()));
        config.setVintageBw(enabled(config.getVintageBw()));
        config.setSubtitles(enabled(config.getSubtitles()));
        config.setDanmaku(enabled(config.getDanmaku()));
        config.setSticker(enabled(config.getSticker()));
        config.setPrependEnabled(enabled(config.getPrependEnabled()));
        config.setAppendEnabled(enabled(config.getAppendEnabled()));
        config.setBackgroundMusicEnabled(enabled(config.getBackgroundMusicEnabled()));
        config.setSpeedAdjustmentEnabled(enabled(config.getSpeedAdjustmentEnabled()));
        config.setPitchEnabled(enabled(config.getPitchEnabled()));
    }

    private void seedDefaultsIfEmpty() {
        QueryWrapper<ClipConfig> wrapper = TenantUtils.filter(new QueryWrapper<ClipConfig>());
        if (count(wrapper) > 0) {
            return;
        }
        Long tenantId = TenantUtils.currentTenantId();
        save(defaultImageConfig(tenantId));
        save(defaultReferenceConfig(tenantId));
    }

    private void fillMissingNames() {
        jdbcTemplate.update("update `" + TABLE_NAME + "` set `name` = '图片转视频配置' " +
                "where `code` = 'cfg-img-v2' and (`name` is null or trim(`name`) = '') and ifnull(`deleted`, 0) = 0");
        jdbcTemplate.update("update `" + TABLE_NAME + "` set `name` = '参考视频配置' " +
                "where `code` = 'cfg-ref-v3' and (`name` is null or trim(`name`) = '') and ifnull(`deleted`, 0) = 0");
        jdbcTemplate.update("update `" + TABLE_NAME + "` set `name` = `code` " +
                "where (`name` is null or trim(`name`) = '') and `code` is not null and trim(`code`) <> '' and ifnull(`deleted`, 0) = 0");
    }

    private ClipConfig defaultImageConfig(Long tenantId) {
        return new ClipConfig()
                .setCode("cfg-img-v2")
                .setName("图片转视频配置")
                .setVersion(2)
                .setClipMode("image-to-video")
                .setFrameExtraction(true)
                .setCropping(true)
                .setBlur(true)
                .setShake(true)
                .setWatermark(true)
                .setBrightness(true)
                .setContrast(true)
                .setSaturation(true)
                .setColorBalance(false)
                .setGamma(false)
                .setVintageBw(false)
                .setSubtitles(false)
                .setDanmaku(false)
                .setSticker(true)
                .setPrependEnabled(false)
                .setAppendEnabled(false)
                .setBackgroundMusicEnabled(true)
                .setSpeedAdjustmentEnabled(false)
                .setPitchEnabled(true)
                .setLoopCount(1)
                .setDefaultDurationPerImage(new BigDecimal("3.0"))
                .setStatus(1)
                .setTenantId(tenantId);
    }

    private ClipConfig defaultReferenceConfig(Long tenantId) {
        return new ClipConfig()
                .setCode("cfg-ref-v3")
                .setName("参考视频配置")
                .setVersion(3)
                .setClipMode("reference-video")
                .setImgVideoPosition("after")
                .setFrameExtraction(false)
                .setCropping(false)
                .setBlur(false)
                .setShake(false)
                .setWatermark(false)
                .setBrightness(false)
                .setContrast(false)
                .setSaturation(false)
                .setColorBalance(false)
                .setGamma(false)
                .setVintageBw(false)
                .setSubtitles(true)
                .setDanmaku(true)
                .setSticker(true)
                .setPrependEnabled(true)
                .setAppendEnabled(false)
                .setBackgroundMusicEnabled(true)
                .setSpeedAdjustmentEnabled(true)
                .setPitchEnabled(true)
                .setLoopCount(2)
                .setDefaultDurationPerImage(new BigDecimal("2.0"))
                .setStatus(1)
                .setTenantId(tenantId);
    }

    private boolean enabled(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
