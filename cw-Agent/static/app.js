function timeToSeconds(hhmmssmmm) {
  var parts = hhmmssmmm.split(":");
  var hours = parseInt(parts[0], 10);
  var minutes = parseInt(parts[1], 10);
  var secParts = parts[2].split(",");
  var seconds = parseInt(secParts[0], 10);
  var millis = parseInt(secParts[1], 10);
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

function basename(path) {
  return path.split("/").pop().split("\\").pop();
}

function showToast(message) {
  var toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function () {
    toast.classList.add("removing");
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function renderSubtitleList(entries) {
  var list = document.getElementById("subtitleList");
  list.innerHTML = "";
  entries.forEach(function (entry, index) {
    var item = document.createElement("div");
    item.className = "subtitle-item";
    item.setAttribute("data-index", index);

    var timeSpan = document.createElement("span");
    timeSpan.className = "subtitle-time";
    timeSpan.textContent = entry.start_time + " - " + entry.end_time;

    var textSpan = document.createElement("span");
    textSpan.className = "subtitle-text";
    textSpan.textContent = entry.text;

    item.appendChild(timeSpan);
    item.appendChild(textSpan);
    list.appendChild(item);
  });
}

window.subtitleEntries = [];

function authHeaders() {
  var token = document.getElementById("authToken").value.trim();
  if (token) {
    return { "Authorization": "Bearer " + token };
  }
  return {};
}

var IMAGE_KEYWORD_LIMIT = 6;
var IMAGE_KEYWORD_MAX_BYTES = 8 * 1024 * 1024;
var IMAGE_KEYWORD_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

function getKeywordMode() {
  var checked = document.querySelector('input[name="keywordMode"]:checked');
  return checked ? checked.value : "text";
}

function commonFormFields() {
  return {
    category: document.getElementById("category").value.trim(),
    title: document.getElementById("title").value.trim(),
    duration: parseInt(document.getElementById("duration").value, 10),
    platform: document.getElementById("platform").value,
    tone: document.getElementById("tone").value,
    language: document.getElementById("language").value,
    voice: document.getElementById("voice").value
  };
}

var FALLBACK_VOICE = {
  value: "zh-CN-XiaoxiaoNeural",
  label: "晓晓（女·普通话）"
};

function renderVoiceOptions(data) {
  var voiceSelect = document.getElementById("voice");
  var voices = data && Array.isArray(data.voices) ? data.voices : [];
  var defaultVoice = data && data.default ? data.default : FALLBACK_VOICE.value;
  if (voices.length === 0) {
    renderFallbackVoice();
    return;
  }
  voiceSelect.innerHTML = "";
  voices.forEach(function (v) {
    var option = document.createElement("option");
    option.value = v.value;
    option.textContent = v.label;
    if (v.value === defaultVoice) {
      option.selected = true;
    }
    voiceSelect.appendChild(option);
  });
}

function renderFallbackVoice() {
  var voiceSelect = document.getElementById("voice");
  voiceSelect.innerHTML = "";
  var option = document.createElement("option");
  option.value = FALLBACK_VOICE.value;
  option.textContent = FALLBACK_VOICE.label;
  option.selected = true;
  voiceSelect.appendChild(option);
}

function loadVoices(language) {
  fetch("/api/voices/" + language, { headers: authHeaders() })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("获取声音列表失败");
      }
      return response.json();
    })
    .then(function (data) {
      renderVoiceOptions(data);
    })
    .catch(function (error) {
      console.error("加载声音列表出错:", error);
      renderFallbackVoice();
    });
}

document.addEventListener("DOMContentLoaded", function () {
  var formCard = document.querySelector(".form-card");
  var submitBtn = document.getElementById("submitBtn");
  var loadingSpinner = document.getElementById("loadingSpinner");
  var resultSection = document.getElementById("resultSection");
  var copyText = document.getElementById("copyText");
  var metaInfo = document.getElementById("metaInfo");
  var languageSelect = document.getElementById("language");
  var audioPlayer = document.getElementById("audioPlayer");
  var subtitleOverlay = document.getElementById("subtitleOverlay");
  var subtitleList = document.getElementById("subtitleList");
  var imageKeywordInfo = document.getElementById("imageKeywordInfo");
  var textKeywordPanel = document.getElementById("textKeywordPanel");
  var imageKeywordPanel = document.getElementById("imageKeywordPanel");
  var keywordImagesInput = document.getElementById("keywordImages");
  var imageFileList = document.getElementById("imageFileList");
  var selectedKeywordImages = [];

  loadVoices(languageSelect.value);

  languageSelect.addEventListener("change", function () {
    loadVoices(languageSelect.value);
  });

  document.getElementById("authToken").addEventListener("input", function () {
    loadVoices(languageSelect.value);
  });

  function renderSelectedImages() {
    imageFileList.innerHTML = "";
    selectedKeywordImages.forEach(function (file, index) {
      var item = document.createElement("div");
      item.className = "image-file-item";

      var name = document.createElement("span");
      name.className = "image-file-name";
      name.textContent = file.name + " · " + formatFileSize(file.size);

      var removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "image-file-remove";
      removeButton.textContent = "移除";
      removeButton.addEventListener("click", function () {
        selectedKeywordImages.splice(index, 1);
        keywordImagesInput.value = "";
        renderSelectedImages();
      });

      item.appendChild(name);
      item.appendChild(removeButton);
      imageFileList.appendChild(item);
    });
  }

  function setKeywordMode(mode) {
    if (mode === "image") {
      textKeywordPanel.classList.add("hidden");
      imageKeywordPanel.classList.remove("hidden");
      document.getElementById("sellingPoints").value = "";
    } else {
      textKeywordPanel.classList.remove("hidden");
      imageKeywordPanel.classList.add("hidden");
      selectedKeywordImages = [];
      keywordImagesInput.value = "";
      renderSelectedImages();
    }
  }

  document.querySelectorAll('input[name="keywordMode"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      setKeywordMode(getKeywordMode());
    });
  });

  keywordImagesInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(keywordImagesInput.files || []);
    var nextFiles = selectedKeywordImages.slice();

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (IMAGE_KEYWORD_TYPES.indexOf(file.type) === -1) {
        showToast("仅支持 JPG、PNG、WebP 图片");
        continue;
      }
      if (file.size > IMAGE_KEYWORD_MAX_BYTES) {
        showToast(file.name + " 超过 8MB");
        continue;
      }
      if (nextFiles.length >= IMAGE_KEYWORD_LIMIT) {
        showToast("最多上传 6 张图片");
        break;
      }
      nextFiles.push(file);
    }

    selectedKeywordImages = nextFiles;
    keywordImagesInput.value = "";
    renderSelectedImages();
  });

  submitBtn.addEventListener("click", function (e) {
    e.preventDefault();

    var fields = commonFormFields();
    var mode = getKeywordMode();
    var requestUrl = "/api/generate";
    var requestOptions;

    if (!fields.category || !fields.title) {
      showToast("请填写品类和标题");
      return;
    }

    if (mode === "image") {
      if (selectedKeywordImages.length === 0) {
        showToast("请至少上传 1 张图片");
        return;
      }
      var formData = new FormData();
      Object.keys(fields).forEach(function (key) {
        formData.append(key, fields[key]);
      });
      selectedKeywordImages.forEach(function (file) {
        formData.append("images", file, file.name);
      });
      requestUrl = "/api/generate/images";
      requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: formData
      };
    } else {
      var sellingPoints = document.getElementById("sellingPoints").value.trim().split(",").map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
      if (sellingPoints.length === 0) {
        showToast("请填写至少 1 个关键词/卖点");
        return;
      }
      fields.selling_points = sellingPoints;
      requestOptions = {
        method: "POST",
        headers: Object.assign(
          { "Content-Type": "application/json" },
          authHeaders()
        ),
        body: JSON.stringify(fields)
      };
    }

    loadingSpinner.classList.remove("hidden");
    resultSection.classList.add("hidden");

    fetch(requestUrl, requestOptions)
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (err) {
            throw new Error(err.detail || "请求失败");
          });
        }
        return response.json();
      })
      .then(function (data) {
        loadingSpinner.classList.add("hidden");
        resultSection.classList.remove("hidden");

        copyText.innerText = data.marketing_copy.text;

        var copyTitle = document.getElementById("copyTitle");
        var copyTags = document.getElementById("copyTags");

        if (data.marketing_copy.title) {
          copyTitle.innerText = data.marketing_copy.title;
          copyTitle.style.display = "";
        } else {
          copyTitle.style.display = "none";
        }

        if (data.marketing_copy.tags && data.marketing_copy.tags.length > 0) {
          copyTags.innerText = data.marketing_copy.tags.join(" · ");
          copyTags.style.display = "";
        } else {
          copyTags.style.display = "none";
        }

        metaInfo.innerHTML =
          '<span>字数：' + data.marketing_copy.word_count + '</span>' +
          '<span>预计时长：' + data.marketing_copy.estimated_duration.toFixed(1) + ' 秒</span>';

        if (data.image_keywords && data.image_keywords.length > 0) {
          imageKeywordInfo.textContent = "图片关键词：" + data.image_keywords.join("、");
          imageKeywordInfo.style.display = "";
        } else {
          imageKeywordInfo.textContent = "";
          imageKeywordInfo.style.display = "none";
        }

        if (data.audio && data.audio.file_path) {
          audioPlayer.src = "/api/audio/" + basename(data.audio.file_path);
          audioPlayer.style.display = "";
        } else {
          audioPlayer.style.display = "none";
        }

        window.subtitleEntries = data.subtitle ? data.subtitle.entries : [];

        renderSubtitleList(window.subtitleEntries);

        subtitleOverlay.textContent = "";
      })
      .catch(function (error) {
        loadingSpinner.classList.add("hidden");
        showToast(error.message || "网络错误，请稍后重试");
      });
  });

  audioPlayer.addEventListener("timeupdate", function () {
    var current = audioPlayer.currentTime;
    var entries = window.subtitleEntries;
    var activeIndex = -1;

    for (var i = 0; i < entries.length; i++) {
      var startSec = timeToSeconds(entries[i].start_time);
      var endSec = timeToSeconds(entries[i].end_time);
      if (current >= startSec && current <= endSec) {
        activeIndex = i;
        break;
      }
    }

    if (activeIndex >= 0) {
      subtitleOverlay.textContent = entries[activeIndex].text;
    }

    var items = subtitleList.querySelectorAll(".subtitle-item");
    items.forEach(function (item, index) {
      if (index === activeIndex) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  });
});
