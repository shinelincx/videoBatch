# Browser Plugin

Chrome Manifest V3 插件工程。

## 目录结构

```text
browser-plugin/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   └── content-script.js
└── popup/
    ├── popup.html
    ├── popup.css
    └── popup.js
```

## 本地加载

1. 打开 Chrome，进入 `chrome://extensions/`
2. 打开右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择本目录：`browser-plugin`

## 当前功能

- popup 显示当前标签页标题和 URL
- popup 支持配置后台地址并登录后台，默认地址为 `http://127.0.0.1:8080`
- 登录后从后台 `/base/category/list` 获取商品类目，并按层级显示为品类菜单
- 收藏前需要先登录后台并保存一个收藏品类
- background service worker 记录安装时间
- 在百应选品页 `https://buyin.jinritemai.com/dashboard/merch-picking-library/merch-promoting` 的“加选品车”按钮左侧插入“收藏”按钮
- 在百应选品页的“带货内容 / 视频”区域，为 `.auxo-spin-container [class^="index_module__action"]` 插入“下载视频”按钮；需先收藏商品创建本地 `{商品id}` 文件夹，视频保存为 `{商品id}/mv/mv_{下标}.mp4`
- 点击“收藏”后按 CSS 选择器采集商品标题、账号昵称、商品链接、佣金率、佣金、价格、商品评分、带货人数、商铺名称、图片、主图视频，写入后台选品记录，并下载到保存目录；收藏不会下载“带货内容 / 视频”区域的视频
- 下载目录结构：默认 `浏览器默认下载目录/{商品id}/img/image_{下标}.jpg`、`浏览器默认下载目录/{商品id}/mv/video_{下标}.mp4`；图片会跳过 `.webp`、`.svg`；“下载视频”按钮保存为 `{商品id}/mv/mv_{下标}.mp4`；填写保存目录后为 `{保存目录}/{商品id}/...`
- 是否“已收藏”通过后台 `选品记录` 判断

## 使用流程

1. 重新加载插件
2. 点击插件图标，填写后台地址、账号、密码，并点击“登录后台”
3. 在“收藏品类”里选择后台商品类目，点击“保存品类”
4. 打开百应选品详情页，点击“收藏”
