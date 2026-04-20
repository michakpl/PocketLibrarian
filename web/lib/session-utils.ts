export interface SessionTokenMeta {
  accessTokenExpiresAt: number
}

export function isAccessTokenExpired(
  session: SessionTokenMeta,
  graceSeconds = 60,
): boolean {
  if (!session.accessTokenExpiresAt) return true
  return Date.now() / 1000 >= session.accessTokenExpiresAt - graceSeconds
}

