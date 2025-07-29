export function fixEncoding(str: string): string {
  const bytes = new Uint8Array(Array.from(str).map((ch) => ch.charCodeAt(0)));
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}
