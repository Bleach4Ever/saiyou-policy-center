"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type PdfViewerProps = {
  url: string;
  title: string;
  expectedPages?: number;
};

export default function PdfViewer({ url, title, expectedPages }: PdfViewerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(820);
  const [numPages, setNumPages] = useState(expectedPages || 0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;
    const updateWidth = () => setContainerWidth(Math.max(320, element.clientWidth));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pageWidth = Math.max(280, Math.min(containerWidth - 48, 1050)) * scale;

  return (
    <div className="pdf-component" ref={shellRef}>
      <div className="pdf-component-toolbar">
        <div className="pdf-page-control">
          <button onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={pageNumber <= 1} aria-label="上一页">‹</button>
          <b>{pageNumber}</b><span>/ {numPages || "-"}</span>
          <button onClick={() => setPageNumber((page) => Math.min(numPages || page, page + 1))} disabled={!numPages || pageNumber >= numPages} aria-label="下一页">›</button>
        </div>
        <div className="pdf-zoom-control">
          <button onClick={() => setScale((value) => Math.max(.6, Number((value - .1).toFixed(1))))} aria-label="缩小">−</button>
          <b>{Math.round(scale * 100)}%</b>
          <button onClick={() => setScale((value) => Math.min(2, Number((value + .1).toFixed(1))))} aria-label="放大">＋</button>
        </div>
      </div>
      <div className="pdf-component-stage">
        {error ? (
          <div className="pdf-error"><b>该文件暂时无法预览</b><span>{error}</span></div>
        ) : (
          <Document
            file={url}
            loading={<div className="pdf-loading"><i /><span>正在加载文档…</span></div>}
            error={<div className="pdf-error"><b>文档加载失败</b><span>请稍后重试或下载后查看</span></div>}
            onLoadSuccess={({ numPages: pages }) => { setNumPages(pages); setError(""); }}
            onLoadError={(reason) => setError(reason.message || "PDF 文件解析失败")}
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderAnnotationLayer
              renderTextLayer
              devicePixelRatio={typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2)}
              loading={<div className="pdf-loading"><i /><span>正在绘制第 {pageNumber} 页…</span></div>}
              aria-label={`${title} 第 ${pageNumber} 页`}
            />
          </Document>
        )}
      </div>
    </div>
  );
}
