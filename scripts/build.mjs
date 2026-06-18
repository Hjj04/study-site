// 构建脚本：扫描 content/<课程>/ 下的文件，生成静态站点到 dist/
// 无第三方依赖，仅用 Node 内置模块。GitHub Action 会自动运行它。
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const TEMPLATE = path.join(ROOT, 'template');
const DIST = path.join(ROOT, 'dist');

// 课程分区定义（要增删/改名，改这里即可）
const COURSES = [
  { id: 'qhm5702', code: 'QHM5702', name: 'Complex Networks', color: '#6366f1' },
  { id: 'qhm6702', code: 'QHM6702', name: 'Deep Learning with Neural Networks', color: '#ec4899' },
  { id: 'qhm6703', code: 'QHM6703', name: 'Bayesian Statistics', color: '#14b8a6' },
  { id: 'qhm6704', code: 'QHM6704', name: 'Algorithmic Graph Theory', color: '#f59e0b' },
];

// 不计入资料列表的文件
const IGNORE = new Set(['.gitkeep', '_meta.json', '.DS_Store']);

function prettify(name) {
  const base = name.replace(/\.[^.]+$/, '');
  return base.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim() || name;
}

function kindOf(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['html', 'htm'].includes(ext)) return 'html';
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
  return 'other';
}

async function build() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(path.join(DIST, 'data'), { recursive: true });

  // 1) 拷贝前端模板到 dist 根目录（跳过 . 开头的隐藏文件，如 macOS 的 ._*）
  for (const f of await fs.readdir(TEMPLATE)) {
    if (f.startsWith('.')) continue;
    await fs.cp(path.join(TEMPLATE, f), path.join(DIST, f), { recursive: true });
  }

  // 2) 扫描各课程目录，收集资料
  const materials = [];
  for (const c of COURSES) {
    const dir = path.join(CONTENT, c.id);
    let entries = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { /* 目录不存在 */ }

    // 可选：content/<课程>/_meta.json 自定义标题与简介 { "文件名": {title, description} }
    let meta = {};
    try { meta = JSON.parse(await fs.readFile(path.join(dir, '_meta.json'), 'utf8')); } catch { /* 无 */ }

    for (const e of entries) {
      if (!e.isFile()) continue;
      const name = e.name;
      if (IGNORE.has(name) || name.startsWith('.') || name.startsWith('_')) continue;
      const stat = await fs.stat(path.join(dir, name));
      const ov = meta[name] || {};
      const kind = kindOf(name);

      // HTML 资料：优先取页面自身的 <title> 作为标题（比文件名好看），可被 _meta.json 覆盖
      let htmlTitle = null;
      if (kind === 'html') {
        try {
          const m = (await fs.readFile(path.join(dir, name), 'utf8')).match(/<title>([^<]*)<\/title>/i);
          if (m && m[1].trim()) htmlTitle = m[1].trim();
        } catch { /* 忽略 */ }
      }

      materials.push({
        id: `${c.id}/${name}`,
        course: c.id,
        title: ov.title || htmlTitle || prettify(name),
        description: ov.description || '',
        originalName: name,
        file: `content/${c.id}/${name}`, // 站内相对路径
        kind,
        size: stat.size,
        uploadedAt: Math.round(stat.mtimeMs),
      });

      // 拷贝该资料文件到 dist（只拷真正的资料，跳过 _meta.json/.gitkeep/._* 等）
      await fs.mkdir(path.join(DIST, 'content', c.id), { recursive: true });
      await fs.copyFile(path.join(dir, name), path.join(DIST, 'content', c.id, name));
    }
  }

  // 4) 生成数据文件
  const counts = {};
  for (const m of materials) counts[m.course] = (counts[m.course] || 0) + 1;
  const courses = COURSES.map((c) => ({ ...c, count: counts[c.id] || 0 }));
  await fs.writeFile(path.join(DIST, 'data', 'courses.json'), JSON.stringify(courses, null, 2));
  await fs.writeFile(path.join(DIST, 'data', 'materials.json'), JSON.stringify(materials, null, 2));

  // 5) 关闭 Jekyll，避免忽略下划线开头的文件/目录
  await fs.writeFile(path.join(DIST, '.nojekyll'), '');

  console.log(`✓ 已生成 ${materials.length} 份资料 / ${COURSES.length} 个课程 → dist/`);
}

build().catch((e) => { console.error(e); process.exit(1); });
