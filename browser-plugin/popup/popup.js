const ADMIN_CREDENTIALS_KEY = "adminCredentials";
const SELECTED_CATEGORY_KEY = "selectedProductCategory";
const PUBLISH_DIRECTORY_FILE_INDEX_KEY = "publishDirectoryFileIndex";
const DEFAULT_TARGET_DOMAIN = "buyin.jinritemai.com";
const DEFAULT_DOWNLOAD_DIRECTORY = "";
const DIRECTORY_HANDLE_DB = "browser-plugin-directory-handles";
const DIRECTORY_HANDLE_STORE = "handles";
const PUBLISH_DIRECTORY_HANDLE_KEY = "publishDirectory";

let directorySaveTimer = 0;
let publishDirectorySaveTimer = 0;
let domainSaveTimer = 0;
let adminBaseUrlSaveTimer = 0;

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });
}

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function storageSet(values) {
  return new Promise(resolve => chrome.storage.local.set(values, resolve));
}

function storageRemove(keys) {
  return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
}

function openDirectoryHandleDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DIRECTORY_HANDLE_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DIRECTORY_HANDLE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("打开目录授权缓存失败"));
  });
}

async function directoryHandleStore(mode, callback) {
  const db = await openDirectoryHandleDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DIRECTORY_HANDLE_STORE, mode);
    const store = transaction.objectStore(DIRECTORY_HANDLE_STORE);
    const request = callback(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("保存目录授权失败"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("目录授权缓存失败"));
    };
  });
}

function savePublishDirectoryHandle(handle) {
  return directoryHandleStore("readwrite", store => store.put(handle, PUBLISH_DIRECTORY_HANDLE_KEY));
}

async function indexPublishDirectoryFiles(handle) {
  const files = [];
  for await (const [productId, productHandle] of handle.entries()) {
    if (productHandle.kind !== "directory") {
      continue;
    }
    for await (const [fileName, fileHandle] of productHandle.entries()) {
      if (fileHandle.kind === "file" && /\.mp4$/i.test(fileName)) {
        files.push({
          productId,
          pathSegments: [productId, fileName]
        });
      }
    }
  }
  await storageSet({
    [PUBLISH_DIRECTORY_FILE_INDEX_KEY]: {
      directory: handle.name || "",
      indexedAt: new Date().toISOString(),
      files
    }
  });
  return files.length;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value || "-";
    element.title = value || "";
  }
}

function setStatus(id, message, type = "") {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }
  element.textContent = message;
  element.classList.toggle("success", type === "success");
  element.classList.toggle("error", type === "error");
}

function flattenCategories(nodes, depth = 0, rows = []) {
  nodes.forEach(node => {
    rows.push({
      id: node.id,
      name: node.name,
      pathText: node.pathText || node.name,
      pathNames: node.pathNames || [node.name],
      depth
    });
    flattenCategories(node.children || [], depth + 1, rows);
  });
  return rows;
}

function categoryPathText(category = {}) {
  const names = Array.isArray(category.pathNames) && category.pathNames.length > 0
    ? category.pathNames
    : String(category.pathText || category.name || "").split(/\s+-\s+/g);
  return names.map(name => String(name || "").trim()).filter(Boolean).join(" / ");
}

function categoryOptionText(category, selectedCategory) {
  if (String(selectedCategory?.id || "") === String(category.id || "")) {
    return categoryPathText(category) || category.name;
  }
  return `${"　".repeat(category.depth || 0)}${category.name}`;
}

function refreshSelectedCategoryDisplay(selectedCategory) {
  const select = document.getElementById("category-select");
  if (!select) {
    return;
  }
  Array.from(select.options).forEach(option => {
    if (!option.dataset.category) {
      return;
    }
    try {
      const category = JSON.parse(option.dataset.category);
      option.textContent = categoryOptionText(category, selectedCategory);
      option.title = categoryPathText(category) || category.name;
    } catch (_error) {
      // Keep the existing option text if the cached payload is not parseable.
    }
  });
}

function renderCategoryOptions(categories, selectedCategory) {
  const select = document.getElementById("category-select");
  if (!select) {
    return [];
  }

  const rows = flattenCategories(categories || []);
  select.innerHTML = "";
  if (rows.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无品类，请先登录后台";
    select.appendChild(option);
    return rows;
  }

  rows.forEach(row => {
    const option = document.createElement("option");
    option.value = String(row.id);
    option.textContent = categoryOptionText(row, selectedCategory);
    option.title = categoryPathText(row) || row.pathText;
    option.dataset.category = JSON.stringify(row);
    if (String(selectedCategory?.id || "") === String(row.id || "")) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  return rows;
}

function selectedCategoryFromSelect() {
  const select = document.getElementById("category-select");
  const option = select?.selectedOptions?.[0];
  if (!option?.dataset?.category) {
    return null;
  }
  try {
    return JSON.parse(option.dataset.category);
  } catch (_error) {
    return null;
  }
}

function findCategoryById(rows, category) {
  if (!category?.id) {
    return null;
  }
  return rows.find(row => String(row.id) === String(category.id)) || null;
}

async function cachedSelectedCategory() {
  const store = await storageGet([SELECTED_CATEGORY_KEY]);
  return store[SELECTED_CATEGORY_KEY] || null;
}

async function renderCategoriesWithCachedSelection(categories) {
  const cachedCategory = await cachedSelectedCategory();
  const rows = flattenCategories(categories || []);
  const selectedCategory = findCategoryById(rows, cachedCategory) || rows[0] || null;
  renderCategoryOptions(categories || [], selectedCategory);
  return { rows, selectedCategory };
}

function setBusy(buttonId, busy) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.disabled = busy;
  }
}

function loginFormValues() {
  return {
    baseUrl: document.getElementById("admin-base-url")?.value || "",
    uname: document.getElementById("admin-username")?.value || "",
    pwd: document.getElementById("admin-password")?.value || "",
    remember: Boolean(document.getElementById("remember-credentials")?.checked)
  };
}

function adminBaseUrlValue() {
  return document.getElementById("admin-base-url")?.value || "http://127.0.0.1:8080";
}

function downloadDirectoryValue() {
  return document.getElementById("download-directory")?.value || DEFAULT_DOWNLOAD_DIRECTORY;
}

function directoryStatusText(directory) {
  return directory ? `保存到：浏览器默认下载目录 / ${directory}` : "保存到：浏览器默认下载目录";
}

function publishDirectoryValue() {
  return document.getElementById("publish-directory")?.value || "";
}

function publishDirectoryStatusText(directory) {
  return directory ? `发布目录：浏览器默认下载目录 / ${directory}` : "未选择发布目录";
}

function publishDirectoryStatusType(directory) {
  return directory ? "success" : "";
}

function targetDomainValue() {
  return document.getElementById("target-domain")?.value || DEFAULT_TARGET_DOMAIN;
}

function domainStatusText(domain) {
  return `当前域名：${domain || DEFAULT_TARGET_DOMAIN}`;
}

async function loadRememberedCredentials() {
  const store = await storageGet([ADMIN_CREDENTIALS_KEY]);
  const credentials = store[ADMIN_CREDENTIALS_KEY] || {};
  const rememberInput = document.getElementById("remember-credentials");
  const baseUrlInput = document.getElementById("admin-base-url");
  const usernameInput = document.getElementById("admin-username");
  const passwordInput = document.getElementById("admin-password");

  if (rememberInput) {
    rememberInput.checked = Boolean(credentials.remember);
  }
  if (!credentials.remember) {
    return;
  }
  if (baseUrlInput && credentials.baseUrl) {
    baseUrlInput.value = credentials.baseUrl;
  }
  if (usernameInput) {
    usernameInput.value = credentials.uname || "";
  }
  if (passwordInput) {
    passwordInput.value = credentials.pwd || "";
  }
}

async function saveRememberedCredentials(values) {
  if (!values.remember) {
    await storageRemove(ADMIN_CREDENTIALS_KEY);
    return;
  }
  await storageSet({
    [ADMIN_CREDENTIALS_KEY]: {
      remember: true,
      baseUrl: values.baseUrl,
      uname: values.uname,
      pwd: values.pwd
    }
  });
}

async function loadStatus() {
  const status = await sendRuntimeMessage({ type: "ADMIN_STATUS" });
  if (!status?.ok) {
    setStatus("login-status", status?.error || "读取登录状态失败", "error");
    return;
  }

  const baseUrlInput = document.getElementById("admin-base-url");
  if (baseUrlInput) {
    baseUrlInput.value = status.baseUrl || "http://127.0.0.1:8080";
  }
  const targetDomainInput = document.getElementById("target-domain");
  if (targetDomainInput) {
    targetDomainInput.value = status.targetDomain || DEFAULT_TARGET_DOMAIN;
  }
  const directoryInput = document.getElementById("download-directory");
  if (directoryInput) {
    directoryInput.value = status.downloadDirectory || DEFAULT_DOWNLOAD_DIRECTORY;
  }
  if (status.loggedIn) {
    setStatus("login-status", `已登录：${status.user?.nick || status.user?.uid || "后台用户"}`, "success");
  } else if (status.sessionExpired) {
    setStatus("login-status", status.error || "登录已过期，请重新登录", "error");
  } else {
    setStatus("login-status", "未登录", "error");
  }
  renderCategoryOptions(status.categories || [], status.selectedCategory);
  const selectedCategoryPath = categoryPathText(status.selectedCategory || {});
  if (selectedCategoryPath) {
    setStatus("category-status", `当前品类：${selectedCategoryPath}`, "success");
  }
  setStatus("domain-status", domainStatusText(status.targetDomain), "success");
  setStatus("directory-status", directoryStatusText(status.downloadDirectory), "success");
}

async function loginAdmin() {
  const formValues = loginFormValues();

  setBusy("login-button", true);
  setStatus("login-status", "登录中...");
  try {
    const result = await sendRuntimeMessage({
      type: "ADMIN_LOGIN",
      payload: {
        baseUrl: formValues.baseUrl,
        uname: formValues.uname,
        pwd: formValues.pwd
      }
    });
    if (!result?.ok) {
      throw new Error(result?.error || "登录失败");
    }
    await saveRememberedCredentials({
      ...formValues,
      baseUrl: result.session?.baseUrl || formValues.baseUrl
    });
    setStatus("login-status", `已登录：${result.session?.user?.nick || formValues.uname}`, "success");
    const { rows, selectedCategory } = await renderCategoriesWithCachedSelection(result.categories || []);
    if (rows.length > 0) {
      await cacheSelectedCategory(selectedCategory);
    } else {
      setStatus("category-status", "后台暂无品类，请先维护商品类目", "error");
    }
  } catch (error) {
    setStatus("login-status", error?.message || String(error), "error");
  } finally {
    setBusy("login-button", false);
  }
}

async function reloadCategories() {
  setBusy("reload-category-button", true);
  setStatus("category-status", "加载品类中...");
  try {
    const result = await sendRuntimeMessage({ type: "ADMIN_LOAD_CATEGORIES" });
    if (!result?.ok) {
      throw new Error(result?.error || "加载品类失败");
    }
    const { rows, selectedCategory } = await renderCategoriesWithCachedSelection(result.categories || []);
    if (rows.length > 0) {
      await cacheSelectedCategory(selectedCategory);
    } else {
      setStatus("category-status", "后台暂无品类，请先维护商品类目", "error");
    }
  } catch (error) {
    setStatus("category-status", error?.message || String(error), "error");
  } finally {
    setBusy("reload-category-button", false);
  }
}

async function cacheSelectedCategory(category) {
  if (!category) {
    setStatus("category-status", "请选择品类", "error");
    return;
  }

  const result = await sendRuntimeMessage({
    type: "SAVE_SELECTED_CATEGORY",
    payload: category
  });
  if (!result?.ok) {
    throw new Error(result?.error || "保存品类失败");
  }
  refreshSelectedCategoryDisplay(category);
  setStatus("category-status", `当前品类：${categoryPathText(category)}`, "success");
}

async function saveSelectedCategoryFromSelect() {
  await cacheSelectedCategory(selectedCategoryFromSelect());
}

async function autoSaveSelectedCategory() {
  try {
    await saveSelectedCategoryFromSelect();
  } catch (error) {
    setStatus("category-status", error?.message || String(error), "error");
  }
}

async function saveCategory() {
  setBusy("save-category-button", true);
  try {
    await saveSelectedCategoryFromSelect();
  } catch (error) {
    setStatus("category-status", error?.message || String(error), "error");
  } finally {
    setBusy("save-category-button", false);
  }
}

async function saveDownloadDirectory() {
  const result = await sendRuntimeMessage({
    type: "SAVE_DOWNLOAD_DIRECTORY",
    payload: { directory: downloadDirectoryValue() }
  });
  if (!result?.ok) {
    throw new Error(result?.error || "保存目录失败");
  }
  const directoryInput = document.getElementById("download-directory");
  if (directoryInput) {
    directoryInput.value = result.directory || DEFAULT_DOWNLOAD_DIRECTORY;
  }
  setStatus("directory-status", directoryStatusText(result.directory), "success");
}

async function savePublishDirectory() {
  const result = await sendRuntimeMessage({
    type: "SAVE_PUBLISH_DIRECTORY",
    payload: { directory: publishDirectoryValue() }
  });
  if (!result?.ok) {
    throw new Error(result?.error || "保存发布目录失败");
  }
  const directoryInput = document.getElementById("publish-directory");
  if (directoryInput) {
    directoryInput.value = result.directory || "";
  }
  setStatus("publish-directory-status", publishDirectoryStatusText(result.directory), publishDirectoryStatusType(result.directory));
}

async function saveTargetDomain() {
  const result = await sendRuntimeMessage({
    type: "SAVE_TARGET_DOMAIN",
    payload: { domain: targetDomainValue() }
  });
  if (!result?.ok) {
    throw new Error(result?.error || "保存域名失败");
  }
  const targetDomainInput = document.getElementById("target-domain");
  if (targetDomainInput) {
    targetDomainInput.value = result.domain || DEFAULT_TARGET_DOMAIN;
  }
  setStatus("domain-status", domainStatusText(result.domain), "success");
}

async function autoSaveTargetDomain() {
  try {
    await saveTargetDomain();
  } catch (error) {
    setStatus("domain-status", error?.message || String(error), "error");
  }
}

function scheduleSaveTargetDomain() {
  window.clearTimeout(domainSaveTimer);
  domainSaveTimer = window.setTimeout(autoSaveTargetDomain, 400);
}

async function saveAdminBaseUrl() {
  const result = await sendRuntimeMessage({
    type: "SAVE_ADMIN_BASE_URL",
    payload: { baseUrl: adminBaseUrlValue() }
  });
  if (!result?.ok) {
    throw new Error(result?.error || "保存接口域名失败");
  }
  const input = document.getElementById("admin-base-url");
  if (input && document.activeElement !== input) {
    input.value = result.baseUrl || "http://127.0.0.1:8080";
  }
  const store = await storageGet([ADMIN_CREDENTIALS_KEY]);
  const credentials = store[ADMIN_CREDENTIALS_KEY] || null;
  if (credentials?.remember) {
    await storageSet({
      [ADMIN_CREDENTIALS_KEY]: {
        ...credentials,
        baseUrl: result.baseUrl || credentials.baseUrl
      }
    });
  }
  setStatus("login-status", result.sessionReset ? "接口域名已保存，请重新登录后台" : "接口域名已保存", "success");
}

async function autoSaveAdminBaseUrl() {
  try {
    await saveAdminBaseUrl();
  } catch (error) {
    setStatus("login-status", error?.message || String(error), "error");
  }
}

function scheduleSaveAdminBaseUrl() {
  window.clearTimeout(adminBaseUrlSaveTimer);
  adminBaseUrlSaveTimer = window.setTimeout(autoSaveAdminBaseUrl, 600);
}

async function autoSaveDownloadDirectory() {
  try {
    await saveDownloadDirectory();
  } catch (error) {
    setStatus("directory-status", error?.message || String(error), "error");
  }
}

function scheduleSaveDownloadDirectory() {
  window.clearTimeout(directorySaveTimer);
  directorySaveTimer = window.setTimeout(autoSaveDownloadDirectory, 400);
}

async function autoSavePublishDirectory() {
  try {
    await savePublishDirectory();
  } catch (error) {
    setStatus("publish-directory-status", error?.message || String(error), "error");
  }
}

function scheduleSavePublishDirectory() {
  window.clearTimeout(publishDirectorySaveTimer);
  publishDirectorySaveTimer = window.setTimeout(autoSavePublishDirectory, 400);
}

async function chooseDownloadDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    setStatus("directory-status", "当前浏览器不支持系统文件夹选择，请手动输入目录", "error");
    return;
  }

  setBusy("choose-directory-button", true);
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    const directoryInput = document.getElementById("download-directory");
    if (directoryInput) {
      directoryInput.value = handle?.name || DEFAULT_DOWNLOAD_DIRECTORY;
    }
    await saveDownloadDirectory();
  } catch (error) {
    if (error?.name !== "AbortError") {
      setStatus("directory-status", error?.message || String(error), "error");
    }
  } finally {
    setBusy("choose-directory-button", false);
  }
}

async function choosePublishDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    setStatus("publish-directory-status", "当前浏览器不支持系统文件夹选择，请手动输入目录", "error");
    return;
  }

  setBusy("choose-publish-directory-button", true);
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    const directoryInput = document.getElementById("publish-directory");
    if (directoryInput) {
      directoryInput.value = handle?.name || "";
    }
    if (handle?.requestPermission) {
      await handle.requestPermission({ mode: "readwrite" });
    }
    await savePublishDirectoryHandle(handle);
    const indexedCount = await indexPublishDirectoryFiles(handle);
    await savePublishDirectory();
    setStatus("publish-directory-status", `${publishDirectoryStatusText(handle?.name || "")}，已索引 ${indexedCount} 个mp4`, "success");
  } catch (error) {
    if (error?.name !== "AbortError") {
      setStatus("publish-directory-status", error?.message || String(error), "error");
    }
  } finally {
    setBusy("choose-publish-directory-button", false);
  }
}

async function initPopup() {
  const tab = await getActiveTab();
  setText("page-title", tab?.title || "");
  setText("page-url", tab?.url || "");

  document.getElementById("login-button")?.addEventListener("click", loginAdmin);
  document.getElementById("reload-category-button")?.addEventListener("click", reloadCategories);
  document.getElementById("save-category-button")?.addEventListener("click", saveCategory);
  document.getElementById("category-select")?.addEventListener("change", autoSaveSelectedCategory);
  document.getElementById("target-domain")?.addEventListener("input", scheduleSaveTargetDomain);
  document.getElementById("target-domain")?.addEventListener("change", autoSaveTargetDomain);
  document.getElementById("target-domain")?.addEventListener("blur", autoSaveTargetDomain);
  document.getElementById("admin-base-url")?.addEventListener("input", scheduleSaveAdminBaseUrl);
  document.getElementById("admin-base-url")?.addEventListener("change", autoSaveAdminBaseUrl);
  document.getElementById("admin-base-url")?.addEventListener("blur", autoSaveAdminBaseUrl);
  document.getElementById("choose-directory-button")?.addEventListener("click", chooseDownloadDirectory);
  document.getElementById("download-directory")?.addEventListener("input", scheduleSaveDownloadDirectory);
  document.getElementById("download-directory")?.addEventListener("change", autoSaveDownloadDirectory);
  document.getElementById("download-directory")?.addEventListener("blur", autoSaveDownloadDirectory);
  document.getElementById("choose-publish-directory-button")?.addEventListener("click", choosePublishDirectory);
  document.getElementById("publish-directory")?.addEventListener("input", scheduleSavePublishDirectory);
  document.getElementById("publish-directory")?.addEventListener("change", autoSavePublishDirectory);
  document.getElementById("publish-directory")?.addEventListener("blur", autoSavePublishDirectory);
  document.getElementById("remember-credentials")?.addEventListener("change", event => {
    if (!event.target.checked) {
      storageRemove(ADMIN_CREDENTIALS_KEY);
    }
  });

  await loadRememberedCredentials();
  await loadStatus();
}

initPopup().catch(error => {
  setText("page-title", "读取失败");
  setText("page-url", String(error?.message || error));
});
