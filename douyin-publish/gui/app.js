(function () {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  if (platform.includes('Mac') || ua.includes('Macintosh')) {
    document.body.classList.add('platform-mac');
  } else if (platform.includes('Win') || ua.includes('Windows')) {
    document.body.classList.add('platform-win');
  }

  const $ = (id) => document.getElementById(id);

  const fields = {
    serverUrl: $('serverUrl'),
    grpcPort: $('grpcPort'),
    publishDir: $('publishDir'),
    serverAccount: $('serverAccount'),
    serverPassword: $('serverPassword'),
    publishConcurrency: $('publishConcurrency'),
  };

  const statusBadge = $('statusBadge');
  const logPanel = $('logPanel');
  const controlHint = $('controlHint');
  const btnSelectPublishDir = $('btnSelectPublishDir');

  let saveTimer = null;
  let logStream = null;

  const statusLabels = {
    '离线': '离线',
    '待机': '待机',
    '运行中': '运行中',
    '暂停中': '暂停中',
  };

  function appendLog(entry) {
    const div = document.createElement('div');
    div.className = `log-line ${entry.level || 'info'}`;
    div.textContent = `[${entry.time}] ${entry.text}`;
    logPanel.appendChild(div);
    if (logPanel.childNodes.length > 2000) {
      logPanel.removeChild(logPanel.firstChild);
    }
    logPanel.scrollTop = logPanel.scrollHeight;
  }

  function clearLogPanel() {
    logPanel.innerHTML = '';
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    if (!json.ok && json.message) throw new Error(json.message);
    return json;
  }

  function collectConfig() {
    return {
      serverUrl: fields.serverUrl.value.trim(),
      grpcPort: Number(fields.grpcPort.value) || 9090,
      publishDir: fields.publishDir.value.trim(),
      serverAccount: fields.serverAccount.value.trim(),
      serverPassword: fields.serverPassword.value,
      publishConcurrency: Number(fields.publishConcurrency.value) || 10,
    };
  }

  function fillConfig(data) {
    fields.serverUrl.value = data.serverUrl || '';
    fields.grpcPort.value = data.grpcPort || 9090;
    fields.publishDir.value = data.publishDir || '';
    fields.serverAccount.value = data.serverAccount || '';
    fields.serverPassword.value = data.serverPassword || '';
    fields.publishConcurrency.value = data.publishConcurrency || 10;
  }

  function fillConfigIfUnchanged(data, submitted) {
    Object.entries(fields).forEach(([key, field]) => {
      if (document.activeElement === field) return;
      if (field.value !== submitted[key]) return;

      if (key === 'grpcPort') {
        field.value = data[key] || 9090;
      } else if (key === 'publishConcurrency') {
        field.value = data[key] || 10;
      } else {
        field.value = data[key] || '';
      }
    });
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        const submitted = collectConfig();
        const res = await api('/api/config', {
          method: 'POST',
          body: JSON.stringify(submitted),
        });
        fillConfigIfUnchanged(res.data, submitted);
        controlHint.textContent = '配置已自动保存';
      } catch (e) {
        controlHint.textContent = `保存失败: ${e.message}`;
      }
    }, 400);
  }

  async function selectPublishDir() {
    const originalText = btnSelectPublishDir.textContent;
    btnSelectPublishDir.disabled = true;
    btnSelectPublishDir.textContent = '选择中';
    controlHint.textContent = '请选择发布目录';

    try {
      const res = await api('/api/dialog/select-directory', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (res.data?.canceled) {
        controlHint.textContent = '已取消选择发布目录';
        return;
      }

      if (res.data?.path) {
        fields.publishDir.value = res.data.path;
        scheduleSave();
        controlHint.textContent = '已选择发布目录，正在保存';
      }
    } catch (e) {
      controlHint.textContent = `选择目录失败: ${e.message}`;
    } finally {
      btnSelectPublishDir.disabled = false;
      btnSelectPublishDir.textContent = originalText;
    }
  }

  function updateStatusBadge(state) {
    const label = statusLabels[state.status] || state.status || '待机';
    let text = label;
    if (state.connecting) text = '连接中…';
    else if (!state.connected && state.status === '待机') text = '未连接';

    statusBadge.textContent = text;
    statusBadge.className = 'status-badge';
    if (state.connecting) statusBadge.classList.add('connecting');
    else if (state.status === '运行中') statusBadge.classList.add('running');
    else if (state.status === '暂停中') statusBadge.classList.add('paused');

    if (state.connected) {
      controlHint.textContent = `已连接 ${state.apiBaseUrl || ''}`;
    }
  }

  async function refreshStatus() {
    try {
      const res = await api('/api/status');
      updateStatusBadge(res.data);
    } catch { /* ignore */ }
  }

  async function loadConfig() {
    const res = await api('/api/config');
    fillConfig(res.data);
  }

  async function loadRecentLogs() {
    try {
      const res = await api('/api/logs/recent?limit=400');
      clearLogPanel();
      res.data.forEach(appendLog);
    } catch { /* ignore */ }
  }

  function connectLogStream() {
    if (logStream) logStream.close();
    logStream = new EventSource('/api/logs/stream');
    logStream.onmessage = (ev) => {
      try {
        appendLog(JSON.parse(ev.data));
      } catch { /* ignore */ }
    };
    logStream.onerror = () => {
      logStream.close();
      setTimeout(connectLogStream, 3000);
    };
  }

  async function control(action) {
    try {
      const res = await api('/api/control', {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      if (res.data?.status) updateStatusBadge(res.data.status);
      else await refreshStatus();
    } catch (e) {
      controlHint.textContent = `操作失败: ${e.message}`;
    }
  }

  Object.values(fields).forEach((el) => {
    el.addEventListener('input', scheduleSave);
    el.addEventListener('change', scheduleSave);
  });

  $('btnStart').addEventListener('click', () => control('start'));
  $('btnPause').addEventListener('click', () => control('pause'));
  $('btnResume').addEventListener('click', () => control('resume'));
  $('btnStop').addEventListener('click', () => control('stop'));
  $('btnClearLog').addEventListener('click', clearLogPanel);
  btnSelectPublishDir.addEventListener('click', selectPublishDir);

  loadConfig()
    .then(() => loadRecentLogs())
    .then(() => connectLogStream())
    .then(() => refreshStatus());

  setInterval(refreshStatus, 5000);
})();
