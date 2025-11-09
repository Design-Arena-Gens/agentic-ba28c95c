import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import { AgentRequest } from "@/types/agent";

export const dynamic = "force-dynamic";

const validate = (payload: Partial<AgentRequest>) => {
  if (!payload.idea || payload.idea.trim().length === 0) {
    return "Missing campaign idea";
  }
  if (!payload.tone) {
    return "Missing tone";
  }
  if (!payload.targetAudience) {
    return "Missing target audience";
  }
  if (!payload.lengthSeconds || Number.isNaN(payload.lengthSeconds)) {
    return "Missing desired length";
  }
  if (!payload.platforms || payload.platforms.length === 0) {
    return "Select at least one platform";
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as Partial<AgentRequest>;
    const error = validate(json);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const payload: AgentRequest = {
      idea: json.idea!.trim(),
      tone: json.tone!,
      lengthSeconds: Number(json.lengthSeconds),
      platforms: json.platforms!,
      targetAudience: json.targetAudience!,
    };

    const result = await runAgent(payload);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Agent request failed", error);
    return NextResponse.json(
      {
        error: "Failed to orchestrate agent.",
      },
      { status: 500 }
    );
  }
}
