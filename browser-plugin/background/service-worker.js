const ADMIN_SESSION_KEY = "adminSession";
const CATEGORY_TREE_KEY = "adminCategoryTree";
const SELECTED_CATEGORY_KEY = "selectedProductCategory";
const DOWNLOAD_DIRECTORY_KEY = "downloadDirectory";
const PUBLISH_DIRECTORY_KEY = "publishDirectory";
const PUBLISH_DIRECTORY_FILE_INDEX_KEY = "publishDirectoryFileIndex";
const DOWNLOAD_DIRECTORY_DEFAULT_MIGRATED_KEY = "downloadDirectoryDefaultMigrated";
const PUBLISH_DIRECTORY_DEFAULT_MIGRATED_KEY = "publishDirectoryDefaultMigrated";
const TARGET_DOMAIN_KEY = "targetDomain";
const DEFAULT_DOWNLOAD_DIRECTORY = "";
const LEGACY_DEFAULT_DOWNLOAD_DIRECTORY = "百应选品";
const DEFAULT_TARGET_DOMAIN = "buyin.jinritemai.com";
const CREATOR_UPLOAD_URL = "https://creator.douyin.com/creator-micro/content/upload";
const CREATOR_MICRO_URL_PREFIX = "https://creator.douyin.com/creator-micro";
const CREATOR_UPLOAD_INPUT_SELECTOR = '[class^="container-drag-"] input';
const CREATOR_TITLE_INPUT_SELECTOR = '.semi-input.semi-input-default[placeholder^="填写作品标题"]';
const DIRECTORY_HANDLE_DB = "browser-plugin-directory-handles";
const DIRECTORY_HANDLE_STORE = "handles";
const PUBLISH_DIRECTORY_HANDLE_KEY = "publishDirectory";
const SIGN_KEY = "s.0wl?.i_s43$i1_";
const SESSION_EXPIRED_CODE = 4433;
const FAVORITE_CHECK_CACHE_TTL = 15000;
const favoriteCheckCache = new Map();

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === "install") {
    chrome.storage.local.set({
      installedAt: new Date().toISOString(),
      adminBaseUrl: "http://127.0.0.1:8080",
      [DOWNLOAD_DIRECTORY_KEY]: DEFAULT_DOWNLOAD_DIRECTORY,
      [TARGET_DOMAIN_KEY]: DEFAULT_TARGET_DOMAIN
    });
  }
  chrome.storage.local.get([PUBLISH_DIRECTORY_KEY, PUBLISH_DIRECTORY_DEFAULT_MIGRATED_KEY], store => {
    migrateDefaultDownloadDirectory();
    if (!store[PUBLISH_DIRECTORY_DEFAULT_MIGRATED_KEY]) {
      chrome.storage.local.set({
        [PUBLISH_DIRECTORY_DEFAULT_MIGRATED_KEY]: true,
        ...(store[PUBLISH_DIRECTORY_KEY] === "待发布" ? { [PUBLISH_DIRECTORY_KEY]: "" } : {})
      });
    }
  });
  injectContentScriptIntoExistingTabs();
});

chrome.runtime.onStartup.addListener(() => {
  injectContentScriptIntoExistingTabs();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({
      ok: true,
      tabId: sender.tab?.id || null
    });
  }

  if (message?.type === "ADMIN_STATUS") {
    getAdminStatus()
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "ADMIN_LOGIN") {
    adminLogin(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "ADMIN_LOAD_CATEGORIES") {
    loadAndStoreCategories()
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "SAVE_SELECTED_CATEGORY") {
    saveSelectedCategory(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "SAVE_DOWNLOAD_DIRECTORY") {
    saveDownloadDirectory(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "SAVE_PUBLISH_DIRECTORY") {
    savePublishDirectory(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "SAVE_TARGET_DOMAIN") {
    saveTargetDomain(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "SAVE_ADMIN_BASE_URL") {
    saveAdminBaseUrl(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "CHECK_PUBLISH_READY") {
    checkPublishReady(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }

  if (message?.type === "CHECK_FAVORITE_PRODUCT") {
    checkFavoriteProduct(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error, { favorited: false })));
    return true;
  }

  if (message?.type === "DOWNLOAD_FAVORITE_PRODUCT") {
    downloadFavoriteProduct(message.payload)
      .then(result => sendResponse(result))
      .catch(error => {
        sendResponse(errorResponse(error));
      });
    return true;
  }

  if (message?.type === "DOWNLOAD_PRODUCT_VIDEOS") {
    downloadProductVideos(message.payload)
      .then(result => sendResponse(result))
      .catch(error => {
        sendResponse(errorResponse(error));
      });
    return true;
  }

  if (message?.type === "OPEN_CREATOR" || message?.type === "OPEN_CREATOR_WITH_COOKIE") {
    openCreator(message.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse(errorResponse(error)));
    return true;
  }
});

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function storageSet(values) {
  return new Promise(resolve => chrome.storage.local.set(values, resolve));
}

async function migrateDefaultDownloadDirectory() {
  const store = await storageGet([DOWNLOAD_DIRECTORY_KEY, DOWNLOAD_DIRECTORY_DEFAULT_MIGRATED_KEY]);
  if (store[DOWNLOAD_DIRECTORY_DEFAULT_MIGRATED_KEY]) {
    return store[DOWNLOAD_DIRECTORY_KEY];
  }
  const values = { [DOWNLOAD_DIRECTORY_DEFAULT_MIGRATED_KEY]: true };
  if (store[DOWNLOAD_DIRECTORY_KEY] === LEGACY_DEFAULT_DOWNLOAD_DIRECTORY) {
    values[DOWNLOAD_DIRECTORY_KEY] = "";
  }
  await storageSet(values);
  return Object.prototype.hasOwnProperty.call(values, DOWNLOAD_DIRECTORY_KEY)
    ? values[DOWNLOAD_DIRECTORY_KEY]
    : store[DOWNLOAD_DIRECTORY_KEY];
}

function openDirectoryHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DIRECTORY_HANDLE_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DIRECTORY_HANDLE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("打开发布目录授权缓存失败"));
  });
}

async function directoryHandleStore(mode, callback) {
  const db = await openDirectoryHandleDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DIRECTORY_HANDLE_STORE, mode);
    const store = transaction.objectStore(DIRECTORY_HANDLE_STORE);
    const request = callback(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("读取发布目录授权缓存失败"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("发布目录授权缓存失败"));
    };
  });
}

function getPublishDirectoryHandle() {
  return directoryHandleStore("readonly", store => store.get(PUBLISH_DIRECTORY_HANDLE_KEY));
}

function windowsCreate(details) {
  return new Promise((resolve, reject) => {
    chrome.windows.create(details, createdWindow => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(createdWindow);
    });
  });
}

function windowsUpdate(windowId, details) {
  return new Promise((resolve, reject) => {
    chrome.windows.update(windowId, details, updatedWindow => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(updatedWindow);
    });
  });
}

function tabsQuery(details) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(details, tabs => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(tabs || []);
    });
  });
}

function tabsGet(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, tab => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(tab);
    });
  });
}

function tabsUpdate(tabId, details) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, details, tab => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(tab);
    });
  });
}

function tabsRemove(tabId) {
  return new Promise(resolve => {
    chrome.tabs.remove(tabId, () => {
      const error = chrome.runtime.lastError;
      resolve({
        ok: !error,
        error: error?.message || ""
      });
    });
  });
}

function downloadsDownload(details) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(details, downloadId => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(downloadId);
    });
  });
}

function downloadsSearch(query) {
  return new Promise((resolve, reject) => {
    chrome.downloads.search(query, items => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(items || []);
    });
  });
}

function downloadsRemoveFile(downloadId) {
  return new Promise(resolve => {
    chrome.downloads.removeFile(downloadId, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

function downloadsErase(query) {
  return new Promise(resolve => {
    chrome.downloads.erase(query, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

function debuggerAttach(target, version) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach(target, version, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

function debuggerDetach(target) {
  return new Promise(resolve => {
    chrome.debugger.detach(target, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

function debuggerSendCommand(target, command, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand(target, command, params, result => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result || {});
    });
  });
}

function scriptingExecuteScript(details) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(details, results => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(results || []);
    });
  });
}

function isInjectableTabUrl(url) {
  return /^https?:\/\//i.test(String(url || ""));
}

function injectContentScriptIntoExistingTabs() {
  if (!chrome.tabs?.query || !chrome.scripting?.executeScript) {
    return;
  }

  chrome.tabs.query({}, tabs => {
    (tabs || []).forEach(tab => {
      if (!tab.id || !isInjectableTabUrl(tab.url)) {
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/content-script.js"]
      }, () => {
        void chrome.runtime.lastError;
      });
    });
  });
}

injectContentScriptIntoExistingTabs();

function errorResponse(error, extra = {}) {
  return {
    ok: false,
    ...extra,
    error: String(error?.message || error),
    code: error?.code || null,
    sessionExpired: Boolean(error?.sessionExpired)
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function publishItemsFromPayload(payload = {}) {
  const productTitles = Array.isArray(payload.productTitles) ? payload.productTitles : [];
  const items = [];
  const seen = new Set();
  (Array.isArray(payload.productIds) ? payload.productIds : []).forEach((value, index) => {
    const productId = String(value || "").trim();
    if (!productId || seen.has(productId)) {
      return;
    }
    seen.add(productId);
    items.push({
      productId,
      productTitle: String(productTitles[index] || "").trim()
    });
  });
  return items;
}

function payloadForPublishItem(payload = {}, item = {}) {
  return {
    ...payload,
    productIds: item.productId ? [item.productId] : [],
    productTitles: item.productTitle ? [item.productTitle] : []
  };
}

async function ensureDirectoryReadPermission(handle) {
  if (!handle) {
    throw new Error("请先在插件面板点击“发布目录”的选择按钮授权目录");
  }
  if (!handle.queryPermission) {
    return;
  }
  const options = { mode: "readwrite" };
  if (await handle.queryPermission(options) === "granted") {
    return;
  }
  try {
    if (handle.requestPermission && await handle.requestPermission(options) === "granted") {
      return;
    }
  } catch (_error) {
    // Background workers usually cannot show permission prompts.
  }
  throw new Error("发布目录授权不可用，请在插件面板重新点击“发布目录”的选择按钮");
}

async function collectMp4FilesFromDirectory(directoryHandle, productId, pathSegments = [], files = []) {
  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === "file" && /\.mp4$/i.test(name)) {
      files.push({
        productId,
        pathSegments: [...pathSegments, name]
      });
      continue;
    }
    if (handle.kind === "directory") {
      await collectMp4FilesFromDirectory(handle, productId, [...pathSegments, name], files);
    }
  }
  return files;
}

async function collectPublishMp4FilesByHandle(productIds) {
  const directoryHandle = await getPublishDirectoryHandle();
  await ensureDirectoryReadPermission(directoryHandle);

  const files = [];
  const missing = [];
  for (const productId of productIds) {
    const productFolder = sanitizePathSegment(productId, productId);
    try {
      const productDirectory = await directoryHandle.getDirectoryHandle(productFolder);
      const productFiles = await collectMp4FilesFromDirectory(productDirectory, productId, [productFolder], []);
      if (productFiles.length === 0) {
        missing.push(productId);
      }
      files.push(...productFiles);
    } catch (_error) {
      missing.push(productId);
    }
  }

  if (missing.length > 0) {
    throw new Error(`未找到商品ID文件夹或mp4：${missing.join("、")}`);
  }
  if (files.length === 0) {
    throw new Error("发布目录下未找到可上传的mp4文件");
  }
  return files;
}

function dirname(path) {
  const text = String(path || "");
  const index = Math.max(text.lastIndexOf("/"), text.lastIndexOf("\\"));
  return index >= 0 ? text.slice(0, index) : "";
}

function pathSeparator(path) {
  return String(path || "").includes("\\") ? "\\" : "/";
}

function joinAbsolutePath(basePath, segments) {
  const separator = pathSeparator(basePath);
  const base = String(basePath || "").replace(/[\\/]+$/g, "");
  return [base, ...segments].filter(Boolean).join(separator);
}

async function waitForDownloadComplete(downloadId, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const items = await downloadsSearch({ id: downloadId });
    const item = items[0];
    if (item?.state === "complete") {
      return;
    }
    if (item?.state === "interrupted") {
      throw new Error(item.error || "获取发布目录路径失败");
    }
    await sleep(100);
  }
  throw new Error("获取发布目录路径超时");
}

async function resolvePublishDirectoryAbsolutePath(directory) {
  const probeName = `browser-plugin-upload-probe-${Date.now()}.txt`;
  const filename = [directory, probeName].filter(Boolean).join("/");
  const downloadId = await downloadsDownload({
    url: `data:text/plain,${encodeURIComponent("upload path probe")}`,
    filename,
    conflictAction: "overwrite",
    saveAs: false
  });
  try {
    await waitForDownloadComplete(downloadId);
    const items = await downloadsSearch({ id: downloadId });
    const absoluteFilename = items[0]?.filename || "";
    const absoluteDirectory = dirname(absoluteFilename);
    if (!absoluteDirectory) {
      throw new Error("无法解析发布目录的本地路径");
    }
    return absoluteDirectory;
  } finally {
    await downloadsRemoveFile(downloadId);
    await downloadsErase({ id: downloadId });
  }
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeLocalPath(path) {
  return String(path || "").replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/g, "");
}

function localPathRegex(path) {
  const leadingSlash = /^[\\/]/.test(String(path || ""));
  const segments = String(path || "")
    .split(/[\\/]+/g)
    .filter(Boolean)
    .map(escapeRegExp);
  return `${leadingSlash ? "[\\\\/]" : ""}${segments.join("[\\\\/]")}`;
}

async function findDownloadedProductMp4Paths(absoluteDirectory, productId) {
  const productFolder = sanitizePathSegment(productId, productId);
  const filenameRegex = `^${localPathRegex(absoluteDirectory)}[\\\\/]${escapeRegExp(productFolder)}[\\\\/].*\\.mp4$`;
  const items = await downloadsSearch({
    state: "complete",
    filenameRegex
  });
  const prefix = `${normalizeLocalPath(absoluteDirectory)}/${productFolder}/`;
  const paths = (items || [])
    .map(item => item.filename || "")
    .filter(Boolean)
    .filter(filename => normalizeLocalPath(filename).startsWith(prefix))
    .filter(filename => /\.mp4$/i.test(filename))
    .filter((filename, index, rows) => rows.indexOf(filename) === index)
    .sort((a, b) => a.localeCompare(b));
  return paths;
}

function fileIndexPaths(fileIndex, absoluteDirectory, productIds) {
  const rows = Array.isArray(fileIndex?.files) ? fileIndex.files : [];
  const filePaths = [];
  const missing = [];
  for (const productId of productIds) {
    const productFiles = rows
      .filter(row => String(row?.productId || "") === productId)
      .filter(row => Array.isArray(row.pathSegments) && row.pathSegments.length > 0);
    if (productFiles.length === 0) {
      missing.push(productId);
      continue;
    }
    productFiles.forEach(file => {
      filePaths.push(joinAbsolutePath(absoluteDirectory, file.pathSegments));
    });
  }
  return { filePaths, missing };
}

async function publishFilePaths(productIds) {
  const store = await storageGet([PUBLISH_DIRECTORY_KEY, PUBLISH_DIRECTORY_FILE_INDEX_KEY]);
  const directory = sanitizeRelativeDirectory(store[PUBLISH_DIRECTORY_KEY], "");
  if (!directory) {
    throw new Error("请先在插件面板选择发布目录");
  }
  const absoluteDirectory = await resolvePublishDirectoryAbsolutePath(directory);
  const indexed = fileIndexPaths(store[PUBLISH_DIRECTORY_FILE_INDEX_KEY], absoluteDirectory, productIds);
  if (indexed.filePaths.length > 0 && indexed.missing.length === 0) {
    return indexed.filePaths;
  }

  try {
    const files = await collectPublishMp4FilesByHandle(productIds);
    return files.map(file => joinAbsolutePath(absoluteDirectory, file.pathSegments));
  } catch (handleError) {
    console.warn("Read publish directory handle failed, fallback to downloads history", handleError);
  }

  const filePaths = [];
  const missing = [];
  for (const productId of productIds) {
    const paths = await findDownloadedProductMp4Paths(absoluteDirectory, productId);
    if (paths.length === 0) {
      missing.push(productId);
      continue;
    }
    filePaths.push(...paths);
  }
  if (missing.length > 0) {
    throw new Error(`未在发布目录索引中找到商品ID文件夹里的mp4：${missing.join("、")}。请在插件面板重新点击“发布目录”的“选择”按钮刷新索引`);
  }
  if (filePaths.length === 0) {
    throw new Error("发布目录下未找到可上传的mp4文件");
  }
  return filePaths;
}

async function tabFromCreatedWindow(createdWindow) {
  const tabId = createdWindow?.tabs?.[0]?.id;
  if (tabId) {
    return tabId;
  }
  const tabs = await tabsQuery({ windowId: createdWindow?.id });
  const activeTab = tabs.find(tab => tab.active) || tabs[0];
  if (!activeTab?.id) {
    throw new Error("打开创作中心窗口失败");
  }
  return activeTab.id;
}

async function ensureAutomationTab(tabId, windowId) {
  const tab = await tabsGet(tabId);
  if (windowId && tab.windowId !== windowId) {
    throw new Error("自动化窗口已切换，已停止操作其他窗口");
  }
  return tab;
}

async function focusAutomationTab(tabId, windowId) {
  await ensureAutomationTab(tabId, windowId);
  if (windowId) {
    await windowsUpdate(windowId, { focused: true });
  }
  await tabsUpdate(tabId, { active: true });
  return ensureAutomationTab(tabId, windowId);
}

function waitForTabComplete(tabId, windowId = null, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error("创作中心上传页加载超时"));
    }, timeoutMs);

    function onUpdated(updatedTabId, changeInfo, tab) {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") {
        return;
      }
      if (windowId && tab?.windowId !== windowId) {
        return;
      }
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.get(tabId, tab => {
      const error = chrome.runtime.lastError;
      if (!error && tab?.status === "complete" && (!windowId || tab.windowId === windowId)) {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    });
  });
}

function waitForTabUrlPrefix(tabId, urlPrefix, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error("创作中心页面跳转超时"));
    }, timeoutMs);

    function done(tab) {
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve(tab);
    }

    function onUpdated(updatedTabId, changeInfo, tab) {
      if (updatedTabId === tabId && String(changeInfo.url || tab?.url || "").startsWith(urlPrefix)) {
        done(tab);
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.get(tabId, tab => {
      const error = chrome.runtime.lastError;
      if (!error && String(tab?.url || "").startsWith(urlPrefix)) {
        done(tab);
      }
    });
  });
}

async function setCreatorUploadInputFiles(tabId, filePaths, windowId = null) {
  await focusAutomationTab(tabId, windowId);
  const target = { tabId };
  await debuggerAttach(target, "1.3");
  try {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const { root } = await debuggerSendCommand(target, "DOM.getDocument", {
        depth: -1,
        pierce: true
      });
      const { nodeId } = await debuggerSendCommand(target, "DOM.querySelector", {
        nodeId: root.nodeId,
        selector: CREATOR_UPLOAD_INPUT_SELECTOR
      });
      if (nodeId) {
        await debuggerSendCommand(target, "DOM.setFileInputFiles", {
          nodeId,
          files: filePaths
        });
        return;
      }
      await sleep(500);
    }
    throw new Error(`未找到上传控件：${CREATOR_UPLOAD_INPUT_SELECTOR}`);
  } finally {
    await debuggerDetach(target);
  }
}

async function hasCreatorUploadInput(tabId) {
  try {
    const results = await scriptingExecuteScript({
      target: { tabId },
      func: (selector) => Boolean(document.querySelector(selector)),
      args: [CREATOR_UPLOAD_INPUT_SELECTOR]
    });
    return Boolean(results[0]?.result);
  } catch (_error) {
    return false;
  }
}

async function hasCreatorPublishTitleInput(tabId) {
  try {
    const results = await scriptingExecuteScript({
      target: { tabId },
      func: (selector) => Boolean(document.querySelector(selector)),
      args: [CREATOR_TITLE_INPUT_SELECTOR]
    });
    return Boolean(results[0]?.result);
  } catch (_error) {
    return false;
  }
}

async function navigateToCreatorUpload(tabId, windowId = null) {
  await focusAutomationTab(tabId, windowId);
  await tabsUpdate(tabId, { url: CREATOR_UPLOAD_URL, active: true });
  await waitForTabComplete(tabId, windowId);
  await ensureAutomationTab(tabId, windowId);
}

async function ensureCreatorUploadPage(tabId, windowId = null, timeoutMs = 45000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const tab = await ensureAutomationTab(tabId, windowId);
    const url = String(tab?.url || "");
    if (!url.startsWith(CREATOR_UPLOAD_URL)) {
      await navigateToCreatorUpload(tabId, windowId);
      await sleep(800);
      continue;
    }
    if (await hasCreatorUploadInput(tabId)) {
      return;
    }
    await sleep(500);
  }
  throw new Error("创作中心上传页未准备好，请确认页面停留在发布视频上传页");
}

async function waitForCreatorPublishFormReady(tabId, windowId = null, timeoutMs = 120000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const tab = await ensureAutomationTab(tabId, windowId);
    const url = String(tab?.url || "");
    if (url.startsWith(CREATOR_MICRO_URL_PREFIX) && await hasCreatorPublishTitleInput(tabId)) {
      await sleep(800);
      if (await hasCreatorPublishTitleInput(tabId)) {
        return;
      }
    }
    await sleep(500);
  }
  throw new Error("创作中心发布表单未加载完成，未找到作品标题输入框");
}

function normalizePublishOptions(options = {}) {
  const publishDelay = Number(options.publishDelay ?? options.publish_delay ?? 0);
  return {
    syncPublish: String(options.syncPublish || "不同时发布"),
    visibility: String(options.visibility || "公开"),
    savePermission: String(options.savePermission || "允许"),
    publishTime: String(options.publishTime || "立即发布"),
    publishDelay: Number.isFinite(publishDelay) ? publishDelay : 0
  };
}

function publishTitleFromPayload(payload = {}, productIds = []) {
  const titles = (Array.isArray(payload.productTitles) ? payload.productTitles : [])
    .map(value => String(value || "").trim())
    .filter(Boolean);
  return (titles.length > 0 ? titles : productIds).join(" ").trim();
}

async function fillCreatorPublishForm(tabId, payload = {}, productIds = [], windowId = null) {
  await focusAutomationTab(tabId, windowId);
  const title = publishTitleFromPayload(payload, productIds);
  const publishOptions = normalizePublishOptions(payload.publishOptions);
  const results = await scriptingExecuteScript({
    target: { tabId },
    func: async (formTitle, options) => {
      const titleSelector = '.semi-input.semi-input-default[placeholder^="填写作品标题"]';
      const finalClickSelector = "#popover-tip-container";
      const uploadedVideoSelector = '[class^="phone-screen-"] video';
      const directPublishModalSelector = '[class^="semi-modal"][class*="semi-modal-centered"][class*="semi-modal-small"]';
      const directPublishButtonSelector = '[class^="semi-button"][class*="semi-button-tertiary"][class*="semi-button-light"]';
      const optionSelectors = {
        syncPublish: {
          "不同时发布": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(1) input[value="0"]',
          "同时发布到": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(1) input[value="1"]'
        },
        visibility: {
          "公开": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(2) input[value="0"]',
          "好友可见": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(2) input[value="2"]',
          "好有可见": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(2) input[value="2"]',
          "仅自己可见": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(2) input[value="1"]'
        },
        savePermission: {
          "允许": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(3) input[value="1"]',
          "不允许": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(3) input[value="0"]'
        },
        publishTime: {
          "立即发布": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(4) input[value="0"]',
          "定时发布": 'div[class^="form-container-"] div[class^="container-"]:nth-child(3) div[class^="content-"][class*="new-layout-"]:nth-child(4) input[value="1"]'
        }
      };

      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      const waitForElement = async (selector, timeoutMs = 30000) => {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
          const element = document.querySelector(selector);
          if (element) {
            return element;
          }
          await delay(250);
        }
        throw new Error(`未找到元素：${selector}`);
      };
      const isVisible = element => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0
          && rect.height > 0
          && style.display !== "none"
          && style.visibility !== "hidden"
          && style.opacity !== "0";
      };
      const isEnabled = element => Boolean(element)
        && !element.disabled
        && element.getAttribute?.("disabled") === null
        && element.getAttribute?.("aria-disabled") !== "true"
        && !element.classList?.contains("semi-button-disabled")
        && !element.classList?.contains("disabled");
      const normalizeText = value => String(value || "").replace(/\s+/g, "").trim();
      const setNativeValue = (element, value) => {
        const prototype = element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
        if (descriptor?.set) {
          descriptor.set.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const setNativeChecked = (element, value) => {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
        if (descriptor?.set) {
          descriptor.set.call(element, value);
        } else {
          element.checked = value;
        }
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const isInputSelected = (input, target) => Boolean(input?.checked
        || target?.classList?.contains("semi-radio-checked")
        || target?.getAttribute?.("aria-checked") === "true");
      const elementRectSnapshot = element => {
        const rect = element.getBoundingClientRect();
        return [rect.left, rect.top, rect.width, rect.height].map(value => Math.round(value));
      };
      const waitForElementStable = async (element, timeoutMs = 2000) => {
        const startedAt = Date.now();
        let previous = null;
        let stableCount = 0;
        while (Date.now() - startedAt < timeoutMs) {
          if (!isVisible(element)) {
            stableCount = 0;
            previous = null;
            await delay(100);
            continue;
          }
          const current = elementRectSnapshot(element);
          if (previous && current.every((value, index) => Math.abs(value - previous[index]) <= 1)) {
            stableCount += 1;
            if (stableCount >= 2) {
              return;
            }
          } else {
            stableCount = 0;
          }
          previous = current;
          await delay(100);
        }
      };
      const clickInput = async (selector, optionName = selector) => {
        const element = await waitForElement(selector, 15000);
        const target = element.closest?.("label,.semi-radio,[role='radio']") || element;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          target.scrollIntoView({ block: "center", inline: "nearest" });
          await delay(200);
          await waitForElementStable(target);
          clickElement(target);
          if ("checked" in element) {
            setNativeChecked(element, true);
          }
          await delay(300);
          if (isInputSelected(element, target)) {
            return;
          }
        }
        throw new Error(`选项未选中：${optionName}`);
      };
      const clickElement = element => {
        const rect = element.getBoundingClientRect();
        const left = Math.max(0, rect.left);
        const right = Math.min(window.innerWidth || document.documentElement.clientWidth, rect.right);
        const top = Math.max(0, rect.top);
        const bottom = Math.min(window.innerHeight || document.documentElement.clientHeight, rect.bottom);
        const clientX = left + Math.max(1, (right - left) / 2);
        const clientY = top + Math.max(1, (bottom - top) / 2);
        const eventOptions = {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX,
          clientY,
          button: 0,
          buttons: 1,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true
        };
        element.focus?.();
        ["pointerdown", "mousedown", "pointerup", "mouseup"].forEach(type => {
          const EventClass = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
          const options = type.endsWith("up") ? { ...eventOptions, buttons: 0 } : eventOptions;
          element.dispatchEvent(new EventClass(type, options));
        });
        element.click();
      };
      const clickableTarget = element => element?.closest?.("button,[role='button'],a") || element;
      const findFinalPublishButton = () => {
        const root = document.querySelector(finalClickSelector);
        const scopedCandidates = root
          ? [...root.querySelectorAll("button,[role='button'],a"), root]
          : [];
        const publishTextCandidates = [...document.querySelectorAll("button,[role='button'],a")]
          .filter(element => normalizeText(element.textContent).includes("发布"));
        const candidates = [...scopedCandidates, ...publishTextCandidates]
          .map(clickableTarget)
          .filter(Boolean)
          .filter((element, index, rows) => rows.indexOf(element) === index)
          .filter(element => isVisible(element) && isEnabled(element));
        const textMatched = candidates.find(element => normalizeText(element.textContent).includes("发布"));
        return textMatched || candidates[0] || null;
      };
      const waitForFinalPublishButton = async (timeoutMs = 20000) => {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
          await delay(300);
          const button = findFinalPublishButton();
          if (button) {
            return button;
          }
          await delay(250);
        }
        throw new Error(`未找到可点击的发布按钮：${finalClickSelector}`);
      };
      const waitForPublishClickAccepted = async (button, timeoutMs = 12000) => {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
          const latestButton = findFinalPublishButton();
          if (!latestButton || latestButton !== button || !isVisible(latestButton) || !isEnabled(latestButton)) {
            return true;
          }
          const feedback = [...document.querySelectorAll(".semi-toast, .semi-toast-content, .semi-notification, .semi-modal, [class*='toast'], [class*='Toast'], [class*='message'], [class*='Message']")]
            .filter(isVisible)
            .map(element => normalizeText(element.textContent))
            .find(text => text.includes("发布") || text.includes("审核") || text.includes("提交"));
          if (feedback) {
            return true;
          }
          await delay(300);
        }
        throw new Error("已点击发布按钮，但页面未进入发布中状态，请检查是否有必填项未完成");
      };
      const formatDate = date => {
        const pad = value => String(value).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
      };
      const scheduledDateFromDelay = delayHours => {
        const hours = Number(delayHours);
        const safeHours = Number.isFinite(hours) ? Math.max(0, hours) : 0;
        return new Date(Date.now() + safeHours * 60 * 60 * 1000);
      };

      const titleInput = await waitForElement(titleSelector, 60000);
      titleInput.scrollIntoView({ block: "center", inline: "nearest" });
      await delay(200);
      titleInput.focus?.();
      setNativeValue(titleInput, formTitle);
      await delay(1000);
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
      await delay(500);

      await clickInput(optionSelectors.syncPublish[options.syncPublish] || optionSelectors.syncPublish["不同时发布"], `同时发布：${options.syncPublish}`);
      await clickInput(optionSelectors.visibility[options.visibility] || optionSelectors.visibility["公开"], `谁可以看：${options.visibility}`);
      await clickInput(optionSelectors.savePermission[options.savePermission] || optionSelectors.savePermission["允许"], `保存权限：${options.savePermission}`);
      await clickInput(optionSelectors.publishTime[options.publishTime] || optionSelectors.publishTime["立即发布"], `发布时间：${options.publishTime}`);

      let scheduledTime = "";
      if (options.publishTime === "定时发布") {
        const timeInput = await waitForElement('input[format="yyyy-MM-dd HH:mm"]', 15000);
        scheduledTime = formatDate(scheduledDateFromDelay(options.publishDelay));
        setNativeValue(timeInput, scheduledTime);
      }

      await waitForElement(uploadedVideoSelector, 120000);
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
      await delay(1000);
      const finalClickTarget = await waitForFinalPublishButton(20000);
      finalClickTarget.scrollIntoView({ block: "center", inline: "nearest" });
      await delay(300);
      await waitForElementStable(finalClickTarget);
      clickElement(finalClickTarget);
      await delay(2000);
      const directPublishModal = [...document.querySelectorAll(directPublishModalSelector)]
        .find(element => isVisible(element));
      if (directPublishModal) {
        const directPublishButton = [...directPublishModal.querySelectorAll(directPublishButtonSelector)]
          .find(button => isVisible(button) && isEnabled(button) && normalizeText(button.textContent).includes("直接发布"));
        if (directPublishButton) {
          directPublishButton.scrollIntoView({ block: "center", inline: "nearest" });
          await waitForElementStable(directPublishButton);
          clickElement(directPublishButton);
          await delay(500);
        }
      }
      await waitForPublishClickAccepted(finalClickTarget, 12000);
      return {
        ok: true,
        title: formTitle,
        uploadedVideoReady: true,
        publishOptions: options,
        scheduledTime
      };
    },
    args: [title, publishOptions]
  });
  return results[0]?.result || { ok: true };
}

async function openCreator(payload = {}) {
  const publishItems = publishItemsFromPayload(payload);
  if (publishItems.length === 0) {
    throw new Error("请选择需要发布的商品");
  }

  const createdWindow = await windowsCreate({
    url: CREATOR_UPLOAD_URL,
    type: "normal",
    focused: true
  });
  const creatorWindowId = createdWindow?.id || null;
  const tabId = await tabFromCreatedWindow(createdWindow);
  await focusAutomationTab(tabId, creatorWindowId);
  await waitForTabComplete(tabId, creatorWindowId);
  const { session } = await adminContext(false);
  const publishResults = [];
  let uploadCount = 0;
  for (let index = 0; index < publishItems.length; index += 1) {
    const item = publishItems[index];
    const itemPayload = payloadForPublishItem(payload, item);
    await ensureCreatorUploadPage(tabId, creatorWindowId);
    const filePaths = await publishFilePaths([item.productId]);
    uploadCount += filePaths.length;

    await setCreatorUploadInputFiles(tabId, filePaths, creatorWindowId);
    await waitForCreatorPublishFormReady(tabId, creatorWindowId);
    const formResult = await fillCreatorPublishForm(tabId, itemPayload, [item.productId], creatorWindowId);
    await sleep(1500);
    const publishRecordResult = await createPublishRecord(session.baseUrl, item.productId, payload.accountId);
    const statusUpdateResult = await updateSelectionRecordStatusByProductId(
      session.baseUrl,
      item.productId,
      "发布成功",
      payload.accountId
    );
    publishResults.push({
      productId: item.productId,
      productTitle: item.productTitle,
      uploadCount: filePaths.length,
      formResult,
      publishRecordResult,
      statusUpdateResult
    });
  }
  const closeCreatorTabResult = await tabsRemove(tabId);

  return {
    ok: true,
    windowId: creatorWindowId,
    tabId,
    creatorTabClosed: Boolean(closeCreatorTabResult.ok),
    closeCreatorTabError: closeCreatorTabResult.error || "",
    uploadCount,
    productCount: publishItems.length,
    formResult: publishResults[publishResults.length - 1]?.formResult || null,
    statusUpdateResult: {
      status: "发布成功",
      count: publishResults.length,
      rows: publishResults.map(item => item.statusUpdateResult)
    },
    publishRecordResult: {
      count: publishResults.length,
      rows: publishResults.map(item => item.publishRecordResult)
    },
    publishResults
  };
}

function isSessionExpiredBody(body) {
  return Number(body?.code) === SESSION_EXPIRED_CODE;
}

function createSessionExpiredError(message) {
  const error = new Error(message || "登录已过期，请重新登录");
  error.code = SESSION_EXPIRED_CODE;
  error.sessionExpired = true;
  return error;
}

async function markAdminSessionExpired(baseUrl) {
  const store = await storageGet([ADMIN_SESSION_KEY]);
  const session = store[ADMIN_SESSION_KEY] || {};
  await storageSet({
    [ADMIN_SESSION_KEY]: {
      ...session,
      baseUrl: normalizeBaseUrl(baseUrl || session.baseUrl || ""),
      loggedIn: false,
      expiredAt: new Date().toISOString()
    },
    [CATEGORY_TREE_KEY]: []
  });
  favoriteCheckCache.clear();
}

function normalizeBaseUrl(baseUrl) {
  const text = String(baseUrl || "").trim();
  if (!text) {
    return "";
  }
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `http://${text}`;
  try {
    const parsed = new URL(withProtocol);
    parsed.hash = "";
    parsed.search = "";
    return parsed.href.replace(/\/+$/g, "");
  } catch (_error) {
    return withProtocol.replace(/[?#].*$/g, "").replace(/\/+$/g, "");
  }
}

function apiUrl(baseUrl, path) {
  const normalizedPath = String(path || "").startsWith("/") ? String(path || "") : `/${path || ""}`;
  return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`;
}

function signatureUri(path) {
  const parsed = new URL(path, "http://browser-plugin.local");
  let pathname = parsed.pathname || "/";
  if (pathname.startsWith("/api/")) {
    pathname = pathname.slice(4);
  } else if (pathname === "/api") {
    pathname = "/";
  }
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  return pathname || "/";
}

function signedHeaders(path) {
  const timestamp = Date.now().toString();
  const nonceStr = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  const uri = signatureUri(path);
  return {
    signature: md5(`nonceStr=${nonceStr}&timestamp=${timestamp}&uri=${uri}&key=${SIGN_KEY}`),
    timestamp,
    nonceStr,
    uri
  };
}

async function signedFetch(baseUrl, path, options = {}) {
  const url = apiUrl(baseUrl, path);
  const headers = {
    "Content-Type": "application/json",
    ...signedHeaders(path),
    ...(options.headers || {})
  };
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include"
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (_error) {
    body = { code: -1, msg: text || response.statusText };
  }
  if (isSessionExpiredBody(body)) {
    await markAdminSessionExpired(baseUrl);
    throw createSessionExpiredError(body?.msg);
  }
  if (!response.ok) {
    throw new Error(body?.msg || `请求失败：${response.status}`);
  }
  return body;
}

async function getAdminStatus() {
  await migrateDefaultDownloadDirectory();
  const store = await storageGet([
    ADMIN_SESSION_KEY,
    CATEGORY_TREE_KEY,
    SELECTED_CATEGORY_KEY,
    DOWNLOAD_DIRECTORY_KEY,
    PUBLISH_DIRECTORY_KEY,
    TARGET_DOMAIN_KEY,
    "adminBaseUrl"
  ]);
  let session = store[ADMIN_SESSION_KEY];
  let categories = store[CATEGORY_TREE_KEY] || [];
  let sessionExpired = false;
  let error = "";
  if (session?.loggedIn && (session?.baseUrl || store.adminBaseUrl)) {
    try {
      session = await restoreAdminSession(store.adminBaseUrl || session?.baseUrl, session);
      if (session?.loggedIn) {
        const latestStore = await storageGet([CATEGORY_TREE_KEY]);
        categories = latestStore[CATEGORY_TREE_KEY] || categories;
      }
    } catch (statusError) {
      if (statusError?.sessionExpired) {
        sessionExpired = true;
        error = statusError.message;
        const latestStore = await storageGet([ADMIN_SESSION_KEY, CATEGORY_TREE_KEY]);
        session = latestStore[ADMIN_SESSION_KEY] || session;
        categories = latestStore[CATEGORY_TREE_KEY] || [];
      } else if (!session?.loggedIn) {
        error = statusError?.message || String(statusError);
      }
    }
  }
  return {
    ok: true,
    baseUrl: store.adminBaseUrl || session?.baseUrl || "http://127.0.0.1:8080",
    loggedIn: Boolean(session?.loggedIn),
    user: session?.user || null,
    categories,
    selectedCategory: store[SELECTED_CATEGORY_KEY] || null,
    downloadDirectory: sanitizeRelativeDirectory(store[DOWNLOAD_DIRECTORY_KEY], DEFAULT_DOWNLOAD_DIRECTORY),
    publishDirectory: sanitizeRelativeDirectory(store[PUBLISH_DIRECTORY_KEY], ""),
    targetDomain: normalizeDomain(store[TARGET_DOMAIN_KEY], DEFAULT_TARGET_DOMAIN),
    sessionExpired,
    error
  };
}

async function checkPublishReady() {
  const { session, publishDirectory } = await adminContext(false);
  if (!publishDirectory) {
    throw new Error("请先打开插件弹窗，选择发布目录");
  }
  const store = await storageGet([PUBLISH_DIRECTORY_FILE_INDEX_KEY]);
  const fileIndex = store[PUBLISH_DIRECTORY_FILE_INDEX_KEY] || null;
  const directoryHandle = await getPublishDirectoryHandle();
  const directoryIndexed = fileIndex?.directory === publishDirectory && Array.isArray(fileIndex.files);
  if (!directoryHandle && !directoryIndexed) {
    throw new Error("请先在插件面板点击“发布目录”的选择按钮授权目录");
  }
  return {
    ok: true,
    loggedIn: true,
    baseUrl: session.baseUrl,
    publishDirectory,
    directoryIndexed,
    fileCount: Array.isArray(fileIndex?.files) ? fileIndex.files.length : 0
  };
}

async function adminLogin(payload = {}) {
  const baseUrl = normalizeBaseUrl(payload.baseUrl || "http://127.0.0.1:8080");
  const uname = String(payload.uname || "").trim();
  const pwd = String(payload.pwd || "");
  if (!baseUrl || !uname || !pwd) {
    throw new Error("请填写后台地址、用户名和密码");
  }

  const result = await signedFetch(baseUrl, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ uname, pwd })
  });
  if (result?.code !== 0) {
    throw new Error(result?.msg || "登录失败");
  }

  const session = {
    baseUrl,
    token: result.data?.token || "",
    user: {
      uid: result.data?.uid || "",
      nick: result.data?.nick || uname
    },
    loggedIn: true,
    loggedInAt: new Date().toISOString()
  };
  await storageSet({ [ADMIN_SESSION_KEY]: session, adminBaseUrl: baseUrl });
  const categories = await loadAndStoreCategories();
  return {
    ok: true,
    session,
    categories: categories.categories
  };
}

async function loadAndStoreCategories() {
  const store = await storageGet([ADMIN_SESSION_KEY]);
  let session = store[ADMIN_SESSION_KEY];
  if ((!session?.loggedIn || !session?.baseUrl) && session?.baseUrl) {
    session = await restoreAdminSession(session.baseUrl, session);
  }
  if (!session?.loggedIn || !session?.baseUrl) {
    throw new Error("请先登录后台");
  }

  const result = await signedFetch(session.baseUrl, "/base/category/list", { method: "GET" });
  if (result?.code !== 0) {
    throw new Error(result?.msg || "加载品类失败");
  }

  const categories = buildCategoryTree(Array.isArray(result.data) ? result.data : []);
  await storageSet({ [CATEGORY_TREE_KEY]: categories });
  return { ok: true, categories };
}

async function restoreAdminSession(baseUrl, previousSession = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!normalizedBaseUrl) {
    return previousSession;
  }
  try {
    const result = await signedFetch(normalizedBaseUrl, "/base/category/list", { method: "GET" });
    if (result?.code === 0) {
      const session = {
        ...previousSession,
        baseUrl: normalizedBaseUrl,
        loggedIn: true,
        restoredAt: new Date().toISOString()
      };
      const categories = buildCategoryTree(Array.isArray(result.data) ? result.data : []);
      await storageSet({
        [ADMIN_SESSION_KEY]: session,
        [CATEGORY_TREE_KEY]: categories,
        adminBaseUrl: normalizedBaseUrl
      });
      return session;
    }
  } catch (error) {
    if (error?.sessionExpired) {
      const session = {
        ...previousSession,
        baseUrl: normalizedBaseUrl,
        loggedIn: false,
        expiredAt: new Date().toISOString()
      };
      await storageSet({ [ADMIN_SESSION_KEY]: session, [CATEGORY_TREE_KEY]: [] });
      throw error;
    }
    return previousSession;
  }
  return previousSession;
}

async function saveSelectedCategory(category) {
  if (!category?.id) {
    throw new Error("请选择品类");
  }
  await storageSet({ [SELECTED_CATEGORY_KEY]: category });
  return { ok: true, selectedCategory: category };
}

async function saveDownloadDirectory(payload = {}) {
  const directory = sanitizeRelativeDirectory(payload.directory, DEFAULT_DOWNLOAD_DIRECTORY);
  await storageSet({ [DOWNLOAD_DIRECTORY_KEY]: directory });
  return { ok: true, directory };
}

async function savePublishDirectory(payload = {}) {
  const directory = sanitizeRelativeDirectory(payload.directory, "");
  await storageSet({ [PUBLISH_DIRECTORY_KEY]: directory });
  return { ok: true, directory };
}

async function saveTargetDomain(payload = {}) {
  const domain = normalizeDomain(payload.domain, DEFAULT_TARGET_DOMAIN);
  await storageSet({ [TARGET_DOMAIN_KEY]: domain });
  return { ok: true, domain };
}

async function saveAdminBaseUrl(payload = {}) {
  const baseUrl = normalizeBaseUrl(payload.baseUrl || "http://127.0.0.1:8080");
  if (!baseUrl) {
    throw new Error("请填写接口域名");
  }

  const store = await storageGet([ADMIN_SESSION_KEY]);
  const session = store[ADMIN_SESSION_KEY] || null;
  const sessionBaseUrl = normalizeBaseUrl(session?.baseUrl || "");
  const sessionReset = Boolean(session?.loggedIn && sessionBaseUrl && sessionBaseUrl !== baseUrl);
  const values = { adminBaseUrl: baseUrl };

  if (sessionReset) {
    values[ADMIN_SESSION_KEY] = {
      ...session,
      baseUrl,
      loggedIn: false,
      baseUrlChangedAt: new Date().toISOString()
    };
    values[CATEGORY_TREE_KEY] = [];
  } else if (session) {
    values[ADMIN_SESSION_KEY] = {
      ...session,
      baseUrl
    };
  }

  await storageSet(values);
  if (sessionReset) {
    favoriteCheckCache.clear();
  }
  return {
    ok: true,
    baseUrl,
    sessionReset
  };
}

function buildCategoryTree(categories) {
  const nodeMap = new Map();
  const roots = [];
  categories.forEach(item => {
    if (!item?.id) {
      return;
    }
    nodeMap.set(Number(item.id), {
      id: Number(item.id),
      name: String(item.name || ""),
      parentId: Number(item.parentId || item.parent_id || 0),
      seq: Number(item.seq || 0),
      level: Number(item.level || 1),
      children: []
    });
  });
  nodeMap.forEach(node => {
    const parent = node.parentId ? nodeMap.get(node.parentId) : null;
    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  sortCategoryNodes(roots);
  assignCategoryPaths(roots, []);
  return roots;
}

function sortCategoryNodes(nodes) {
  nodes.sort((a, b) => (a.seq || 0) - (b.seq || 0) || (a.id || 0) - (b.id || 0) || a.name.localeCompare(b.name));
  nodes.forEach(node => sortCategoryNodes(node.children || []));
}

function assignCategoryPaths(nodes, parentNames) {
  nodes.forEach(node => {
    const names = [...parentNames, node.name];
    node.pathNames = names;
    node.pathText = names.join(" - ");
    assignCategoryPaths(node.children || [], names);
  });
}

function sanitizePathSegment(value, fallback) {
  const text = String(value || "").trim() || fallback;
  return text
    .replace(/[<>:"\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+$/g, "_")
    .slice(0, 120);
}

function sanitizeRelativeDirectory(value, fallback = DEFAULT_DOWNLOAD_DIRECTORY) {
  const rawSegments = String(value || "").split(/[\\/]+/g);
  const segments = rawSegments
    .map(segment => sanitizePathSegment(segment, ""))
    .filter(Boolean);
  return segments.length > 0 ? segments.join("/") : fallback;
}

function normalizeDomain(value, fallback = DEFAULT_TARGET_DOMAIN) {
  let text = String(value || "").trim().toLowerCase();
  if (!text) {
    return fallback;
  }
  text = text.replace(/^https?:\/\//i, "");
  text = text.split(/[/?#]/)[0] || fallback;
  text = text.replace(/^\*\./, "");
  text = text.replace(/:\d+$/g, "").replace(/^\.+|\.+$/g, "");
  return text || fallback;
}

function normalizeComparable(value) {
  return String(value || "").trim();
}

function favoriteCacheKey(payload = {}) {
  return normalizeComparable(payload.productId || payload.commodityId || payload.id || payload.productLink || payload.url);
}

async function adminContext(requireCategory = false) {
  await migrateDefaultDownloadDirectory();
  const store = await storageGet([
    ADMIN_SESSION_KEY,
    SELECTED_CATEGORY_KEY,
    DOWNLOAD_DIRECTORY_KEY,
    PUBLISH_DIRECTORY_KEY,
    "adminBaseUrl"
  ]);
  let session = store[ADMIN_SESSION_KEY];
  if ((!session?.loggedIn || !session?.baseUrl) && (session?.baseUrl || store.adminBaseUrl)) {
    session = await restoreAdminSession(session?.baseUrl || store.adminBaseUrl, session);
  }
  if (!session?.loggedIn || !session?.baseUrl) {
    throw new Error("请先打开插件弹窗，登录后台");
  }
  const selectedCategory = store[SELECTED_CATEGORY_KEY] || null;
  if (requireCategory && !selectedCategory?.id) {
    throw new Error("请先打开插件弹窗，选择并保存品类");
  }
  const downloadDirectory = sanitizeRelativeDirectory(store[DOWNLOAD_DIRECTORY_KEY], DEFAULT_DOWNLOAD_DIRECTORY);
  const publishDirectory = sanitizeRelativeDirectory(store[PUBLISH_DIRECTORY_KEY], "");
  return { session, selectedCategory, downloadDirectory, publishDirectory };
}

async function checkSelectionRecordExists(baseUrl, payload = {}) {
  const cacheKey = favoriteCacheKey(payload);
  const cached = cacheKey ? favoriteCheckCache.get(cacheKey) : null;
  if (cached && Date.now() - cached.checkedAt < FAVORITE_CHECK_CACHE_TTL) {
    return Boolean(cached.exists);
  }

  const productId = firstNonEmpty(payload.productId, payload.commodityId, payload.id);
  if (!productId) {
    return false;
  }

  const result = await signedFetch(baseUrl, "/selection/record/exists", {
    method: "POST",
    body: JSON.stringify({ productId })
  });
  if (result?.code !== 0) {
    throw new Error(result?.msg || "查询商品是否已收藏失败");
  }
  const exists = Boolean(result.data?.exists);
  if (cacheKey) {
    favoriteCheckCache.set(cacheKey, {
      checkedAt: Date.now(),
      exists
    });
  }
  return exists;
}

async function checkFavoriteProduct(payload = {}) {
  const { session } = await adminContext(false);
  const exists = await checkSelectionRecordExists(session.baseUrl, payload);
  return {
    ok: true,
    favorited: exists
  };
}

async function updateSelectionRecordStatusByProductId(baseUrl, productId, status, accountId = "") {
  const normalizedProductId = normalizeComparable(productId);
  const normalizedAccountId = normalizeComparable(accountId);
  if (!normalizedProductId) {
    throw new Error("商品ID不能为空");
  }
  const result = await signedFetch(baseUrl, "/selection/record/update_status_by_product_id", {
    method: "POST",
    body: JSON.stringify({
      productId: normalizedProductId,
      status,
      ...(normalizedAccountId ? { accountId: normalizedAccountId } : {})
    })
  });
  if (result?.code !== 0) {
    throw new Error(result?.msg || `更新商品状态失败：${normalizedProductId}`);
  }
  return result.data || {
    productId: normalizedProductId,
    status
  };
}

async function createPublishRecord(baseUrl, productId, accountId) {
  const normalizedProductId = normalizeComparable(productId);
  const normalizedAccountId = normalizeComparable(accountId);
  if (!normalizedProductId) {
    throw new Error("商品ID不能为空");
  }
  if (!normalizedAccountId) {
    throw new Error("账号ID不能为空");
  }
  const result = await signedFetch(baseUrl, "/publish/record/create", {
    method: "POST",
    body: JSON.stringify({
      productId: normalizedProductId,
      accountId: normalizedAccountId
    })
  });
  if (result?.code !== 0) {
    throw new Error(result?.msg || `创建发布记录失败：${normalizedProductId}`);
  }
  return result.data || {
    productId: normalizedProductId,
    accountId: normalizedAccountId
  };
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = normalizeComparable(value);
    if (text) {
      return text;
    }
  }
  return "";
}

function parseNumberText(value) {
  let text = normalizeComparable(value);
  if (!text) {
    return null;
  }
  let multiplier = 1;
  if (text.includes("亿")) {
    multiplier = 100000000;
  } else if (text.includes("万")) {
    multiplier = 10000;
  } else if (text.toLowerCase().includes("k")) {
    multiplier = 1000;
  }
  text = text
    .replace(/,/g, "")
    .replace(/[￥¥元人%]/g, "")
    .replace(/[^\d.-]/g, "");
  if (!text || text === "-" || text === ".") {
    return null;
  }
  const number = Number(text);
  if (!Number.isFinite(number)) {
    return null;
  }
  return Number((number * multiplier).toFixed(4));
}

function parseIntegerText(value) {
  const number = parseNumberText(value);
  return number === null ? null : Math.round(number);
}

function selectionRecordPayload(payload = {}, selectedCategory = {}) {
  return {
    accountNickname: normalizeComparable(payload.accountNickname),
    productCategoryId: selectedCategory?.id ? Number(selectedCategory.id) : null,
    productId: firstNonEmpty(payload.productId, payload.commodityId, payload.id),
    productTitle: firstNonEmpty(payload.title),
    productLink: firstNonEmpty(payload.productLink, payload.url),
    trailerLink: "",
    commission: parseNumberText(payload.commission),
    commissionRate: parseNumberText(payload.commissionRate),
    price: parseNumberText(payload.price),
    productRating: parseNumberText(payload.productRating),
    totalSales: parseIntegerText(payload.totalSales),
    sellerCount: parseIntegerText(payload.sellerCount),
    shopName: normalizeComparable(payload.shopName),
    status: "待剪辑"
  };
}

async function createSelectionRecordIfNeeded(baseUrl, payload = {}, selectedCategory = {}) {
  const exists = await checkSelectionRecordExists(baseUrl, payload);
  if (exists) {
    return { created: false, record: null };
  }

  const record = selectionRecordPayload(payload, selectedCategory);
  const result = await signedFetch(baseUrl, "/selection/record/create", {
    method: "POST",
    body: JSON.stringify(record)
  });
  if (result?.code !== 0) {
    throw new Error(result?.msg || "保存选品记录失败");
  }

  const cacheKey = favoriteCacheKey(payload);
  if (cacheKey) {
    favoriteCheckCache.set(cacheKey, {
      checkedAt: Date.now(),
      exists: true
    });
  }
  return { created: true, record };
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url,
        filename,
        conflictAction: "overwrite",
        saveAs: false
      },
      downloadId => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(downloadId);
      }
    );
  });
}

function downloadHistoryMatchesProductFolder(filename, downloadDirectory, productId) {
  const normalizedFilename = normalizeLocalPath(filename);
  const marker = normalizeLocalPath([downloadDirectory, productId].filter(Boolean).join("/"));
  if (!normalizedFilename || !marker) {
    return false;
  }
  return normalizedFilename.includes(`/${marker}/`) || normalizedFilename.endsWith(`/${marker}`);
}

async function favoriteProductFolderExists(downloadDirectory, productId) {
  const items = await downloadsSearch({ state: "complete" });
  return items.some(item => downloadHistoryMatchesProductFolder(item.filename || "", downloadDirectory, productId));
}

function downloadVideoItems(payload = {}) {
  const rawVideos = Array.isArray(payload.videos) ? payload.videos : [];
  const seen = new Set();
  const items = [];
  rawVideos.forEach((item, index) => {
    const url = String(typeof item === "string" ? item : item?.url || "").trim();
    if (!url || seen.has(url)) {
      return;
    }
    seen.add(url);
    const rawIndex = Number(typeof item === "string" ? payload.videoIndex : item?.index);
    items.push({
      url,
      index: Number.isFinite(rawIndex) && rawIndex > 0 ? Math.floor(rawIndex) : index + 1
    });
  });
  return items;
}

function isExcludedImageUrl(url) {
  return /\.(webp|svg)(?:[?#]|$)/i.test(String(url || "").trim());
}

async function downloadProductVideos(payload = {}) {
  await migrateDefaultDownloadDirectory();
  const store = await storageGet([DOWNLOAD_DIRECTORY_KEY]);
  const downloadDirectory = sanitizeRelativeDirectory(store[DOWNLOAD_DIRECTORY_KEY], DEFAULT_DOWNLOAD_DIRECTORY);
  const productId = sanitizePathSegment(payload.productId || payload.commodityId || payload.id, "unknown-product");
  const baseDir = [downloadDirectory, productId].filter(Boolean).join("/");
  const videos = downloadVideoItems(payload);

  if (videos.length === 0) {
    throw new Error("未找到可下载视频");
  }
  if (!await favoriteProductFolderExists(downloadDirectory, productId)) {
    throw new Error("请先收藏商品，再下载视频");
  }

  const downloads = [];
  for (let index = 0; index < videos.length; index += 1) {
    downloads.push(await downloadFile(videos[index].url, `${baseDir}/mv/mv_${videos[index].index}.mp4`));
  }

  return {
    ok: true,
    downloadIds: downloads,
    videoCount: videos.length,
    directory: `${baseDir}/mv`
  };
}

async function downloadFavoriteProduct(payload = {}) {
  const { session, selectedCategory, downloadDirectory } = await adminContext(true);
  const selectionRecord = await createSelectionRecordIfNeeded(session.baseUrl, payload, selectedCategory);
  const productId = sanitizePathSegment(payload.productId || payload.commodityId || payload.id, "unknown-product");
  const baseDir = [downloadDirectory, productId].filter(Boolean).join("/");
  const downloads = [];

  const images = Array.isArray(payload.images)
    ? payload.images.filter(url => url && !isExcludedImageUrl(url))
    : [];
  for (let index = 0; index < images.length; index += 1) {
    const url = images[index];
    if (url) {
      downloads.push(await downloadFile(url, `${baseDir}/img/image_${index + 1}.jpg`));
    }
  }

  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  for (let index = 0; index < videos.length; index += 1) {
    const url = videos[index];
    if (url) {
      downloads.push(await downloadFile(url, `${baseDir}/mv/video_${index + 1}.mp4`));
    }
  }

  return {
    ok: true,
    downloadIds: downloads,
    imageCount: images.length,
    videoCount: videos.length,
    directory: baseDir,
    selectionRecordCreated: selectionRecord.created
  };
}

function md5(input) {
  function rotateLeft(value, shift) {
    return (value << shift) | (value >>> (32 - shift));
  }
  function addUnsigned(a, b) {
    const a4 = a & 0x40000000;
    const b4 = b & 0x40000000;
    const a8 = a & 0x80000000;
    const b8 = b & 0x80000000;
    const result = (a & 0x3fffffff) + (b & 0x3fffffff);
    if (a4 & b4) return result ^ 0x80000000 ^ a8 ^ b8;
    if (a4 | b4) {
      if (result & 0x40000000) return result ^ 0xc0000000 ^ a8 ^ b8;
      return result ^ 0x40000000 ^ a8 ^ b8;
    }
    return result ^ a8 ^ b8;
  }
  function f(x, y, z) { return (x & y) | (~x & z); }
  function g(x, y, z) { return (x & z) | (y & ~z); }
  function h(x, y, z) { return x ^ y ^ z; }
  function i(x, y, z) { return y ^ (x | ~z); }
  function ff(a, b, c, d, x, s, ac) {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, f(b, c, d)), addUnsigned(x, ac)), s), b);
  }
  function gg(a, b, c, d, x, s, ac) {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, g(b, c, d)), addUnsigned(x, ac)), s), b);
  }
  function hh(a, b, c, d, x, s, ac) {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, h(b, c, d)), addUnsigned(x, ac)), s), b);
  }
  function ii(a, b, c, d, x, s, ac) {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, i(b, c, d)), addUnsigned(x, ac)), s), b);
  }
  function utf8Encode(value) {
    return unescape(encodeURIComponent(value));
  }
  function convertToWordArray(value) {
    const length = value.length;
    const wordCount = (((length + 8) - ((length + 8) % 64)) / 64 + 1) * 16;
    const words = new Array(wordCount - 1);
    let bytePosition = 0;
    let byteCount = 0;
    while (byteCount < length) {
      const wordPosition = (byteCount - (byteCount % 4)) / 4;
      bytePosition = (byteCount % 4) * 8;
      words[wordPosition] = (words[wordPosition] || 0) | (value.charCodeAt(byteCount) << bytePosition);
      byteCount += 1;
    }
    const wordPosition = (byteCount - (byteCount % 4)) / 4;
    bytePosition = (byteCount % 4) * 8;
    words[wordPosition] = (words[wordPosition] || 0) | (0x80 << bytePosition);
    words[wordCount - 2] = length << 3;
    words[wordCount - 1] = length >>> 29;
    return words;
  }
  function wordToHex(value) {
    let hex = "";
    for (let count = 0; count <= 3; count += 1) {
      const byte = (value >>> (count * 8)) & 255;
      hex += `0${byte.toString(16)}`.slice(-2);
    }
    return hex;
  }

  const words = convertToWordArray(utf8Encode(input));
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let k = 0; k < words.length; k += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = ff(a, b, c, d, words[k + 0], 7, 0xd76aa478);
    d = ff(d, a, b, c, words[k + 1], 12, 0xe8c7b756);
    c = ff(c, d, a, b, words[k + 2], 17, 0x242070db);
    b = ff(b, c, d, a, words[k + 3], 22, 0xc1bdceee);
    a = ff(a, b, c, d, words[k + 4], 7, 0xf57c0faf);
    d = ff(d, a, b, c, words[k + 5], 12, 0x4787c62a);
    c = ff(c, d, a, b, words[k + 6], 17, 0xa8304613);
    b = ff(b, c, d, a, words[k + 7], 22, 0xfd469501);
    a = ff(a, b, c, d, words[k + 8], 7, 0x698098d8);
    d = ff(d, a, b, c, words[k + 9], 12, 0x8b44f7af);
    c = ff(c, d, a, b, words[k + 10], 17, 0xffff5bb1);
    b = ff(b, c, d, a, words[k + 11], 22, 0x895cd7be);
    a = ff(a, b, c, d, words[k + 12], 7, 0x6b901122);
    d = ff(d, a, b, c, words[k + 13], 12, 0xfd987193);
    c = ff(c, d, a, b, words[k + 14], 17, 0xa679438e);
    b = ff(b, c, d, a, words[k + 15], 22, 0x49b40821);

    a = gg(a, b, c, d, words[k + 1], 5, 0xf61e2562);
    d = gg(d, a, b, c, words[k + 6], 9, 0xc040b340);
    c = gg(c, d, a, b, words[k + 11], 14, 0x265e5a51);
    b = gg(b, c, d, a, words[k + 0], 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, words[k + 5], 5, 0xd62f105d);
    d = gg(d, a, b, c, words[k + 10], 9, 0x02441453);
    c = gg(c, d, a, b, words[k + 15], 14, 0xd8a1e681);
    b = gg(b, c, d, a, words[k + 4], 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, words[k + 9], 5, 0x21e1cde6);
    d = gg(d, a, b, c, words[k + 14], 9, 0xc33707d6);
    c = gg(c, d, a, b, words[k + 3], 14, 0xf4d50d87);
    b = gg(b, c, d, a, words[k + 8], 20, 0x455a14ed);
    a = gg(a, b, c, d, words[k + 13], 5, 0xa9e3e905);
    d = gg(d, a, b, c, words[k + 2], 9, 0xfcefa3f8);
    c = gg(c, d, a, b, words[k + 7], 14, 0x676f02d9);
    b = gg(b, c, d, a, words[k + 12], 20, 0x8d2a4c8a);

    a = hh(a, b, c, d, words[k + 5], 4, 0xfffa3942);
    d = hh(d, a, b, c, words[k + 8], 11, 0x8771f681);
    c = hh(c, d, a, b, words[k + 11], 16, 0x6d9d6122);
    b = hh(b, c, d, a, words[k + 14], 23, 0xfde5380c);
    a = hh(a, b, c, d, words[k + 1], 4, 0xa4beea44);
    d = hh(d, a, b, c, words[k + 4], 11, 0x4bdecfa9);
    c = hh(c, d, a, b, words[k + 7], 16, 0xf6bb4b60);
    b = hh(b, c, d, a, words[k + 10], 23, 0xbebfbc70);
    a = hh(a, b, c, d, words[k + 13], 4, 0x289b7ec6);
    d = hh(d, a, b, c, words[k + 0], 11, 0xeaa127fa);
    c = hh(c, d, a, b, words[k + 3], 16, 0xd4ef3085);
    b = hh(b, c, d, a, words[k + 6], 23, 0x04881d05);
    a = hh(a, b, c, d, words[k + 9], 4, 0xd9d4d039);
    d = hh(d, a, b, c, words[k + 12], 11, 0xe6db99e5);
    c = hh(c, d, a, b, words[k + 15], 16, 0x1fa27cf8);
    b = hh(b, c, d, a, words[k + 2], 23, 0xc4ac5665);

    a = ii(a, b, c, d, words[k + 0], 6, 0xf4292244);
    d = ii(d, a, b, c, words[k + 7], 10, 0x432aff97);
    c = ii(c, d, a, b, words[k + 14], 15, 0xab9423a7);
    b = ii(b, c, d, a, words[k + 5], 21, 0xfc93a039);
    a = ii(a, b, c, d, words[k + 12], 6, 0x655b59c3);
    d = ii(d, a, b, c, words[k + 3], 10, 0x8f0ccc92);
    c = ii(c, d, a, b, words[k + 10], 15, 0xffeff47d);
    b = ii(b, c, d, a, words[k + 1], 21, 0x85845dd1);
    a = ii(a, b, c, d, words[k + 8], 6, 0x6fa87e4f);
    d = ii(d, a, b, c, words[k + 15], 10, 0xfe2ce6e0);
    c = ii(c, d, a, b, words[k + 6], 15, 0xa3014314);
    b = ii(b, c, d, a, words[k + 13], 21, 0x4e0811a1);
    a = ii(a, b, c, d, words[k + 4], 6, 0xf7537e82);
    d = ii(d, a, b, c, words[k + 11], 10, 0xbd3af235);
    c = ii(c, d, a, b, words[k + 2], 15, 0x2ad7d2bb);
    b = ii(b, c, d, a, words[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, aa);
    b = addUnsigned(b, bb);
    c = addUnsigned(c, cc);
    d = addUnsigned(d, dd);
  }

  return `${wordToHex(a)}${wordToHex(b)}${wordToHex(c)}${wordToHex(d)}`.toLowerCase();
}
