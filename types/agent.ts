export type Platform = "youtube" | "tiktok" | "instagram" | "linkedin";

export interface AgentRequest {
  idea: string;
  tone: string;
  lengthSeconds: number;
  platforms: Platform[];
  targetAudience: string;
}

export interface ScenePlan {
  id: string;
  title: string;
  narration: string;
  visualDirection: string;
  durationSeconds: number;
}

export interface SocialPostPlan {
  platform: Platform;
  caption: string;
  tags: string[];
  callToAction: string;
  scheduledTime: string;
}

export interface AgentResponse {
  script: string;
  scenes: ScenePlan[];
  socialPosts: SocialPostPlan[];
  talkingPoints: string[];
  hook: string;
}
