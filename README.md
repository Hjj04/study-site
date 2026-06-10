# 学习资料分享平台（GitHub Pages 静态版）

按课程分区分享学习资料（HTML 知识点页 / PDF / 图片）。访客**点链接即看，无需下载**，
永久免费在线。你把文件放进对应课程文件夹，提交后 GitHub Action 自动重新生成并发布。

课程分区：QHM5702 Complex Networks · QHM6702 Deep Learning · QHM6703 Bayesian Statistics · QHM6704 Algorithmic Graph Theory

---

## 一、首次部署到 GitHub Pages（约 5 分钟，做一次）

1. 在 GitHub 新建一个仓库（Public），例如 `study-site`。
2. 把本目录推上去：
   ```bash
   cd study-site
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/study-site.git
   git push -u origin main
   ```
3. 仓库页面 → **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
4. 稍等 Action 跑完（仓库 **Actions** 标签可看进度），网站就上线在：
   `https://<你的用户名>.github.io/study-site/`
   把这个网址发给谁，谁就能访问。

> 之后每次 `push` 到 `main`（包括在网页上传文件），都会自动重新发布。

---

## 二、日常添加资料（最常用）

**完全不用敲命令**，在 GitHub 网页上操作即可：

1. 进入仓库的 `content/` → 对应课程文件夹（如 `content/qhm5702/`）。
2. 点 **Add file → Upload files**，把单个 `.html`（或 PDF、图片）拖进去。
3. 点 **Commit changes**。
4. 约 1 分钟后刷新网站，新资料就出现在该课程下了。

> 想本地批量添加：把文件放进 `content/<课程>/`，然后 `git add . && git commit -m "add" && git push`。

---

## 三、本地预览（可选）

```bash
cd study-site
npm run preview      # 构建并在 http://localhost:8000 预览
```
（用到 Node 与 python3，均为系统自带。也可只 `npm run build` 后用任意静态服务器打开 `dist/`。）

---

## 四、自定义标题 / 简介（可选）

默认标题取自文件名。想要更好看的标题和说明，在课程文件夹放一个 `_meta.json`：

```json
{
  "L3_centrality.html": { "title": "第3讲 · 中心性度量", "description": "度数/接近/介数中心性" },
  "notes.pdf":          { "title": "复习提纲" }
}
```

---

## 五、增删 / 改名课程分区

编辑 `scripts/build.mjs` 顶部的 `COURSES` 数组（`id` 对应 `content/` 下的文件夹名），
并在 `content/` 下建好对应文件夹，提交即可。

---

## 目录结构

```
study-site/
├── content/                 # ← 你的资料放这里（按课程分文件夹）
│   ├── qhm5702/ qhm6702/ qhm6703/ qhm6704/
├── template/                # 站点前端（首页/课程页/查看页/样式/脚本）
├── scripts/build.mjs        # 构建：扫描 content/ 生成 dist/
├── .github/workflows/deploy.yml   # 推送后自动构建并发布到 Pages
├── dist/                    # 构建产物（自动生成，已被 .gitignore）
└── README.md
```

## 注意事项

- HTML 知识点页建议做成**单个自包含文件**（CSS/JS 内联，或用 CDN 链接），上传一个 `.html` 即可完整显示。
- 网站是公开的，**不要上传隐私或受版权限制的内容**。
- 上传的 HTML 在隔离的沙箱 iframe 中渲染，不会影响本站其它页面。
