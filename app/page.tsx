"use client";

import { FormEvent, KeyboardEvent, lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  PolicyApiError,
  PolicyDocument,
  PolicySection,
  PolicyUser,
  policyApi,
  resolvePolicyToken,
  setPolicyToken,
} from "./policy-api";

const PdfViewer = lazy(() => import("./PdfViewer"));
const OfficeViewer = lazy(() => import("./OfficeViewer"));

type PreviewDocument = PolicyDocument & { url: string };
type DialogState =
  | { type: "section-create" }
  | { type: "section-edit"; section: PolicySection }
  | { type: "upload"; sectionId?: number }
  | { type: "document-edit"; document: PolicyDocument }
  | null;

const tones = ["indigo", "emerald", "violet", "amber", "rose", "sky"];

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  return `${size >= 10 || index === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`;
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date)
    .replace(/\//g, "-");
}

function fileLabel(document: PolicyDocument) {
  const extension = document.fileExtension?.toUpperCase();
  if (extension) return extension;
  if (document.previewType === "WORD") return "DOCX";
  if (document.previewType === "EXCEL") return "XLSX";
  return "PDF";
}

function errorMessage(error: unknown) {
  return error instanceof PolicyApiError ? error.message : "操作没有完成，请稍后重试";
}

export default function Home() {
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [currentUser, setCurrentUser] = useState<PolicyUser | null>(null);
  const [activeSection, setActiveSection] = useState<number | "all">("all");
  const [adminMode, setAdminMode] = useState(false);
  const [preview, setPreview] = useState<PreviewDocument | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const canManage = Boolean(currentUser?.canManage);

  const loadPolicies = useCallback(async (withLoading = true) => {
    if (withLoading) setLoading(true);
    setLoadError("");
    try {
      const data = await policyApi.bootstrap();
      const ordered = [...(data.sections || [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => ({
          ...section,
          documents: [...(section.documents || [])].sort((a, b) => a.sortOrder - b.sortOrder),
        }));
      setSections(ordered);
      setCurrentUser(data.user);
      setAdminMode(data.user.canManage);
      setActiveSection((selected) => selected === "all" || ordered.some((item) => item.id === selected) ? selected : "all");
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    resolvePolicyToken()
      .then((token) => {
        if (!active) return;
        setPolicyToken(token);
        return loadPolicies();
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(errorMessage(error));
        setLoading(false);
      });
    return () => { active = false; };
  }, [loadPolicies]);

  const visibleSections = useMemo(() => (
    sections.filter((section) => activeSection === "all" || section.id === activeSection)
  ), [activeSection, sections]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function runMutation(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      await loadPolicies(false);
      setDialog(null);
      flash(success);
    } catch (error) {
      flash(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      code: String(form.get("code") || "").trim().toUpperCase(),
      description: String(form.get("description") || "").trim(),
    };
    if (!payload.name || !payload.code) return;
    if (dialog?.type === "section-edit") {
      await runMutation(() => policyApi.updateSection(dialog.section.id, payload), "分区已更新");
    } else {
      await runMutation(() => policyApi.createSection(payload), "分区已创建");
    }
  }

  async function removeSection(section: PolicySection) {
    if (!window.confirm(`确定删除“${section.name}”分区吗？`)) return;
    await runMutation(() => policyApi.deleteSection(section.id), "分区已删除");
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runMutation(() => policyApi.uploadDocument(form), "文档上传成功");
  }

  async function saveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog?.type !== "document-edit") return;
    const form = new FormData(event.currentTarget);
    await runMutation(() => policyApi.updateDocument(dialog.document.id, {
      title: String(form.get("title") || "").trim(),
      sectionId: Number(form.get("sectionId")),
    }), "文档已更新");
  }

  async function removeDocument(document: PolicyDocument) {
    if (!window.confirm(`确定删除“${document.title}”吗？`)) return;
    await runMutation(() => policyApi.deleteDocument(document.id), "文档已删除");
  }

  async function moveSection(sectionId: number, direction: -1 | 1) {
    const index = sections.findIndex((item) => item.id === sectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return;
    const ordered = [...sections];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setSections(ordered);
    try {
      await policyApi.sortSections(ordered.map((item) => item.id));
      flash("分区顺序已调整");
    } catch (error) {
      await loadPolicies(false);
      flash(errorMessage(error));
    }
  }

  async function moveDocument(sectionId: number, documentId: number, direction: -1 | 1) {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;
    const index = section.documents.findIndex((item) => item.id === documentId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= section.documents.length) return;
    const documents = [...section.documents];
    [documents[index], documents[target]] = [documents[target], documents[index]];
    setSections((items) => items.map((item) => item.id === sectionId ? { ...item, documents } : item));
    try {
      await policyApi.sortDocuments(sectionId, documents.map((item) => item.id));
      flash("文档顺序已调整");
    } catch (error) {
      await loadPolicies(false);
      flash(errorMessage(error));
    }
  }

  async function openPreview(document: PolicyDocument) {
    if (previewLoadingId !== null) return;
    setPreviewLoadingId(document.id);
    try {
      const signed = await policyApi.documentUrl(document.id);
      setPreview({ ...document, ...signed });
    } catch (error) {
      flash(errorMessage(error));
    } finally {
      setPreviewLoadingId(null);
    }
  }

  function openPreviewByKeyboard(event: KeyboardEvent<HTMLDivElement>, document: PolicyDocument) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void openPreview(document);
    }
  }

  async function openDocument(download: boolean) {
    if (!preview) return;
    const popup = window.open("", "_blank");
    try {
      const signed = await policyApi.documentUrl(preview.id, download);
      if (popup) popup.location.href = signed.url;
      else window.location.href = signed.url;
    } catch (error) {
      popup?.close();
      flash(errorMessage(error));
    }
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <nav className="topbar shell" aria-label="主导航">
          <div className="brand">
            <span className="brand-symbol"><i /><i /><i /></span>
            <span><b>赛优制度</b><small>CU POLICY CENTER</small></span>
          </div>
          <div className="top-actions">
            {canManage && adminMode && <span className="admin-badge"><i /> 管理员视图</span>}
            {canManage && (
              <label className="mode-switch">
                <span>管理模式</span>
                <input type="checkbox" checked={adminMode} onChange={(event) => setAdminMode(event.target.checked)} />
                <i aria-hidden="true" />
              </label>
            )}
            <div className="profile" aria-label="当前用户">
              <span>{(currentUser?.name || "赛").slice(0, 1)}</span>
              <b>{currentUser?.name || "赛优员工"}</b>
            </div>
          </div>
        </nav>
        <div className="hero-content shell">
          <div className="eyebrow"><span>CU</span> 企业制度统一发布平台</div>
          <h1>赛优制度</h1>
        </div>
      </section>

      <section className="content shell">
        <header className="content-header">
          <div><span className="section-kicker">POLICY LIBRARY</span><h2>制度资料库</h2></div>
          {adminMode && (
            <div className="admin-actions">
              <button className="ghost-button" onClick={() => setDialog({ type: "section-create" })}><b>＋</b> 新建分区</button>
              <button className="primary-button" onClick={() => setDialog({ type: "upload" })}><b>↑</b> 上传文档</button>
            </div>
          )}
        </header>

        {loading ? (
          <div className="page-state"><i /><span>正在加载制度资料…</span></div>
        ) : loadError ? (
          <div className="page-state page-state-error">
            <h3>暂时无法加载制度资料</h3><p>{loadError}</p><button onClick={() => void loadPolicies()}>重新加载</button>
          </div>
        ) : (
          <>
            <div className="filters" role="tablist" aria-label="制度分区筛选">
              <button className={activeSection === "all" ? "active" : ""} onClick={() => setActiveSection("all")}>全部</button>
              {sections.map((section) => (
                <button key={section.id} className={activeSection === section.id ? "active" : ""} onClick={() => setActiveSection(section.id)}>
                  {section.name}<span>{section.documentCount}</span>
                </button>
              ))}
            </div>

            {visibleSections.length > 0 ? (
              <div className="section-grid">
                {visibleSections.map((section, sectionIndex) => (
                  <article className={`policy-card tone-${tones[sectionIndex % tones.length]}`} key={section.id}>
                    <header className="card-header">
                      <span className="section-mark">{section.code || section.name.slice(0, 2)}</span>
                      <div><h3>{section.name}</h3><p>{section.description}</p></div>
                      <span className="count-pill">{section.documentCount} 份</span>
                      {adminMode && (
                        <div className="section-controls">
                          <button onClick={() => void moveSection(section.id, -1)} disabled={sections[0]?.id === section.id} aria-label="分区上移">↑</button>
                          <button onClick={() => void moveSection(section.id, 1)} disabled={sections.at(-1)?.id === section.id} aria-label="分区下移">↓</button>
                          <button onClick={() => setDialog({ type: "section-edit", section })}>编辑</button>
                        </div>
                      )}
                    </header>
                    <div className="documents">
                      {section.documents.map((document, index) => {
                        const label = fileLabel(document);
                        return (
                          <div
                            className={previewLoadingId === document.id ? "document-row loading" : "document-row"}
                            key={document.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => void openPreview(document)}
                            onKeyDown={(event) => openPreviewByKeyboard(event, document)}
                          >
                            <span className={`file-badge file-${document.previewType.toLowerCase()}`}>{label}</span>
                            <span className="document-main">
                              <b>{document.title}</b>
                              <small>更新于 {formatDate(document.updatedTime)} · {document.uploaderName || "赛优集团"}</small>
                            </span>
                            <span className="file-size">{formatBytes(document.fileSize)}</span>
                            <span className="preview-ready"><i /> 在线预览</span>
                            {adminMode ? (
                              <span className="document-controls" onClick={(event) => event.stopPropagation()}>
                                <button onClick={() => void moveDocument(section.id, document.id, -1)} disabled={index === 0} aria-label="文档上移">↑</button>
                                <button onClick={() => void moveDocument(section.id, document.id, 1)} disabled={index === section.documents.length - 1} aria-label="文档下移">↓</button>
                                <button onClick={() => setDialog({ type: "document-edit", document })}>编辑</button>
                              </span>
                            ) : <span className="arrow" aria-hidden="true">↗</span>}
                          </div>
                        );
                      })}
                      {section.documents.length === 0 && <div className="empty-card">该分区暂时还没有文档</div>}
                    </div>
                    <footer className="card-footer">
                      {adminMode && <button onClick={() => setDialog({ type: "upload", sectionId: section.id })}>上传到此分区 <b>↑</b></button>}
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <div className="no-result"><h3>暂无制度资料</h3><p>管理员上传后，制度文档会显示在这里。</p></div>
            )}
          </>
        )}
      </section>

      <footer className="site-footer shell"><span>© 2026 赛优集团 · 赛优制度</span></footer>

      {preview && (
        <div className="overlay" role="presentation" onMouseDown={() => setPreview(null)}>
          <section className="preview-dialog" role="dialog" aria-modal="true" aria-label="文档预览" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div className={`large-file file-${preview.previewType.toLowerCase()}`}>{fileLabel(preview)}</div>
              <div><span>制度文档预览</span><h3>{preview.title}</h3></div>
              <button onClick={() => setPreview(null)} aria-label="关闭">×</button>
            </header>
            <Suspense fallback={<div className="office-component"><div className="office-state"><i /><span>正在加载文档…</span></div></div>}>
              {preview.previewType === "PDF"
                ? <PdfViewer key={preview.id} url={preview.url} title={preview.title} />
                : <OfficeViewer key={preview.id} url={preview.url} type={preview.previewType} extension={preview.fileExtension} />}
            </Suspense>
            <footer>
              <span>{fileLabel(preview)} · {formatBytes(preview.fileSize)} · {preview.uploaderName}</span>
              <div>
                <button className="ghost-button" onClick={() => void openDocument(true)}>下载文档</button>
                <button className="primary-button" onClick={() => void openDocument(false)}>在新窗口打开 ↗</button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {(dialog?.type === "section-create" || dialog?.type === "section-edit") && (
        <div className="overlay" role="presentation" onMouseDown={() => setDialog(null)}>
          <form className="form-dialog" onSubmit={saveSection} onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><span>分区管理</span><h3>{dialog.type === "section-edit" ? "编辑制度分区" : "创建制度分区"}</h3></div>
              <button type="button" onClick={() => setDialog(null)}>×</button>
            </header>
            <label>分区名称<input name="name" defaultValue={dialog.type === "section-edit" ? dialog.section.name : ""} placeholder="例如：信息安全制度" autoFocus required maxLength={80} /></label>
            <label>分区标识<input name="code" defaultValue={dialog.type === "section-edit" ? dialog.section.code : ""} placeholder="例如：IT" required maxLength={16} /></label>
            <label>分区说明<textarea name="description" defaultValue={dialog.type === "section-edit" ? dialog.section.description : ""} placeholder="一句话说明该分区包含的内容" rows={3} maxLength={255} /></label>
            <footer className="form-footer-split">
              {dialog.type === "section-edit" && <button type="button" className="danger-button" disabled={busy} onClick={() => void removeSection(dialog.section)}>删除分区</button>}
              <span />
              <button type="button" className="ghost-button" onClick={() => setDialog(null)}>取消</button>
              <button className="primary-button" disabled={busy}>{busy ? "正在保存…" : "保存"}</button>
            </footer>
          </form>
        </div>
      )}

      {dialog?.type === "upload" && (
        <div className="overlay" role="presentation" onMouseDown={() => setDialog(null)}>
          <form className="form-dialog upload-dialog" onSubmit={uploadDocument} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>文档管理</span><h3>上传制度文档</h3></div><button type="button" onClick={() => setDialog(null)}>×</button></header>
            <label>所属分区<select name="sectionId" defaultValue={dialog.sectionId || sections[0]?.id}>{sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}</select></label>
            <label>展示名称<input name="title" placeholder="不填写则使用原文件名" maxLength={200} /></label>
            <label className="dropzone">
              <input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" required />
              <span>↑</span><b>选择制度文档</b><small>支持 PDF、Word、Excel，单个文件不超过 50 MB</small>
            </label>
            <footer><button type="button" className="ghost-button" onClick={() => setDialog(null)}>取消</button><button className="primary-button" disabled={busy}>{busy ? "正在上传…" : "确认上传"}</button></footer>
          </form>
        </div>
      )}

      {dialog?.type === "document-edit" && (
        <div className="overlay" role="presentation" onMouseDown={() => setDialog(null)}>
          <form className="form-dialog" onSubmit={saveDocument} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>文档管理</span><h3>编辑制度文档</h3></div><button type="button" onClick={() => setDialog(null)}>×</button></header>
            <label>展示名称<input name="title" defaultValue={dialog.document.title} required maxLength={200} /></label>
            <label>所属分区<select name="sectionId" defaultValue={dialog.document.sectionId}>{sections.map((section) => <option value={section.id} key={section.id}>{section.name}</option>)}</select></label>
            <footer className="form-footer-split">
              <button type="button" className="danger-button" disabled={busy} onClick={() => void removeDocument(dialog.document)}>删除文档</button>
              <span />
              <button type="button" className="ghost-button" onClick={() => setDialog(null)}>取消</button>
              <button className="primary-button" disabled={busy}>{busy ? "正在保存…" : "保存"}</button>
            </footer>
          </form>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
