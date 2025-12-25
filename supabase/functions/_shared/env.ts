export function requireEnv(name: string): string {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export function getEnv(name: string): string | undefined {
  return Deno.env.get(name) ?? undefined
}


