import { createClient } from "./supabase-browser";

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log("Supabase session:", session);
  console.log("Session error:", error);

  if (error) {
    throw new Error(
      `Unable to read authentication session: ${error.message}`
    );
  }

  if (!session?.access_token) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const headers = new Headers(init.headers);

  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );

  headers.set("Accept", "application/json");

  return fetch(input, {
    ...init,
    headers,
  });
}
