"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScenePlan } from "@/types/agent";

interface VideoComposerProps {
  scenes: ScenePlan[];
  autoGenerate?: boolean;
  onVideoReady?: (url: string) => void;
}

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), durationMs));

const colors = [
  ["#0ea5e9", "#1e3a8a"],
  ["#22d3ee", "#0f172a"],
  ["#a855f7", "#312e81"],
  ["#f97316", "#7c2d12"],
  ["#38bdf8", "#1e293b"],
];

const pickPalette = (index: number) => colors[index % colors.length];

const drawScene = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scene: ScenePlan,
  palette: string[]
) => {
  const [start, end] = palette;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 48;
  ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
  ctx.fillRect(padding, 200, canvas.width - padding * 2, canvas.height - 400);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 64px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(scene.title, canvas.width / 2, 320, canvas.width - padding * 2 - 32);

  ctx.font = "400 36px Inter, sans-serif";
  ctx.textAlign = "left";
  const textWidth = canvas.width - padding * 2 - 80;
  const lines: string[] = [];
  const words = scene.narration.split(/\s+/);
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > textWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  lines.forEach((line, idx) => {
    ctx.fillText(line, padding + 40, 420 + idx * 48);
  });

  ctx.fillStyle = "rgba(226, 232, 240, 0.72)";
  ctx.font = "500 28px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Visual: ${scene.visualDirection}`, padding + 40, canvas.height - 120, textWidth);
};

export const VideoComposer = ({ scenes, autoGenerate = true, onVideoReady }: VideoComposerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"idle" | "rendering" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const supportedMimeType = useMemo(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return null;
    }
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? null;
  }, []);

  const generateVideo = useCallback(async () => {
    if (!canvasRef.current) {
      return;
    }
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setError("Browser does not support MediaRecorder API.");
      setStatus("error");
      return;
    }
    if (!supportedMimeType) {
      setError("No compatible video codec available in this browser.");
      setStatus("error");
      return;
    }

    try {
      setStatus("rendering");
      setError(null);
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context unavailable");
      }

      canvas.width = 720;
      canvas.height = 1280;

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
      const chunks: BlobPart[] = [];

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.onerror = (event) => {
          reject(event.error);
        };
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: supportedMimeType }));
        };
      });

      recorder.start();

      for (let index = 0; index < scenes.length; index += 1) {
        const scene = scenes[index];
        drawScene(ctx, canvas, scene, pickPalette(index));
        // Give MediaRecorder at least one full frame before waiting
        await wait(200);
        await wait(scene.durationSeconds * 1000);
      }

      recorder.stop();
      const blob = await recordingPromise;
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      onVideoReady?.(url);
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to render video");
    }
  }, [onVideoReady, scenes, supportedMimeType, videoUrl]);

  useEffect(() => {
    if (autoGenerate && scenes.length > 0) {
      generateVideo();
    }
  }, [scenes, autoGenerate, generateVideo]);

  return (
    <div className="video-composer">
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="video-shell">
        {status === "ready" && videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            playsInline
            className="video-preview"
          />
        ) : (
          <div className="video-placeholder">
            {status === "rendering" && <span>Rendering video scenes…</span>}
            {status === "idle" && <span>Generate to preview the auto-edited video.</span>}
            {status === "error" && <span>{error}</span>}
          </div>
        )}
      </div>
      <div className="video-actions">
        <button type="button" onClick={generateVideo} disabled={scenes.length === 0 || status === "rendering"}>
          {status === "rendering" ? "Rendering…" : videoUrl ? "Regenerate" : "Render Video"}
        </button>
        {videoUrl && (
          <a href={videoUrl} download="agentic-video.webm" className="download">
            Download WebM
          </a>
        )}
      </div>
      <style jsx>{`
        .video-shell {
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(15, 23, 42, 0.55);
          padding: 16px;
          min-height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .video-preview {
          width: 100%;
          max-width: 320px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          box-shadow: 0 20px 60px rgba(8, 145, 178, 0.25);
        }
        .video-placeholder {
          color: rgba(226, 232, 240, 0.7);
          font-size: 0.95rem;
          text-align: center;
        }
        .video-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
        }
        button {
          background: linear-gradient(120deg, #38bdf8, #0ea5e9);
          border: none;
          color: #0f172a;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        button[disabled] {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        button:not([disabled]):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(56, 189, 248, 0.35);
        }
        .download {
          color: rgba(226, 232, 240, 0.9);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};
