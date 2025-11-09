"use client";

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import type { AgentResponse, Platform } from "@/types/agent";
import { VideoComposer } from "./VideoComposer";
import { SocialPlanner } from "./SocialPlanner";

interface FormState {
  idea: string;
  tone: string;
  lengthSeconds: number;
  targetAudience: string;
  platforms: Platform[];
}

const tones = [
  "Energetic",
  "Educational",
  "Inspirational",
  "Persuasive",
  "Playful",
  "Analytical",
];

const defaultState: FormState = {
  idea: "How AI can automate your weekly content calendar",
  tone: "Energetic",
  lengthSeconds: 55,
  targetAudience: "creators and social media managers",
  platforms: ["tiktok", "instagram", "youtube"],
};

const platformBadges: { value: Platform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
];

export const AgentDashboard = () => {
  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const hookPreview = useMemo(
    () => result?.hook ?? "Give me a topic and I\'ll orchestrate everything for you.",
    [result]
  );

  const togglePlatform = (platform: Platform) => {
    setForm((prev) => {
      const exists = prev.platforms.includes(platform);
      const platforms = exists
        ? prev.platforms.filter((item) => item !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to generate");
      }
      const payload = (await response.json()) as AgentResponse;
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <section className="hero">
        <div>
          <h1>Agentic Creator Studio</h1>
          <p>
            Deploy an autonomous creative director that writes viral-ready scripts, renders motion
            graphics, and queues optimized posts across your social ecosystem.
          </p>
          <div className="hook">
            <span className="label">Live hook</span>
            <span className="value">{hookPreview}</span>
          </div>
        </div>
        <div className="glow" aria-hidden />
      </section>

      <form className="control" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="idea">Campaign focus</label>
          <textarea
            id="idea"
            rows={3}
            value={form.idea}
            onChange={(event) => setForm((prev) => ({ ...prev, idea: event.target.value }))}
            placeholder="Ex: Launching a new AI-powered video assistant"
            required
          />
        </div>
        <div className="grid">
          <div className="field">
            <label htmlFor="tone">Voice profile</label>
            <select
              id="tone"
              value={form.tone}
              onChange={(event) => setForm((prev) => ({ ...prev, tone: event.target.value }))}
            >
              {tones.map((tone) => (
                <option key={tone}>{tone}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="length">Video length (seconds)</label>
            <input
              id="length"
              type="number"
              min={30}
              max={120}
              value={form.lengthSeconds}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lengthSeconds: Number(event.target.value) }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="audience">Target audience</label>
            <input
              id="audience"
              value={form.targetAudience}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, targetAudience: event.target.value }))
              }
              placeholder="Product builders, creators, coaches…"
              required
            />
          </div>
        </div>
        <div className="field">
          <span className="label">Distribution channels</span>
          <div className="platforms">
            {platformBadges.map((platform) => {
              const active = form.platforms.includes(platform.value);
              return (
                <button
                  key={platform.value}
                  type="button"
                  className={clsx({ active })}
                  onClick={() => togglePlatform(platform.value)}
                >
                  {platform.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? "Assembling agent…" : "Launch campaign"}
          </button>
          {error && <span className="error">{error}</span>}
        </div>
      </form>

      {result && (
        <section className="output">
          <div className="panel script">
            <header>
              <h2>Script dossier</h2>
              <p>Ready-to-read voiceover. Tweak copy inline before recording.</p>
            </header>
            <article>
              {result.script.split(/\n\n+/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>
            <aside>
              <h3>Talking points</h3>
              <ul>
                {result.talkingPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </aside>
          </div>
          <div className="panel video">
            <header>
              <h2>Auto video render</h2>
              <p>Each scene is storyboarded and stylized for vertical delivery.</p>
            </header>
            <VideoComposer scenes={result.scenes} onVideoReady={setVideoUrl} />
            <div className="scene-grid">
              {result.scenes.map((scene, index) => (
                <div key={scene.id} className="scene">
                  <span className="index">Scene {index + 1}</span>
                  <h4>{scene.title}</h4>
                  <p>{scene.narration}</p>
                  <div className="visual">{scene.visualDirection}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel social">
            <header>
              <h2>Social control center</h2>
              <p>Approve captions and blast them to your social community.</p>
            </header>
            <SocialPlanner posts={result.socialPosts} />
          </div>
        </section>
      )}

      <style jsx>{`
        .shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 48px 20px 120px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .hero {
          position: relative;
          padding: 48px;
          border-radius: 32px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(15, 23, 42, 0.95));
          overflow: hidden;
        }
        .hero h1 {
          margin: 0;
          font-size: clamp(2.4rem, 3.2vw, 3.4rem);
        }
        .hero p {
          max-width: 640px;
          color: rgba(226, 232, 240, 0.78);
          font-size: 1.05rem;
          line-height: 1.5;
        }
        .hook {
          margin-top: 24px;
          padding: 18px 24px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.45);
          background: rgba(15, 23, 42, 0.7);
          display: inline-flex;
          flex-direction: column;
          gap: 6px;
        }
        .hook .label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(148, 163, 184, 0.9);
        }
        .hook .value {
          font-weight: 600;
        }
        .glow {
          position: absolute;
          inset: -120px -240px auto auto;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.65), transparent 65%);
          filter: blur(0px);
          opacity: 0.75;
        }
        .control {
          border-radius: 28px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: rgba(15, 23, 42, 0.78);
          border: 1px solid rgba(148, 163, 184, 0.25);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        label,
        .label {
          font-size: 0.85rem;
          color: rgba(226, 232, 240, 0.72);
          letter-spacing: 0.04em;
        }
        textarea,
        input,
        select {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 12px;
          padding: 12px 14px;
          color: #f8fafc;
          font-size: 1rem;
          resize: vertical;
        }
        textarea:focus,
        input:focus,
        select:focus {
          outline: 2px solid rgba(56, 189, 248, 0.5);
          outline-offset: 2px;
        }
        .platforms {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .platforms button {
          background: rgba(56, 189, 248, 0.08);
          color: rgba(226, 232, 240, 0.85);
          border-radius: 999px;
          border: 1px solid transparent;
          padding: 8px 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .platforms button.active {
          background: rgba(56, 189, 248, 0.35);
          border-color: rgba(56, 189, 248, 0.65);
          color: #0f172a;
          box-shadow: 0 8px 24px rgba(56, 189, 248, 0.35);
        }
        .actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .actions button[type="submit"] {
          background: linear-gradient(120deg, #38bdf8, #22d3ee);
          border: none;
          color: #0f172a;
          padding: 14px 24px;
          font-weight: 700;
          border-radius: 18px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .actions button[type="submit"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 48px rgba(34, 211, 238, 0.35);
        }
        .actions button[type="submit"][disabled] {
          opacity: 0.5;
          transform: none;
          box-shadow: none;
        }
        .error {
          color: #fca5a5;
          font-size: 0.9rem;
        }
        .output {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }
        .panel {
          border-radius: 28px;
          padding: 32px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.2);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .panel header h2 {
          margin: 0;
          font-size: 1.6rem;
        }
        .panel header p {
          margin: 6px 0 0;
          color: rgba(226, 232, 240, 0.7);
        }
        .panel.script article {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(30, 41, 59, 0.8);
          border-radius: 20px;
          padding: 20px;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }
        .panel.script aside ul {
          margin: 12px 0 0;
          padding-left: 20px;
          display: grid;
          gap: 8px;
        }
        .scene-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .scene {
          border-radius: 20px;
          padding: 18px;
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid rgba(56, 189, 248, 0.2);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .scene .index {
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(96, 165, 250, 0.9);
        }
        .scene h4 {
          margin: 0;
          font-size: 1.1rem;
        }
        .scene p {
          margin: 0;
          color: rgba(226, 232, 240, 0.85);
        }
        .scene .visual {
          margin-top: auto;
          font-size: 0.85rem;
          color: rgba(226, 232, 240, 0.64);
        }
        @media (max-width: 768px) {
          .hero {
            padding: 32px;
          }
          .control {
            padding: 24px;
          }
          .panel {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};
