"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export function buildQrFilename(shortCode: string, ext: "png" | "svg"): string {
  return `maquette-qr-${shortCode}.${ext}`;
}

export interface QRPreviewProps {
  value: string;
  size?: number;
  shortCode?: string;
}

export function QRPreview({ value, size = 192, shortCode }: QRPreviewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const code = shortCode ?? inferShortCode(value);

  function downloadSvg() {
    const svg = wrapperRef.current?.querySelector("svg");
    if (!svg) return;
    const cloned = svg.cloneNode(true) as SVGElement;
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const serialized = new XMLSerializer().serializeToString(cloned);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    triggerDownload(URL.createObjectURL(blob), buildQrFilename(code, "svg"));
  }

  function downloadPng() {
    const svg = wrapperRef.current?.querySelector("svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serialized], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 4;
      const canvas = document.createElement("canvas");
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        triggerDownload(URL.createObjectURL(blob), buildQrFilename(code, "png"));
      }, "image/png");
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wrapperRef}
        className="rounded-md border border-border bg-white p-3"
      >
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          marginSize={1}
          data-qr-value={value}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={downloadPng}
          className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-accent"
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={downloadSvg}
          className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-accent"
        >
          Download SVG
        </button>
      </div>
    </div>
  );
}

function inferShortCode(value: string): string {
  const match = value.match(/\/r\/([0-9A-Za-z]+)/);
  return match?.[1] ?? "link";
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
