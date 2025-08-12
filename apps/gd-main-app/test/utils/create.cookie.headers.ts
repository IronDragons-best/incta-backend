export const createCookieHeader = (
  accessToken: string | null,
  refreshToken: string | null = null,
): string => {
  const cookies: string[] = [];
  if (accessToken) {
    cookies.push(`accessToken=${accessToken}`);
  }
  if (refreshToken) {
    cookies.push(`refreshToken=${refreshToken}`);
  }
  return cookies.join('; ');
};
