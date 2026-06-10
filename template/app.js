'use strict';

/* 通用工具 */
const $ = (sel, el = document) => el.querySelector(sel);
const qs = (k) => new URLSearchParams(location.search).get(k);

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtSize(b) {
  if (b == null) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

function fmtDate(ts) {
  try { return new Date(ts).toLocaleDateString('zh-CN'); } catch { return ''; }
}

function iconFor(kind) {
  return { html: '🌐', pdf: '📕', image: '🖼️', video: '🎬', other: '📄' }[kind] || '📄';
}

/* ---------------- 首页 ---------------- */
async function initHome() {
  const box = $('#courses');
  try {
    const courses = await getJSON('data/courses.json');
    box.innerHTML = courses.map((c) => `
      <a class="course-card" href="course.html?id=${c.id}" style="border-top-color:${c.color}">
        <div class="code" style="color:${c.color}">${esc(c.code)}</div>
        <div class="name">${esc(c.name)}</div>
        <div class="count">${c.count} 份资料</div>
      </a>`).join('');
  } catch (e) {
    box.innerHTML = `<p class="status err">加载失败：${esc(e.message)}</p>`;
  }
}

/* ---------------- 课程页 ---------------- */
async function initCourse() {
  const id = qs('id');
  let courses, mats;
  try {
    [courses, mats] = await Promise.all([
      getJSON('data/courses.json'),
      getJSON('data/materials.json'),
    ]);
  } catch (e) {
    $('#materials').innerHTML = `<p class="status err">加载失败：${esc(e.message)}</p>`;
    return;
  }

  const course = courses.find((c) => c.id === id);
  if (!course) {
    $('#course-name').textContent = '未找到该课程';
    $('#materials').innerHTML = '<p class="empty">无效的课程链接。<a href="index.html">返回首页</a></p>';
    return;
  }

  document.title = `${course.code} ${course.name} · 学习资料分享平台`;
  $('#crumb-course').textContent = course.code;
  $('#course-code').textContent = course.code;
  $('#course-code').style.background = course.color;
  $('#course-name').textContent = course.name;
  $('#cdir').textContent = course.id;

  const list = mats.filter((m) => m.course === id).sort((a, b) => b.uploadedAt - a.uploadedAt);
  const box = $('#materials');
  if (!list.length) {
    box.innerHTML = `<p class="empty">这个课程还没有资料。<br>把 .html 放进 <code>content/${esc(id)}/</code> 即可在此显示 👆</p>`;
    return;
  }
  box.innerHTML = list.map((m) => `
    <div class="material">
      <div class="ficon">${iconFor(m.kind)}</div>
      <div class="meta">
        <div class="mtitle">${esc(m.title)}</div>
        ${m.description ? `<div class="mdesc">${esc(m.description)}</div>` : ''}
        <div class="msub">${esc(m.originalName)} · ${fmtSize(m.size)} · ${fmtDate(m.uploadedAt)}</div>
      </div>
      <div class="actions">
        <a class="btn small primary" href="view.html?id=${encodeURIComponent(m.id)}">查看</a>
        <a class="btn small" href="${esc(m.file)}" download="${esc(m.originalName)}">下载</a>
      </div>
    </div>`).join('');
}

/* ---------------- 查看页 ---------------- */
async function initView() {
  const id = qs('id');
  let mats;
  try {
    mats = await getJSON('data/materials.json');
  } catch (e) {
    $('#v-title').textContent = '加载失败';
    $('#v-body').innerHTML = `<p class="status err">${esc(e.message)}</p>`;
    return;
  }
  const m = mats.find((x) => x.id === id);
  if (!m) {
    $('#v-title').textContent = '资料不存在';
    $('#v-body').innerHTML = '<p class="empty">这份资料可能已被移除。<a href="index.html">返回首页</a></p>';
    return;
  }

  document.title = m.title + ' · 学习资料分享平台';
  $('#v-title').textContent = m.title;
  $('#v-desc').textContent = m.description || '';
  $('#crumb-course').textContent = m.course.toUpperCase();
  $('#crumb-course').href = 'course.html?id=' + m.course;

  $('#v-actions').innerHTML = `
    <a class="btn" href="${esc(m.file)}" target="_blank" rel="noopener">新标签打开</a>
    <a class="btn primary" href="${esc(m.file)}" download="${esc(m.originalName)}">下载</a>`;

  const body = $('#v-body');
  if (m.kind === 'html') {
    // 沙箱 iframe：允许其自身脚本运行，但与本站隔离
    body.innerHTML = `<iframe class="viewer-frame" src="${esc(m.file)}"
      sandbox="allow-scripts allow-popups allow-forms allow-modals"></iframe>`;
  } else if (m.kind === 'pdf') {
    body.innerHTML = `<iframe class="viewer-frame" src="${esc(m.file)}"></iframe>`;
  } else if (m.kind === 'image') {
    body.innerHTML = `<img class="viewer-img" src="${esc(m.file)}" alt="${esc(m.title)}">`;
  } else if (m.kind === 'video') {
    body.innerHTML = `<video class="viewer-frame" src="${esc(m.file)}" controls></video>`;
  } else {
    body.innerHTML = `<div class="viewer-fallback">
      <p class="ficon" style="font-size:48px;">📄</p>
      <p>该文件类型不支持网页预览。</p>
      <a class="btn primary" href="${esc(m.file)}" download="${esc(m.originalName)}">下载文件</a></div>`;
  }
}

/* ---------------- 路由 ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'home') initHome();
  else if (page === 'course') initCourse();
  else if (page === 'view') initView();
});
