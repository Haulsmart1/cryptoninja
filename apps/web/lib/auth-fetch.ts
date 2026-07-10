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

  if (error || !session?.access_token) {
    throw new Error("You must be signed in.");
  }

  const headers = new Headers(init.headers);
  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );

  return fetch(input, {
    ...init,
    headers,
  });
}
