(() => {
  const CONTENT_SCRIPT_FLAG = "__videoPublishPluginContentScriptLoaded";
  const existingState = globalThis[CONTENT_SCRIPT_FLAG];
  const contentScriptState = existingState && typeof existingState === "object" ? existingState : {};
  const contentScriptAlreadyLoaded = Boolean(contentScriptState.loaded);
  contentScriptState.loaded = true;
  globalThis[CONTENT_SCRIPT_FLAG] = contentScriptState;

  const TARGET_DOMAIN_KEY = "targetDomain";
  const ADMIN_BASE_URL_KEY = "adminBaseUrl";
  const DEFAULT_TARGET_DOMAIN = "buyin.jinritemai.com";
  const ADMIN_BRIDGE_SOURCE = "video-publish-admin-www";
  const PLUGIN_BRIDGE_SOURCE = "browser-plugin";
  const ADMIN_BRIDGE_MESSAGE_TYPES = new Set(["OPEN_CREATOR", "OPEN_CREATOR_WITH_COOKIE", "CHECK_PUBLISH_READY"]);
  const TARGET_PATH = "/dashboard/merch-picking-library/merch-promoting";
  const CART_TEXTS = ["加选品车", "加入选品车"];
  const BUTTON_ATTR = "data-browser-plugin-favorite-button";
  const DOWNLOAD_VIDEO_BUTTON_ATTR = "data-browser-plugin-download-video-button";
  const FAVORITE_BUTTON_SELECTOR = `[${BUTTON_ATTR}="true"]`;
  const DOWNLOAD_VIDEO_BUTTON_SELECTOR = `[${DOWNLOAD_VIDEO_BUTTON_ATTR}="true"]`;
  const PLUGIN_BUTTON_SELECTOR = `${FAVORITE_BUTTON_SELECTOR}, ${DOWNLOAD_VIDEO_BUTTON_SELECTOR}`;
  const BUTTON_STYLE_ID = "browser-plugin-favorite-style";
  const VIDEO_ACTION_CONTAINER_SELECTOR = '.auxo-spin-container [class^="index_module__action"]';
  const CONTENT_INFO_VIDEO_SELECTOR = '.auxo-spin-container [class^="index_module__contentInfo"] video';
  const SCOPED_CONTENT_INFO_VIDEO_SELECTOR = '[class^="index_module__contentInfo"] video';
  const IMAGE_SELECTOR = '#app [class^="index_module__imageVideoContainer"] [class^="index_module__imgWrapper"] img';
  const VIDEO_SELECTOR = '#app [class^="index_module__imageVideoContainer"] video';
  const FAVORITE_VIDEO_FOCUS_SELECTOR = '#app [class^="index_module__imageVideoContainer"] div[data-index="0"]';
  const TITLE_SELECTOR = '#app [class^="index_module__basicInfo"] span[class^="index_module__title"]';
  const ACCOUNT_NICKNAME_SELECTOR = '[class^="btn-item-role-exchange-name"] [class="btn-item-role-exchange-name__title"]';
  const COMMISSION_RATE_SELECTOR = 'div[class^="index_module__dataCardContainer"] [class^="index_module__dataItem"]:nth-child(2) span:nth-child(1)';
  const COMMISSION_SELECTOR = 'div[class^="index_module__dataCardContainer"] [class^="index_module__dataItem"]:nth-child(2) span:nth-child(2)';
  const PRICE_SELECTOR = 'div[class^="index_module__dataCardContainer"] [class^="index_module__dataItem"]:nth-child(1) div[class^="index_module__dataContent"]';
  const PRODUCT_RATING_SELECTOR = '[class^="index_module__scoreLine"] [class^="index_module__bigNum"]';
  const TOTAL_SALES_SELECTOR = 'div[class^="index_module__dataCardContainer"] [class^="index_module__dataItem"]:nth-child(4) div[class^="index_module__dataContent"]';
  const SELLER_COUNT_SELECTOR = 'div[class^="index_module__dataCardContainer"] [class^="index_module__dataItem"]:nth-child(5) [class^="index_module__dataContent"] div:first-child';
  const SHOP_NAME_SELECTOR = '[class^="index_module__shopInfo"] [class^="index_module__basicInfo"] [class^="index_module__title"]';
  const COPY_LINK_SELECTOR = '[class^="index_module__copyLink"]';
  const COPY_LINK_DELAY_MS = 500;
  const FAVORITE_STATUS_CACHE_TTL = 15000;
  const FAVORITE_STATUS_ERROR_TTL = 30000;

  let scheduleTimer = 0;
  let ensureInFlight = false;
  let ensurePending = false;
  let targetDomain = DEFAULT_TARGET_DOMAIN;
  const favoriteStatusCache = new Map();
  const favoriteStatusInflight = new Map();

  function isTargetPage() {
    return domainMatches(location.hostname, targetDomain) && location.pathname.startsWith(TARGET_PATH);
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

  function normalizeHost(value) {
    return String(value || "").trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/\.+$/g, "");
  }

  function domainMatches(hostname, domain) {
    const host = normalizeDomain(hostname, "");
    const normalizedDomain = normalizeDomain(domain, DEFAULT_TARGET_DOMAIN);
    return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
  }

  function removeFavoriteButtons() {
    document.querySelectorAll(`[${BUTTON_ATTR}="true"]`).forEach(button => button.remove());
  }

  function removeDownloadVideoButtons() {
    document.querySelectorAll(`[${DOWNLOAD_VIDEO_BUTTON_ATTR}="true"]`).forEach(button => button.remove());
  }

  function loadTargetDomain() {
    chrome.storage.local.get([TARGET_DOMAIN_KEY], store => {
      targetDomain = normalizeDomain(store[TARGET_DOMAIN_KEY], DEFAULT_TARGET_DOMAIN);
      scheduleEnsureFavoriteButton();
    });
  }

  function storageGet(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }

  function hostFromUrl(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `http://${text}`;
    try {
      return normalizeHost(new URL(withProtocol).hostname);
    } catch (_error) {
      return normalizeDomain(text, "");
    }
  }

  function normalizeDomainList(value) {
    const text = Array.isArray(value) ? value.join(",") : String(value || "");
    const domains = text
      .split(/[\s,，;；]+/)
      .map(item => hostFromUrl(item))
      .filter(Boolean);
    return [...new Set(domains)];
  }

  async function loadAdminBridgeDomains() {
    const store = await storageGet([ADMIN_BASE_URL_KEY]);
    return normalizeDomainList([hostFromUrl(store[ADMIN_BASE_URL_KEY])]);
  }

  function isLocalAdminBridgeHost(hostname) {
    const host = normalizeHost(hostname);
    return host === "localhost"
      || host === "127.0.0.1"
      || host === "0.0.0.0"
      || host === "::1"
      || host === "host.docker.internal"
      || true
      || /^[^.]+$/.test(host)
      || host.endsWith(".local")
      || host.endsWith(".test")
      || /^10\./.test(host)
      || /^192\.168\./.test(host)
      || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  }

  async function isAllowedAdminBridgeHost(hostname) {
    if (isLocalAdminBridgeHost(hostname)) {
      return true;
    }
    const domains = await loadAdminBridgeDomains();
    return domains.some(domain => domainMatches(hostname, domain));
  }

  function postAdminBridgeResult(requestId, messageType, ok, error, targetOrigin, result = null) {
    window.postMessage({
      source: PLUGIN_BRIDGE_SOURCE,
      type: `${messageType}_RESULT`,
      requestId: requestId || "",
      ok,
      error: error || "",
      result
    }, targetOrigin && targetOrigin !== "null" ? targetOrigin : "*");
  }

  function setupAdminBridge() {
    if (contentScriptState.adminBridgeHandler) {
      window.removeEventListener("message", contentScriptState.adminBridgeHandler);
    }

    contentScriptState.adminBridgeHandler = async event => {
      if (event.source !== window) {
        return;
      }
      const data = event.data || {};
      if (data.source !== ADMIN_BRIDGE_SOURCE || !ADMIN_BRIDGE_MESSAGE_TYPES.has(data.type)) {
        return;
      }
      const messageType = data.type;
      try {
        if (!await isAllowedAdminBridgeHost(location.hostname)) {
          postAdminBridgeResult(data.requestId, messageType, false, `当前页面域名不允许调用插件：${location.hostname}`, event.origin);
          return;
        }
      } catch (error) {
        postAdminBridgeResult(data.requestId, messageType, false, error?.message || String(error), event.origin);
        return;
      }

      try {
        chrome.runtime.sendMessage({
          type: messageType,
          payload: data.payload || {}
        }, response => {
          const error = chrome.runtime.lastError;
          postAdminBridgeResult(
            data.requestId,
            messageType,
            Boolean(!error && response?.ok),
            error?.message || response?.error || "",
            event.origin,
            response || null
          );
        });
      } catch (error) {
        postAdminBridgeResult(data.requestId, messageType, false, error?.message || String(error), event.origin);
      }
    };
    window.addEventListener("message", contentScriptState.adminBridgeHandler);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, "").trim();
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function areaOf(element) {
    const rect = element.getBoundingClientRect();
    return rect.width * rect.height;
  }

  function findCartButton() {
    const selectors = [
      "button",
      "[role='button']",
      "a",
      "span",
      "div"
    ];
    const candidates = Array.from(document.querySelectorAll(selectors.join(",")))
      .filter(isVisible)
      .filter(element => {
        const text = normalizeText(element.innerText || element.textContent);
        return CART_TEXTS.some(targetText => text === targetText || text.includes(targetText));
      })
      .sort((a, b) => areaOf(a) - areaOf(b));

    const matched = candidates[0];
    return matched?.closest("button,[role='button'],a") || matched || null;
  }

  function ensureStyle() {
    let style = document.getElementById(BUTTON_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = BUTTON_STYLE_ID;
      document.documentElement.appendChild(style);
    }
    const css = `
      ${PLUGIN_BUTTON_SELECTOR} {
        width: var(--browser-plugin-favorite-width, auto) !important;
        min-width: var(--browser-plugin-favorite-width, 88px) !important;
        height: var(--browser-plugin-favorite-height, 36px) !important;
        padding: var(--browser-plugin-favorite-padding, 0 16px) !important;
        margin-right: 8px !important;
        box-sizing: border-box !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border: 1px solid #0f766e !important;
        border-radius: var(--browser-plugin-favorite-radius, 4px) !important;
        background: linear-gradient(180deg, #14b8a6 0%, #0f766e 100%) !important;
        color: #ffffff !important;
        font-size: var(--browser-plugin-favorite-font-size, 14px) !important;
        font-weight: 600 !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        cursor: pointer !important;
        user-select: none !important;
        box-shadow: 0 2px 6px rgba(15, 118, 110, 0.22) !important;
        transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease !important;
      }
      ${FAVORITE_BUTTON_SELECTOR}:hover,
      ${DOWNLOAD_VIDEO_BUTTON_SELECTOR}:hover {
        border-color: #0d9488 !important;
        background: linear-gradient(180deg, #2dd4bf 0%, #0d9488 100%) !important;
        box-shadow: 0 4px 10px rgba(13, 148, 136, 0.28) !important;
        transform: translateY(-1px) !important;
      }
      ${FAVORITE_BUTTON_SELECTOR}:active,
      ${DOWNLOAD_VIDEO_BUTTON_SELECTOR}:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 4px rgba(15, 118, 110, 0.2) !important;
      }
      ${FAVORITE_BUTTON_SELECTOR}:disabled,
      ${DOWNLOAD_VIDEO_BUTTON_SELECTOR}:disabled {
        border-color: #94a3b8 !important;
        background: #cbd5e1 !important;
        color: #ffffff !important;
        cursor: not-allowed !important;
        box-shadow: none !important;
        transform: none !important;
      }
      [${BUTTON_ATTR}="true"].browser-plugin-favorite-fallback,
      [${DOWNLOAD_VIDEO_BUTTON_ATTR}="true"].browser-plugin-favorite-fallback {
        min-width: 72px;
        height: 32px;
        padding: 0 14px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        color: #1f2937;
        background: #ffffff;
        font-size: 14px;
        line-height: 30px;
      }
      [${DOWNLOAD_VIDEO_BUTTON_ATTR}="true"] {
        min-width: 88px !important;
        margin: 0 8px 0 0 !important;
        border-color: #1677ff !important;
        background: linear-gradient(180deg, #4096ff 0%, #1677ff 100%) !important;
        box-shadow: 0 2px 6px rgba(22, 119, 255, 0.22) !important;
      }
      [${DOWNLOAD_VIDEO_BUTTON_ATTR}="true"]:hover {
        border-color: #0958d9 !important;
        background: linear-gradient(180deg, #69b1ff 0%, #0958d9 100%) !important;
        box-shadow: 0 4px 10px rgba(22, 119, 255, 0.28) !important;
      }
      [${BUTTON_ATTR}="true"].browser-plugin-favorited {
        border-color: #7c3aed !important;
        color: #ffffff !important;
        background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%) !important;
        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.22) !important;
      }
      [${BUTTON_ATTR}="true"].browser-plugin-favorited:hover {
        border-color: #6d28d9 !important;
        background: linear-gradient(180deg, #a78bfa 0%, #6d28d9 100%) !important;
        box-shadow: 0 4px 10px rgba(109, 40, 217, 0.28) !important;
      }
    `;
    if (style.textContent !== css) {
      style.textContent = css;
    }
  }

  function syncButtonMetrics(button, sourceButton) {
    if (!button || !sourceButton) {
      return;
    }
    const rect = sourceButton.getBoundingClientRect();
    const computed = window.getComputedStyle(sourceButton);
    if (rect.width > 0) {
      button.style.setProperty("--browser-plugin-favorite-width", `${Math.ceil(rect.width)}px`);
    }
    if (rect.height > 0) {
      button.style.setProperty("--browser-plugin-favorite-height", `${Math.ceil(rect.height)}px`);
    }
    button.style.setProperty(
      "--browser-plugin-favorite-padding",
      `${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`
    );
    button.style.setProperty("--browser-plugin-favorite-radius", computed.borderRadius || "4px");
    button.style.setProperty("--browser-plugin-favorite-font-size", computed.fontSize || "14px");
  }

  function queryParams() {
    return new URLSearchParams(location.search);
  }

  function currentFavoriteId() {
    const params = queryParams();
    return params.get("product_id")
      || params.get("commodity_id")
      || params.get("id")
      || `${location.origin}${location.pathname}`;
  }

  function currentFavoriteRecord() {
    const params = queryParams();
    return {
      id: currentFavoriteId(),
      productId: params.get("product_id") || "",
      commodityId: params.get("commodity_id") || "",
      shopId: params.get("shop_id") || "",
      category: currentCategory(),
      title: currentProductTitle(),
      accountNickname: textBySelector(ACCOUNT_NICKNAME_SELECTOR),
      productLink: "",
      commissionRate: textBySelector(COMMISSION_RATE_SELECTOR),
      commission: textBySelector(COMMISSION_SELECTOR),
      price: textBySelector(PRICE_SELECTOR),
      productRating: textBySelector(PRODUCT_RATING_SELECTOR),
      totalSales: textBySelector(TOTAL_SALES_SELECTOR),
      sellerCount: textBySelector(SELLER_COUNT_SELECTOR),
      shopName: textBySelector(SHOP_NAME_SELECTOR),
      images: collectImageUrls(),
      videos: collectFavoriteVideoUrls(),
      url: location.href,
      collectedAt: new Date().toISOString()
    };
  }

  function sleep(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  function findCopyLinkButton() {
    return document.querySelector(COPY_LINK_SELECTOR);
  }

  async function readClipboardText() {
    try {
      return String(await navigator.clipboard.readText() || "").trim();
    } catch (_error) {
      return "";
    }
  }

  async function copyProductLinkFromPage() {
    const copyButton = findCopyLinkButton();
    if (!copyButton) {
      throw new Error("未找到商品链接复制按钮");
    }
    copyButton.click();
    await sleep(COPY_LINK_DELAY_MS);

    const productLink = await readClipboardText();
    if (!productLink) {
      throw new Error("读取复制的商品链接失败");
    }
    return productLink;
  }

  function favoriteStatusKey(record = {}) {
    return record.productId
      || record.commodityId
      || record.id
      || record.productLink
      || record.url
      || currentFavoriteId();
  }

  function currentCategory() {
    const params = queryParams();
    const names = [
      "category",
      "category_name",
      "categoryName",
      "cate_name",
      "cateName",
      "first_category_name",
      "second_category_name",
      "third_category_name"
    ];
    for (const name of names) {
      const value = params.get(name);
      if (value) {
        return value;
      }
    }
    return "未分类";
  }

  function currentProductTitle() {
    return document.querySelector(TITLE_SELECTOR)?.textContent?.trim() || document.title || "";
  }

  function textBySelector(selector) {
    return document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  function absoluteUrl(value) {
    if (!value) {
      return "";
    }
    try {
      return new URL(value, location.href).href;
    } catch (_error) {
      return "";
    }
  }

  function uniqueValues(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function isExcludedImageUrl(url) {
    return /\.(webp|svg)(?:[?#]|$)/i.test(String(url || "").trim());
  }

  function imageUrlFromElement(image) {
    const srcset = image.getAttribute("srcset") || "";
    const firstSrcsetUrl = srcset.split(",")[0]?.trim().split(/\s+/)[0] || "";
    const candidates = [
      image.currentSrc,
      image.src,
      image.getAttribute("data-src"),
      image.getAttribute("data-lazy-src"),
      firstSrcsetUrl
    ];
    return candidates
      .map(absoluteUrl)
      .find(url => url && !isExcludedImageUrl(url)) || "";
  }

  function videoUrlFromElement(video) {
    const source = video.querySelector("source[src]");
    return absoluteUrl(
      video.currentSrc
      || video.src
      || video.getAttribute("data-src")
      || source?.getAttribute("src")
    );
  }

  function looksLikeVideoUrl(value) {
    const text = String(value || "").trim();
    return /^blob:/i.test(text) || /\.(mp4|m4v|mov|webm)(?:[?#]|$)/i.test(text);
  }

  function urlFromMediaAttribute(element, attrName) {
    const value = element?.getAttribute?.(attrName) || "";
    const url = absoluteUrl(value);
    return looksLikeVideoUrl(url) ? url : "";
  }

  function videoUrlsForElement(video) {
    if (!video) {
      return [];
    }
    return uniqueValues([
      videoUrlFromElement(video),
      ...["src", "data-src", "data-video", "data-video-url", "data-play-url"].map(attrName => urlFromMediaAttribute(video, attrName))
    ]);
  }

  function visibleContentInfoVideos() {
    return Array.from(document.querySelectorAll(CONTENT_INFO_VIDEO_SELECTOR))
      .filter(video => isVisible(video.closest('[class^="index_module__contentInfo"]') || video) || isVisible(video));
  }

  function contentVideoIndex(video) {
    const videos = visibleContentInfoVideos();
    const index = videos.indexOf(video);
    return index >= 0 ? index + 1 : 1;
  }

  function findActionVideo(actionContainer) {
    let current = actionContainer;
    for (let depth = 0; current && current !== document.body && depth < 8; depth += 1) {
      const videos = Array.from(current.querySelectorAll(SCOPED_CONTENT_INFO_VIDEO_SELECTOR))
        .filter(video => isVisible(video.closest('[class^="index_module__contentInfo"]') || video) || isVisible(video));
      if (videos.length === 1) {
        return {
          video: videos[0],
          index: contentVideoIndex(videos[0])
        };
      }
      current = current.parentElement;
    }

    const actionContainers = Array.from(document.querySelectorAll(VIDEO_ACTION_CONTAINER_SELECTOR)).filter(isVisible);
    const videos = visibleContentInfoVideos();
    const actionIndex = actionContainers.indexOf(actionContainer);
    const fallbackVideo = actionIndex >= 0 ? videos[actionIndex] : videos[0];
    return {
      video: fallbackVideo || null,
      index: actionIndex >= 0 ? actionIndex + 1 : 1
    };
  }

  function collectImageUrls() {
    return uniqueValues(Array.from(document.querySelectorAll(IMAGE_SELECTOR)).map(imageUrlFromElement));
  }

  function collectFavoriteVideoUrls() {
    const urls = [];
    Array.from(document.querySelectorAll(VIDEO_SELECTOR)).forEach(video => {
      urls.push(...videoUrlsForElement(video));
    });
    return uniqueValues(urls);
  }

  function favoriteVideoActivationTargets(target) {
    const targets = [];
    const add = element => {
      if (element && element instanceof Element && !targets.includes(element)) {
        targets.push(element);
      }
    };
    const rect = target.getBoundingClientRect?.();
    if (rect) {
      add(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
    }
    add(target);
    add(target.querySelector("video, img, button, [role='button'], [class*='play'], [class*='video']"));
    const container = target.closest('#app [class^="index_module__imageVideoContainer"]');
    if (container) {
      add(container);
      container
        .querySelectorAll([
          'div[data-index="0"]',
          "video",
          "img",
          "button",
          "[role='button']",
          "[class*='play']",
          "[class*='Play']",
          "[class*='video']",
          "[class*='Video']"
        ].join(","))
        .forEach(add);
    }
    let current = target.parentElement;
    for (let depth = 0; current && current !== document.body && depth < 4; depth += 1) {
      add(current);
      if (current.matches?.('#app [class^="index_module__imageVideoContainer"]')) {
        break;
      }
      current = current.parentElement;
    }
    return targets.filter(isVisible);
  }

  function focusFavoriteVideoTrigger(target) {
    if (!target) {
      return false;
    }
    target.scrollIntoView?.({ block: "center", inline: "center" });
    if (typeof target.focus === "function") {
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    }
    [
      "pointerenter", "pointerover", "pointermove",
      "mouseenter", "mouseover", "mousemove",
      "pointerdown", "mousedown", "pointerup", "mouseup"
    ].forEach(eventName => target.dispatchEvent(createMouseLikeEvent(eventName, target)));
    target.click?.();
    return true;
  }

  async function activateFavoriteVideoTrigger() {
    const target = document.querySelector(FAVORITE_VIDEO_FOCUS_SELECTOR);
    if (!target) {
      return [];
    }
    const targets = favoriteVideoActivationTargets(target);
    if (targets.length === 0) {
      return [];
    }
    focusFavoriteVideoTrigger(targets[0]);
    await sleep(500);
    return collectFavoriteVideoUrls();
  }

  function createMouseLikeEvent(eventName, target) {
    const rect = target?.getBoundingClientRect?.();
    const clientX = rect ? rect.left + rect.width / 2 : 0;
    const clientY = rect ? rect.top + rect.height / 2 : 0;
    const options = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX,
      clientY
    };
    if (eventName.startsWith("pointer") && typeof PointerEvent === "function") {
      return new PointerEvent(eventName, {
        ...options,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true
      });
    }
    return new MouseEvent(eventName, options);
  }

  async function collectFavoriteVideoUrlsForSave() {
    const urls = collectFavoriteVideoUrls();
    if (urls.length > 0) {
      return urls;
    }
    return activateFavoriteVideoTrigger();
  }

  function currentActionVideoPayload(actionContainer) {
    const matched = findActionVideo(actionContainer);
    const url = videoUrlsForElement(matched.video)[0] || "";
    return url ? [{ url, index: matched.index }] : [];
  }

  function normalizeClipboardVideoText(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\n+/g, " ")
      .trim();
  }

  function parseClipboardVideoContent(value) {
    const text = String(value || "").replace(/\r\n?/g, "\n").trim();
    const content = { videoTitle: "", videoCopy: "", videoTopic: "" };
    const fieldMap = {
      "标题": "videoTitle",
      "语音转文字": "videoCopy",
      "话题": "videoTopic"
    };
    const matches = [];
    const labelPattern = /(^|\n)\s*(标题|语音转文字|话题)\s*[:：]\s*/g;
    let match;
    while ((match = labelPattern.exec(text)) !== null) {
      matches.push({
        label: match[2],
        index: match.index,
        start: labelPattern.lastIndex,
        end: text.length
      });
    }
    matches.forEach((item, index) => {
      const next = matches[index + 1];
      const fieldName = fieldMap[item.label];
      if (next && next.index > item.start) {
        item.end = next.index;
      }
      if (fieldName) {
        content[fieldName] = normalizeClipboardVideoText(text.slice(item.start, item.end));
      }
    });
    return content;
  }

  async function extractVideoContent() {
    const content = parseClipboardVideoContent(await readClipboardText());
    if (!content.videoTitle && !content.videoCopy && !content.videoTopic) {
      throw new Error("剪贴板未找到视频文案，请先在页面一键复制，文本需包含：标题、语音转文字、话题");
    }
    return content;
  }

  async function isFavorited(record = currentFavoriteRecord()) {
    const cacheKey = favoriteStatusKey(record);
    const cached = cacheKey ? favoriteStatusCache.get(cacheKey) : null;
    if (cached && Date.now() - cached.checkedAt < cached.ttl) {
      return Boolean(cached.favorited);
    }
    if (cacheKey && favoriteStatusInflight.has(cacheKey)) {
      return favoriteStatusInflight.get(cacheKey);
    }

    const request = sendRuntimeMessage({
      type: "CHECK_FAVORITE_PRODUCT",
      payload: record
    })
      .then(result => {
        const favorited = Boolean(result?.ok && result.favorited);
        if (cacheKey) {
          favoriteStatusCache.set(cacheKey, {
            checkedAt: Date.now(),
            favorited,
            ttl: result?.ok ? FAVORITE_STATUS_CACHE_TTL : FAVORITE_STATUS_ERROR_TTL
          });
        }
        return favorited;
      })
      .catch(_error => {
        if (cacheKey) {
          favoriteStatusCache.set(cacheKey, {
            checkedAt: Date.now(),
            favorited: false,
            ttl: FAVORITE_STATUS_ERROR_TTL
          });
        }
        return false;
      })
      .finally(() => {
        if (cacheKey) {
          favoriteStatusInflight.delete(cacheKey);
        }
      });

    if (cacheKey) {
      favoriteStatusInflight.set(cacheKey, request);
    }
    return request;
  }

  function setButtonState(button, favorited) {
    const nextText = favorited ? "已收藏" : "收藏";
    const nextPressed = favorited ? "true" : "false";
    if (button.textContent !== nextText) {
      button.textContent = nextText;
    }
    if (button.getAttribute("aria-pressed") !== nextPressed) {
      button.setAttribute("aria-pressed", nextPressed);
    }
    button.classList.toggle("browser-plugin-favorited", favorited);
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

  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = [
      "position:fixed",
      "right:24px",
      "top:24px",
      "z-index:2147483647",
      "padding:10px 14px",
      "border-radius:4px",
      "color:#fff",
      "background:rgba(15,23,42,.92)",
      "font-size:14px",
      "line-height:20px",
      "box-shadow:0 8px 24px rgba(15,23,42,.18)"
    ].join(";");
    document.documentElement.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  async function saveFavorite(button) {
    const record = currentFavoriteRecord();
    const previousText = button.textContent;

    button.textContent = "收藏中...";
    button.disabled = true;

    let result;
    try {
      const productLink = await copyProductLinkFromPage();
      record.productLink = productLink;
      record.url = productLink;
      const status = await sendRuntimeMessage({ type: "ADMIN_STATUS" });
      if (!status?.ok) {
        throw new Error(status?.error || "读取后台登录状态失败");
      }
      if (status.sessionExpired) {
        throw new Error(status.error || "登录已过期，请重新登录");
      }
      if (!status.loggedIn) {
        throw new Error("请先打开插件弹窗，登录后台并选择品类");
      }
      if (!status.selectedCategory?.id) {
        throw new Error("请先打开插件弹窗，选择并保存品类");
      }
      const favoriteStatus = await sendRuntimeMessage({
        type: "CHECK_FAVORITE_PRODUCT",
        payload: record
      });
      if (!favoriteStatus?.ok) {
        throw new Error(favoriteStatus?.error || "查询商品是否已收藏失败");
      }
      if (favoriteStatus?.ok && favoriteStatus.favorited) {
        favoriteStatusCache.set(favoriteStatusKey(record), {
          checkedAt: Date.now(),
          favorited: true,
          ttl: FAVORITE_STATUS_CACHE_TTL
        });
        setButtonState(button, true);
        button.disabled = false;
        showToast("该商品已收藏");
        return;
      }
      record.videos = await collectFavoriteVideoUrlsForSave();

      if (record.images.length === 0 && record.videos.length === 0) {
        showToast("未找到图片或视频");
      }

      result = await sendRuntimeMessage({
        type: "DOWNLOAD_FAVORITE_PRODUCT",
        payload: record
      });
    } catch (error) {
      button.textContent = previousText || "收藏";
      button.disabled = false;
      showToast(`收藏失败：${error?.message || error}`);
      return;
    }

    if (!result?.ok) {
      button.textContent = previousText || "收藏";
      button.disabled = false;
      showToast(`收藏失败：${result?.error || "下载失败"}`);
      return;
    }

    setButtonState(button, true);
    favoriteStatusCache.set(favoriteStatusKey(record), {
      checkedAt: Date.now(),
      favorited: true,
      ttl: FAVORITE_STATUS_CACHE_TTL
    });
    button.disabled = false;
    showToast(`已收藏：${result.imageCount} 张图片，${result.videoCount} 个视频`);
  }

  async function downloadCurrentVideos(button, actionContainer) {
    const previousText = button.textContent;
    const record = {
      ...currentFavoriteRecord(),
      videos: currentActionVideoPayload(actionContainer)
    };

    if (record.videos.length === 0) {
      showToast("未找到当前视频");
      return;
    }

    button.textContent = "下载中...";
    button.disabled = true;
    try {
      const videoContent = await extractVideoContent(actionContainer);
      record.videoTitle = videoContent.videoTitle;
      record.videoCopy = videoContent.videoCopy;
      record.videoTopic = videoContent.videoTopic;
      await sendRuntimeMessage({
        type: "SAVE_SELECTION_VIDEO_CONTENT",
        payload: record
      });
      const result = await sendRuntimeMessage({
        type: "DOWNLOAD_PRODUCT_VIDEOS",
        payload: record
      });
      if (!result?.ok) {
        throw new Error(result?.error || "下载失败");
      }
      showToast(`已开始下载 ${result.videoCount || record.videos.length} 个视频`);
    } catch (error) {
      showToast(`下载失败：${error?.message || error}`);
    } finally {
      button.textContent = previousText || "下载视频";
      button.disabled = false;
    }
  }

  async function createFavoriteButton(cartButton, record = currentFavoriteRecord()) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(BUTTON_ATTR, "true");
    button.setAttribute("title", "收藏当前商品");
    button.dataset.favoriteId = favoriteStatusKey(record);

    if (cartButton.className && typeof cartButton.className === "string") {
      button.className = cartButton.className;
    } else {
      button.classList.add("browser-plugin-favorite-fallback");
    }
    syncButtonMetrics(button, cartButton);

    setButtonState(button, await isFavorited(record));
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      saveFavorite(button);
    });
    return button;
  }

  function createDownloadVideoButton(actionContainer) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "下载视频";
    button.setAttribute(DOWNLOAD_VIDEO_BUTTON_ATTR, "true");
    button.setAttribute("title", "下载当前视频");
    button.classList.add("browser-plugin-favorite-fallback");
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      downloadCurrentVideos(button, actionContainer);
    });
    return button;
  }

  function ensureDownloadVideoButtons() {
    const actionContainers = Array.from(document.querySelectorAll(VIDEO_ACTION_CONTAINER_SELECTOR))
      .filter(isVisible);
    if (actionContainers.length === 0) {
      removeDownloadVideoButtons();
      return;
    }

    const activeContainers = new Set(actionContainers);
    document.querySelectorAll(`[${DOWNLOAD_VIDEO_BUTTON_ATTR}="true"]`).forEach(button => {
      if (!button.parentElement || !activeContainers.has(button.parentElement)) {
        button.remove();
      }
    });

    actionContainers.forEach(actionContainer => {
      if (actionContainer.querySelector(`[${DOWNLOAD_VIDEO_BUTTON_ATTR}="true"]`)) {
        return;
      }
      actionContainer.appendChild(createDownloadVideoButton(actionContainer));
    });
  }

  async function ensureFavoriteCartButton() {
    const cartButton = findCartButton();
    if (!cartButton || cartButton.getAttribute(BUTTON_ATTR) === "true") {
      return;
    }

    const record = currentFavoriteRecord();
    const favoriteId = favoriteStatusKey(record);
    const previous = cartButton.previousElementSibling;
    if (previous?.getAttribute?.(BUTTON_ATTR) === "true") {
      syncButtonMetrics(previous, cartButton);
      if (previous.dataset.favoriteId !== favoriteId) {
        previous.dataset.favoriteId = favoriteId;
        setButtonState(previous, await isFavorited(record));
      }
      return;
    }

    removeFavoriteButtons();
    const favoriteButton = await createFavoriteButton(cartButton, record);
    cartButton.parentElement?.insertBefore(favoriteButton, cartButton);
  }

  async function ensureFavoriteButtonOnce() {
    if (!isTargetPage()) {
      removeFavoriteButtons();
      removeDownloadVideoButtons();
      return;
    }

    ensureStyle();
    await ensureFavoriteCartButton();
    ensureDownloadVideoButtons();
  }

  async function ensureFavoriteButton() {
    if (ensureInFlight) {
      ensurePending = true;
      return;
    }

    ensureInFlight = true;
    try {
      do {
        ensurePending = false;
        await ensureFavoriteButtonOnce();
      } while (ensurePending);
    } finally {
      ensureInFlight = false;
    }
  }

  function scheduleEnsureFavoriteButton() {
    window.clearTimeout(scheduleTimer);
    scheduleTimer = window.setTimeout(() => {
      ensureFavoriteButton();
    }, 200);
  }

  function watchRouteChanges() {
    const rawPushState = history.pushState;
    const rawReplaceState = history.replaceState;

    history.pushState = function pushState(...args) {
      const result = rawPushState.apply(this, args);
      scheduleEnsureFavoriteButton();
      return result;
    };

    history.replaceState = function replaceState(...args) {
      const result = rawReplaceState.apply(this, args);
      scheduleEnsureFavoriteButton();
      return result;
    };

    window.addEventListener("popstate", scheduleEnsureFavoriteButton);
  }

  function watchDomChanges() {
    if (!document.body) {
      window.setTimeout(watchDomChanges, 200);
      return;
    }
    const observer = new MutationObserver(scheduleEnsureFavoriteButton);
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleEnsureFavoriteButton();
  }

  setupAdminBridge();

  if (!contentScriptAlreadyLoaded) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== "HIGHLIGHT_PAGE_TITLE") {
        return;
      }

      const title = document.querySelector("h1") || document.body;
      const previousOutline = title.style.outline;
      const previousBackground = title.style.backgroundColor;

      title.style.outline = "3px solid #2563eb";
      title.style.backgroundColor = "rgba(37, 99, 235, 0.12)";

      window.setTimeout(() => {
        title.style.outline = previousOutline;
        title.style.backgroundColor = previousBackground;
      }, 1500);

      sendResponse({ ok: true });
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }
      if (changes[TARGET_DOMAIN_KEY]) {
        targetDomain = normalizeDomain(changes[TARGET_DOMAIN_KEY].newValue, DEFAULT_TARGET_DOMAIN);
        scheduleEnsureFavoriteButton();
      }
      if (changes[ADMIN_BASE_URL_KEY]) {
        loadAdminBridgeDomains();
      }
    });

    loadTargetDomain();
    loadAdminBridgeDomains();
    watchRouteChanges();
    watchDomChanges();
  }
})();
