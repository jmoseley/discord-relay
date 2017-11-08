export function isLocalDev(): boolean {
  return !!process.env.DEV;
}
