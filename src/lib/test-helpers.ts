export function mockFetch(
  responses: Record<string, { status?: number; body: unknown; headers?: Record<string, string> }>
): typeof fetch {
  return (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    const entry = responses[url];
    if (!entry) {
      return new Response(JSON.stringify({ error: "no mock for " + url }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    const isJson = typeof entry.body === "object";
    return new Response(isJson ? JSON.stringify(entry.body) : String(entry.body ?? ""), {
      status: entry.status ?? 200,
      headers: entry.headers ?? (isJson ? { "content-type": "application/json" } : {}),
    });
  }) as typeof fetch;
}

export async function withEnv(
  env: Record<string, string | undefined>,
  fn: () => Promise<void> | void
): Promise<void> {
  const backup: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    backup[k] = Bun.env[k];
    if (env[k] === undefined) delete Bun.env[k];
    else Bun.env[k] = env[k]!;
  }
  try {
    await fn();
  } finally {
    for (const k of Object.keys(env)) {
      if (backup[k] === undefined) delete Bun.env[k];
      else Bun.env[k] = backup[k]!;
    }
  }
}
