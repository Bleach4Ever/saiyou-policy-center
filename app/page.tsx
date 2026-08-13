"use client";

import { FormEvent, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => <div className="pdf-component"><div className="pdf-component-stage"><div className="pdf-loading"><i /><span>正在启动 PDF 阅读器…</span></div></div></div>,
});

type PolicyDocument = {
  id: number;
  title: string;
  type: "PDF" | "DOCX" | "XLSX";
  date: string;
  owner: string;
  size: string;
  url?: string;
  pages?: number;
};

type PolicySection = {
  id: number;
  name: string;
  description: string;
  tone: string;
  mark: string;
  documents: PolicyDocument[];
};

const initialSections: PolicySection[] = [
  {
    id: 1,
    name: "人力制度",
    description: "员工行为、福利与组织管理规范",
    tone: "indigo",
    mark: "HR",
    documents: [
      { id: 106, title: "新员工入职指引", type: "PDF", date: "2026-07-28", owner: "人力资源中心", size: "3.7 MB", pages: 10 },
      { id: 101, title: "CU-赛优四红线管理制度", type: "PDF", date: "2026-03-30", owner: "聂琼", size: "2.4 MB" },
      { id: 102, title: "CU-人力部-内部推荐管理制度", type: "DOCX", date: "2024-05-30", owner: "张艺杰", size: "860 KB" },
      { id: 103, title: "CU-渠道资源管制制度", type: "PDF", date: "2024-12-19", owner: "张艺杰", size: "1.7 MB" },
      { id: 104, title: "CU-赛优宿舍管理制度", type: "PDF", date: "2024-09-24", owner: "张艺杰", size: "1.2 MB" },
      { id: 105, title: "CU-赛优员工手册", type: "PDF", date: "2024-07-29", owner: "张艺杰", size: "8.6 MB" },
    ],
  },
  {
    id: 2,
    name: "财务制度",
    description: "付款、报销、合同与印章管理",
    tone: "emerald",
    mark: "FN",
    documents: [
      { id: 201, title: "CU-赛优付款及报销管理制度-2026", type: "PDF", date: "2026-04-15", owner: "聂琼", size: "3.1 MB" },
      { id: 202, title: "CU-赛优付款及报销管理制度-2025", type: "PDF", date: "2024-05-29", owner: "张艺杰", size: "2.8 MB" },
      { id: 203, title: "CU-赛优合同管理制度", type: "DOCX", date: "2024-05-30", owner: "张艺杰", size: "720 KB" },
      { id: 204, title: "CU-赛优印章管理制度", type: "PDF", date: "2024-05-30", owner: "张艺杰", size: "1.4 MB" },
    ],
  },
  {
    id: 3,
    name: "产研制度",
    description: "资产、账号与营销终端规范",
    tone: "violet",
    mark: "RD",
    documents: [
      { id: 301, title: "CU-产研部-（产研）资产管理制度", type: "PDF", date: "2026-03-30", owner: "聂琼", size: "2.1 MB" },
      { id: 302, title: "CU-产研部门手机卡管理制度", type: "DOCX", date: "2024-05-30", owner: "张艺杰", size: "640 KB" },
      { id: 303, title: "CU-产研部门账号权限管理制度", type: "PDF", date: "2024-05-30", owner: "张艺杰", size: "1.1 MB" },
      { id: 304, title: "CU-产研部门营销终端管理制度", type: "PDF", date: "2024-05-30", owner: "张艺杰", size: "1.5 MB" },
    ],
  },
  {
    id: 4,
    name: "CEO 办公室",
    description: "公司级治理与合规制度",
    tone: "amber",
    mark: "CO",
    documents: [
      { id: 401, title: "合同管理制度", type: "PDF", date: "2026-04-15", owner: "聂琼", size: "2.6 MB" },
      { id: 402, title: "个人信息保护制度", type: "PDF", date: "2025-07-16", owner: "吴思雨", size: "3.4 MB" },
      { id: 403, title: "知识产权管理制度", type: "DOCX", date: "2025-06-27", owner: "吴思雨", size: "940 KB" },
      { id: 404, title: "CU-招生及服务质检总则", type: "PDF", date: "2024-06-24", owner: "张艺杰", size: "4.2 MB" },
    ],
  },
  {
    id: 5,
    name: "竞合规则",
    description: "业务合作与判单规则",
    tone: "rose",
    mark: "CP",
    documents: [
      { id: 501, title: "CU-竞合判单规则", type: "XLSX", date: "2024-06-24", owner: "张艺杰", size: "380 KB" },
    ],
  },
  {
    id: 6,
    name: "部门制度及工作标准",
    description: "各业务部门工作规则与标准",
    tone: "sky",
    mark: "DP",
    documents: [
      { id: 601, title: "CU-运管部门分人分量工作标准", type: "PDF", date: "2025-04-02", owner: "张艺杰", size: "1.3 MB" },
      { id: 602, title: "CU-心理业务部生日福利制度", type: "DOCX", date: "2025-04-02", owner: "张艺杰", size: "610 KB" },
      { id: 603, title: "CU-心理业务部报销制度", type: "PDF", date: "2025-04-02", owner: "张艺杰", size: "1.6 MB" },
      { id: 604, title: "CU-赛优内部员工参考规则", type: "PDF", date: "2025-04-02", owner: "张艺杰", size: "2.2 MB" },
      { id: 605, title: "CU-国际项目质检规则", type: "PDF", date: "2025-04-02", owner: "张艺杰", size: "1.8 MB" },
    ],
  },
];

export default function Home() {
  const [sections, setSections] = useState(initialSections);
  const [activeSection, setActiveSection] = useState<number | "all">("all");
  const [adminMode, setAdminMode] = useState(true);
  const [preview, setPreview] = useState<PolicyDocument | null>(null);
  const [dialog, setDialog] = useState<"section" | "upload" | null>(null);
  const [toast, setToast] = useState("");

  const visibleSections = useMemo(() => {
    return sections
      .filter((section) => activeSection === "all" || section.id === activeSection)
      .map((section) => ({ ...section }));
  }, [activeSection, sections]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function addSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    if (!name) return;
    setSections((items) => [
      ...items,
      {
        id: Date.now(),
        name,
        description: description || "待补充分区说明",
        tone: "indigo",
        mark: name.slice(0, 2).toUpperCase(),
        documents: [],
      },
    ]);
    setDialog(null);
    flash("分区已创建");
  }

  function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sectionId = Number(form.get("sectionId"));
    const file = form.get("file");
    const fileName = file instanceof File ? file.name : "";
    const extension = fileName.split(".").pop()?.toLowerCase();
    const type: PolicyDocument["type"] = extension === "doc" || extension === "docx"
      ? "DOCX"
      : extension === "xls" || extension === "xlsx"
        ? "XLSX"
        : "PDF";
    const title = String(form.get("title") || "").trim() || fileName.replace(/\.[^.]+$/, "") || "新上传的制度文档";
    setSections((items) => items.map((section) => section.id === sectionId ? {
      ...section,
      documents: [...section.documents, {
        id: Date.now(),
        title,
        type,
        date: "2026-08-03",
        owner: "贾浩楠",
        size: "1.2 MB",
      }],
    } : section));
    setDialog(null);
    flash("文档上传成功");
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <nav className="topbar shell" aria-label="主导航">
          <div className="brand">
            <span className="brand-symbol"><i /><i /><i /></span>
            <span>
              <b>赛优制度</b>
              <small>CU POLICY CENTER</small>
            </span>
          </div>
          <div className="top-actions">
            {adminMode && <span className="admin-badge"><i /> 管理员视图</span>}
            <label className="mode-switch">
              <span>管理模式</span>
              <input type="checkbox" checked={adminMode} onChange={(event) => setAdminMode(event.target.checked)} />
              <i aria-hidden="true" />
            </label>
            <button className="profile" aria-label="当前用户">
              <span>贾</span>
              <b>贾浩楠</b>
            </button>
          </div>
        </nav>

        <div className="hero-content shell">
          <div className="eyebrow"><span>CU</span> 企业制度统一发布平台</div>
          <h1>赛优制度</h1>
        </div>
      </section>

      <section className="content shell">
        <header className="content-header">
          <div>
            <span className="section-kicker">POLICY LIBRARY</span>
            <h2>制度资料库</h2>
          </div>
          {adminMode && (
            <div className="admin-actions">
              <button className="ghost-button" onClick={() => setDialog("section")}><b>＋</b> 新建分区</button>
              <button className="primary-button" onClick={() => setDialog("upload")}><b>↑</b> 上传文档</button>
            </div>
          )}
        </header>

        <div className="filters" role="tablist" aria-label="制度分区筛选">
          <button className={activeSection === "all" ? "active" : ""} onClick={() => setActiveSection("all")}>全部</button>
          {sections.map((section) => (
            <button key={section.id} className={activeSection === section.id ? "active" : ""} onClick={() => setActiveSection(section.id)}>
              {section.name}<span>{section.documents.length}</span>
            </button>
          ))}
        </div>

        {visibleSections.length > 0 ? (
          <div className="section-grid">
            {visibleSections.map((section) => (
              <article className={`policy-card tone-${section.tone}`} key={section.id}>
                <header className="card-header">
                  <span className="section-mark">{section.mark}</span>
                  <div>
                    <h3>{section.name}</h3>
                    <p>{section.description}</p>
                  </div>
                  <span className="count-pill">{section.documents.length} 份</span>
                  {adminMode && <button className="more-button" aria-label={`管理${section.name}`}>•••</button>}
                </header>
                <div className="documents">
                  {section.documents.map((doc) => (
                    <button className="document-row" key={doc.id} onClick={() => setPreview(doc)}>
                      {adminMode && <span className="drag-handle" aria-label="拖拽排序">⠿</span>}
                      <span className={`file-badge file-${doc.type.toLowerCase()}`}>{doc.type}</span>
                      <span className="document-main">
                        <b>{doc.title}</b>
                        <small>更新于 {doc.date} · {doc.owner}</small>
                      </span>
                      <span className="file-size">{doc.size}</span>
                      <span className="preview-ready"><i /> 在线预览</span>
                      <span className="arrow" aria-hidden="true">↗</span>
                    </button>
                  ))}
                  {section.documents.length === 0 && <div className="empty-card">该分区暂时还没有文档</div>}
                </div>
                <footer className="card-footer">
                  <button onClick={() => setActiveSection(section.id)}>查看全部 <b>→</b></button>
                </footer>
              </article>
            ))}
            {adminMode && activeSection === "all" && (
              <button className="create-card" onClick={() => setDialog("section")}>
                <span>＋</span>
                <b>创建新分区</b>
                <small>为新的制度类型建立独立区域</small>
              </button>
            )}
          </div>
        ) : (
          <div className="no-result">
            <span>⌕</span>
            <h3>没有找到相关制度</h3>
            <p>换一个关键词试试，或查看其他分区。</p>
            <button onClick={() => setActiveSection("all")}>查看全部分区</button>
          </div>
        )}
      </section>

      <footer className="site-footer shell">
        <span>© 2026 赛优集团 · 赛优制度</span>
      </footer>

      {preview && (
        <div className="overlay" role="presentation" onMouseDown={() => setPreview(null)}>
          <section className="preview-dialog" role="dialog" aria-modal="true" aria-label="文档预览" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div className={`large-file file-${preview.type.toLowerCase()}`}>{preview.type}</div>
              <div><span>制度文档预览</span><h3>{preview.title}</h3></div>
              <button onClick={() => setPreview(null)} aria-label="关闭">×</button>
            </header>
            {!(preview.type === "PDF" && preview.url) && (
              <div className="viewer-toolbar">
                <span>{preview.type === "PDF" ? `第 1 / ${preview.pages || 12} 页` : preview.type === "DOCX" ? "页面视图 · 100%" : "工作表视图 · 100%"}</span>
                <div><button aria-label="缩小">−</button><b>100%</b><button aria-label="放大">＋</button></div>
              </div>
            )}
            {preview.type === "PDF" && (
              preview.url ? (
                <PdfViewer url={preview.url} title={preview.title} expectedPages={preview.pages} />
              ) : (
                <div className="paper-preview pdf-viewer">
                  <div className="paper">
                    <span className="paper-logo">CU</span>
                    <p>赛优教育科技有限公司</p>
                    <h4>{preview.title}</h4>
                    <i />
                    <small>制度编号：CU-POLICY-2026-001</small>
                    <div className="paper-lines"><b /><b /><b /><b /><b /><b /></div>
                  </div>
                </div>
              )
            )}
            {preview.type === "DOCX" && (
              <div className="paper-preview word-viewer">
                <div className="word-page">
                  <div className="word-title"><span className="paper-logo">CU</span><div><small>赛优教育科技有限公司</small><h4>{preview.title}</h4></div></div>
                  <p className="word-number">文件编号：CU-HR-2026-001　　版本：V2.1</p>
                  <h5>第一章　总则</h5>
                  <p>第一条　为规范公司制度管理，明确职责权限，提高工作效率，根据公司管理要求，制定本制度。</p>
                  <p>第二条　本制度适用于赛优集团全体员工及相关业务部门，各部门应严格遵照执行。</p>
                  <h5>第二章　管理规范</h5>
                  <p>第三条　制度内容以制度中心发布的最新有效版本为准。员工可通过钉钉工作台在线查阅。</p>
                  <div className="word-table"><span>责任部门</span><b>人力资源中心</b><span>生效日期</span><b>2026 年 8 月 3 日</b></div>
                </div>
              </div>
            )}
            {preview.type === "XLSX" && (
              <div className="excel-viewer">
                <div className="formula-bar"><span>fx</span><b>A1</b><p>CU 竞合判单规则</p></div>
                <div className="sheet-grid" role="table" aria-label="Excel 在线预览">
                  <span className="corner" />
                  {["A", "B", "C", "D", "E"].map((cell) => <b className="column-head" key={cell}>{cell}</b>)}
                  {[
                    ["1", "序号", "业务场景", "判定标准", "责任部门", "备注"],
                    ["2", "01", "重复线索", "以首次有效录入为准", "运营中心", "正常"],
                    ["3", "02", "跨部门协作", "按协作发起时间判定", "业务部门", "正常"],
                    ["4", "03", "客户归属", "以有效跟进记录为准", "销售中心", "复核"],
                    ["5", "04", "特殊情形", "提交负责人共同确认", "CEO 办公室", "审批"],
                    ["6", "05", "争议处理", "两个工作日内完成复核", "运营中心", "正常"],
                  ].flatMap((row) => row.map((cell, index) => index === 0
                    ? <b className="row-head" key={`${row[0]}-${index}`}>{cell}</b>
                    : <span className={row[0] === "1" ? "sheet-head" : ""} key={`${row[0]}-${index}`}>{cell}</span>))}
                </div>
                <div className="sheet-tabs"><button>＋</button><button className="active">竞合判单规则</button><button>说明</button></div>
              </div>
            )}
            <footer>
              <span>{preview.type} · {preview.size} · {preview.owner}</span>
              <div>
                <button className="ghost-button" onClick={() => preview.url ? window.open(preview.url, "_blank") : flash("已开始下载")}>下载文档</button>
                <button className="primary-button" onClick={() => preview.url ? window.open(preview.url, "_blank", "noopener,noreferrer") : flash("已在新窗口打开")}>在新窗口打开 ↗</button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {dialog === "section" && (
        <div className="overlay" role="presentation" onMouseDown={() => setDialog(null)}>
          <form className="form-dialog" onSubmit={addSection} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>管理分区</span><h3>创建新的制度分区</h3></div><button type="button" onClick={() => setDialog(null)}>×</button></header>
            <label>分区名称<input name="name" placeholder="例如：信息安全制度" autoFocus required /></label>
            <label>分区说明<textarea name="description" placeholder="一句话说明该分区包含的内容" rows={3} /></label>
            <footer><button type="button" className="ghost-button" onClick={() => setDialog(null)}>取消</button><button className="primary-button">创建分区</button></footer>
          </form>
        </div>
      )}

      {dialog === "upload" && (
        <div className="overlay" role="presentation" onMouseDown={() => setDialog(null)}>
          <form className="form-dialog upload-dialog" onSubmit={uploadDocument} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>文档管理</span><h3>上传制度文档</h3></div><button type="button" onClick={() => setDialog(null)}>×</button></header>
            <label>所属分区<select name="sectionId" defaultValue={sections[0]?.id}>{sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}</select></label>
            <label>展示名称<input name="title" placeholder="不填写则使用原文件名" /></label>
            <label className="dropzone">
              <input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" required />
              <span>↑</span><b>点击选择或拖拽文档到这里</b><small>支持 PDF、Word（DOC/DOCX）、Excel（XLS/XLSX），均可在线预览</small>
            </label>
            <footer><button type="button" className="ghost-button" onClick={() => setDialog(null)}>取消</button><button className="primary-button">确认上传</button></footer>
          </form>
        </div>
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
