const ENGINE_URL = process.env.TRADING_ENGINE_URL || "http://localhost:8000";

export async function getEngineHealth() {
  const response = await fetch(`${ENGINE_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Trading engine unavailable");
  }

  return response.json();
}

export async function runPaperTrade() {
  const response = await fetch(`${ENGINE_URL}/paper/run-once`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Paper trade failed");
  }

  return response.json();
}
