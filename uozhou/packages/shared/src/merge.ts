// 合并多个 style 对象（解决 RN Web 0.19 对数组 style 渲染失败的问题）
export function merge(...args: any[]): Record<string, any> {
  return Object.assign({}, ...args.filter((x) => x && typeof x === 'object'));
}
