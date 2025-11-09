"use client";

import { useEffect, useMemo, useState } from "react";
import type { SocialPostPlan } from "@/types/agent";

interface SocialPlannerProps {
  posts: SocialPostPlan[];
}

interface PublishedPost extends SocialPostPlan {
  publishedAt: string;
  analytics: {
    views: number;
    likes: number;
    comments: number;
  };
}

const formatPlatform = (platform: SocialPostPlan["platform"]) => {
  switch (platform) {
    case "instagram":
      return "Instagram Reels";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube Shorts";
    case "linkedin":
    default:
      return "LinkedIn";
  }
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const randomRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const SocialPlanner = ({ posts }: SocialPlannerProps) => {
  const [scheduled, setScheduled] = useState<SocialPostPlan[]>([]);
  const [published, setPublished] = useState<PublishedPost[]>([]);

  useEffect(() => {
    setScheduled(posts);
  }, [posts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("agentic-published");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PublishedPost[];
        setPublished(parsed);
      } catch (error) {
        console.warn("Failed to parse stored posts", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("agentic-published", JSON.stringify(published));
  }, [published]);

  const handlePostNow = (post: SocialPostPlan) => {
    const publishedPost: PublishedPost = {
      ...post,
      publishedAt: new Date().toISOString(),
      analytics: {
        views: randomRange(1200, 9500),
        likes: randomRange(120, 2100),
        comments: randomRange(12, 320),
      },
    };

    setPublished((prev) => [publishedPost, ...prev]);
    setScheduled((prev) => prev.filter((item) => item.platform !== post.platform));
  };

  const totalStats = useMemo(
    () =>
      published.reduce(
        (acc, post) => {
          acc.views += post.analytics.views;
          acc.likes += post.analytics.likes;
          acc.comments += post.analytics.comments;
          return acc;
        },
        { views: 0, likes: 0, comments: 0 }
      ),
    [published]
  );

  return (
    <div className="planner">
      <section>
        <header>
          <h3>Auto Scheduler</h3>
          <p>Agent staged posts. Approve to push live and watch analytics roll in.</p>
        </header>
        <div className="scheduled">
          {scheduled.length === 0 ? (
            <div className="empty">All optimized captions are already live.</div>
          ) : (
            scheduled.map((post) => (
              <article key={post.platform}>
                <div className="platform">{formatPlatform(post.platform)}</div>
                <div className="meta">
                  <span>{formatDate(post.scheduledTime)}</span>
                  <span>{post.callToAction}</span>
                </div>
                <p className="caption">{post.caption}</p>
                <button type="button" onClick={() => handlePostNow(post)}>
                  Publish now
                </button>
              </article>
            ))
          )}
        </div>
      </section>
      <section>
        <header>
          <h3>Community Pulse</h3>
          <p>Realtime consensus from your social community once posts go live.</p>
        </header>
        <div className="stats">
          <div>
            <span className="label">Views</span>
            <span className="value">{totalStats.views.toLocaleString()}</span>
          </div>
          <div>
            <span className="label">Likes</span>
            <span className="value">{totalStats.likes.toLocaleString()}</span>
          </div>
          <div>
            <span className="label">Comments</span>
            <span className="value">{totalStats.comments.toLocaleString()}</span>
          </div>
        </div>
        <ul className="feed">
          {published.length === 0 ? (
            <li className="empty">Publish a post to populate your social wall.</li>
          ) : (
            published.map((post) => (
              <li key={`${post.platform}-${post.publishedAt}`}>
                <div className="platform">{formatPlatform(post.platform)}</div>
                <span className="time">{formatDate(post.publishedAt)}</span>
                <p>{post.caption}</p>
                <div className="analytics">
                  <span>👁️ {post.analytics.views.toLocaleString()}</span>
                  <span>❤️ {post.analytics.likes.toLocaleString()}</span>
                  <span>💬 {post.analytics.comments.toLocaleString()}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
      <style jsx>{`
        .planner {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        section {
          border-radius: 24px;
          padding: 24px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.25);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        header h3 {
          margin: 0;
          font-size: 1.2rem;
        }
        header p {
          margin: 4px 0 0;
          color: rgba(226, 232, 240, 0.7);
          font-size: 0.9rem;
        }
        .scheduled {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        article {
          border-radius: 16px;
          padding: 16px;
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.25);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .platform {
          font-weight: 600;
          letter-spacing: 0.03em;
          color: #38bdf8;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          color: rgba(226, 232, 240, 0.6);
          font-size: 0.82rem;
        }
        .caption {
          margin: 0;
          color: rgba(226, 232, 240, 0.88);
        }
        button {
          align-self: flex-start;
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.45);
          color: #f8fafc;
          border-radius: 10px;
          padding: 8px 14px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        button:hover {
          background: rgba(56, 189, 248, 0.25);
          transform: translateY(-1px);
        }
        .empty {
          color: rgba(226, 232, 240, 0.6);
          font-size: 0.9rem;
          text-align: center;
          padding: 24px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .label {
          display: block;
          color: rgba(226, 232, 240, 0.55);
          font-size: 0.78rem;
        }
        .value {
          font-size: 1.4rem;
          font-weight: 700;
        }
        .feed {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .feed li {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(30, 41, 59, 0.9);
          border-radius: 18px;
          padding: 16px;
          border: 1px solid rgba(148, 163, 184, 0.18);
        }
        .time {
          color: rgba(226, 232, 240, 0.6);
          font-size: 0.78rem;
        }
        .analytics {
          display: flex;
          gap: 12px;
          color: rgba(226, 232, 240, 0.75);
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};
