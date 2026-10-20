export function readAuthConfig(environment: NodeJS.ProcessEnv) {
  const username = environment.ADMIN_USER?.trim();
  const password = environment.ADMIN_PASS;
  const secret = environment.JWT_SECRET;
  if (!username || !password?.trim()) {
    throw new Error('ADMIN_USER and ADMIN_PASS must be configured');
  }
  if (!secret || Buffer.byteLength(secret.trim(), 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }
  return { username, password, secret };
}
