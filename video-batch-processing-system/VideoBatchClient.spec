# -*- mode: python ; coding: utf-8 -*-

import os

vendor_dir = os.path.join(SPECPATH, 'vendor')
ffmpeg_binaries = [
    (os.path.join(vendor_dir, f), '.')
    for f in os.listdir(vendor_dir)
    if f.endswith(('.exe', '.dll'))
]

a = Analysis(
    ['run_gui.py'],
    pathex=['src'],
    binaries=ffmpeg_binaries,
    datas=[],
    hiddenimports=[
        'requests',
        'urllib3',
        'charset_normalizer',
        'certifi',
        'idna',
        'PIL',
        'PIL.Image',
        'cryptography',
        'cryptography.fernet',
        'video_batch',
        'video_batch.gui',
        'video_batch.gui.login_page',
        'video_batch.gui.main_window',
        'video_batch.gui.user_panel_page',
        'video_batch.gui.user_panel_controller',
        'video_batch.gui.task_processor',
        'video_batch.gui.task_item',
        'video_batch.gui.task_list_table',
        'video_batch.gui.app_config',
        'video_batch.gui.login_controller',
        'video_batch.gui.config_sync_worker',
        'video_batch.gui.material_scan_worker',
        'video_batch.gui.material_scanner_v2',
        'video_batch.gui.material_dir_widget',
        'video_batch.gui.media_viewer',
        'video_batch.gui.metadata_parser',
        'video_batch.gui.mock_data',
        'video_batch.auth',
        'video_batch.config_manager',
        'video_batch.config_sync',
        'video_batch.logger',
        'video_batch.token_manager',
        'video_batch.token_store',
        'video_batch.task_status',
        'video_batch.task_queue',
        'video_batch.task_monitor',
        'video_batch.pipeline',
        'video_batch.material_scanner',
        'video_batch.duplicate_detection',
        'video_batch.retry_mechanism',
        'video_batch.reference_video',
        'video_batch.reference_video_concat',
        'video_batch.prepend_append',
        'video_batch.overlay_elements',
        'video_batch.copywriting',
        'video_batch.audio_processor',
        'video_batch.frame_randomizer',
        'video_batch.video_converter',
        'video_batch.randomization_config',
        'video_batch.metadata_config',
        'video_batch.local_config',
        'video_batch.environment',
        'video_batch.structure',
        'video_batch.cleanup',
        'video_batch.offline_tracker',
        'video_batch.retry',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='VideoBatchClient',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=['avcodec*', 'avdevice*', 'avfilter*', 'avformat*', 'avutil*', 'swresample*', 'swscale*', 'ffmpeg*'],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='VideoBatchClient',
)
