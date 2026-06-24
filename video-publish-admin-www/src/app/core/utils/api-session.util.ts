/** 与后端 BaseExceptionEnum / Codes 一致：登录态失效 */
export function isApiSessionExpiredResponse(res: any): boolean {
  const code = Number(res?.code);
  return code === 4001 || code === 4433;
}
