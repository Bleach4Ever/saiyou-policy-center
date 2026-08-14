"use client";

import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import jsPreviewExcel from "@js-preview/excel";
import JSZip from "jszip";
import "@js-preview/excel/lib/index.css";

type OfficeViewerProps = {
  url: string;
  type: "WORD" | "EXCEL";
  extension: string;
};

type Previewer = {
  preview: (source: string | ArrayBuffer | Blob) => Promise<unknown>;
  destroy: () => void;
};

async function hiddenSheetNames(source: ArrayBuffer) {
  const zip = await JSZip.loadAsync(source);
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
  if (!workbookXml) return new Set<string>();

  const document = new DOMParser().parseFromString(workbookXml, "application/xml");
  return new Set(
    Array.from(document.getElementsByTagNameNS("*", "sheet"))
      .filter((sheet) => {
        const state = sheet.getAttribute("state")?.toLowerCase();
        return state === "hidden" || state === "veryhidden";
      })
      .map((sheet) => sheet.getAttribute("name"))
      .filter((name): name is string => Boolean(name)),
  );
}

function normalizeExcelStage(container: HTMLElement, hiddenSheets: Set<string>) {
  const menuItems = Array.from(container.querySelectorAll<HTMLElement>(".x-spreadsheet-menu > li"));
  const hiddenItems = menuItems.filter((item) => hiddenSheets.has(item.textContent?.trim() ?? ""));
  const activeHiddenSheet = hiddenItems.some((item) => item.classList.contains("active"));

  hiddenItems.forEach((item) => item.remove());
  if (activeHiddenSheet) {
    menuItems.find((item) => item.isConnected && item.textContent?.trim() && !item.querySelector("li"))?.click();
  }

  requestAnimationFrame(() => {
    container.querySelectorAll<HTMLElement>(".x-spreadsheet-scrollbar").forEach((scrollbar) => {
      scrollbar.scrollLeft = 0;
      scrollbar.scrollTop = 0;
      scrollbar.dispatchEvent(new Event("scroll"));
    });
  });
}

export default function OfficeViewer({ url, type, extension }: OfficeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const unsupported = type === "WORD" && extension.toLowerCase() === "doc";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let previewer: Previewer | null = null;
    let cancelled = false;
    const controller = new AbortController();
    container.replaceChildren();

    if (unsupported) return;

    const render = async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("document download failed");
        const source = await response.arrayBuffer();
        if (cancelled) return;
        if (type === "WORD") {
          await renderAsync(source, container, undefined, {
            breakPages: true,
            renderHeaders: true,
            renderFooters: true,
            useBase64URL: true,
          });
        } else {
          const isLegacyExcel = extension.toLowerCase() === "xls";
          const hiddenSheets = isLegacyExcel ? new Set<string>() : await hiddenSheetNames(source);
          const excelOptions = { xls: isLegacyExcel } as unknown as Parameters<typeof jsPreviewExcel.init>[1];
          previewer = jsPreviewExcel.init(container, excelOptions) as Previewer;
          await previewer.preview(source);
          normalizeExcelStage(container, hiddenSheets);
        }
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    };
    void render();

    return () => {
      cancelled = true;
      controller.abort();
      previewer?.destroy();
      container.replaceChildren();
    };
  }, [extension, type, unsupported, url]);

  const visibleState = unsupported ? "error" : state;

  return (
    <div className="office-component">
      {visibleState === "loading" && <div className="office-state"><i /><span>正在加载文档…</span></div>}
      {visibleState === "error" && (
        <div className="office-state office-state-error">
          <b>该文件暂时无法在浏览器内预览</b>
          <span>可以下载文档，或在新窗口中打开</span>
        </div>
      )}
      <div className={visibleState === "ready" ? "office-stage ready" : "office-stage"} ref={containerRef} />
    </div>
  );
}
