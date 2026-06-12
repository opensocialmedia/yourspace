"use client";

// The one way client components talk to the API: typed fetch with the
// app's standard error shape unwrapped.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    headers: init?.body instanceof FormData
      ? undefined
      : { "content-type": "application/json" },
    ...init,
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
  } & T;
  if (!response.ok) {
    throw new ApiError(
      data.error?.message ?? `Request failed (${response.status})`,
      response.status,
    );
  }
  return data;
}
