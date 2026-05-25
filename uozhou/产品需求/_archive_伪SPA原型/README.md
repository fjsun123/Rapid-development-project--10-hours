# 伪 SPA 原型归档

这 13 个 HTML 文件原本误放在 `apps/dashboard/` 下，是历史迭代里**接了真实后端 API 的伪 SPA 原型**（有 fetch、localStorage、按 role 跳转等）。

## 与正式视觉锚点的区别

- `产品需求/视觉锚点/` 下的同名 HTML：**纯静态稿**（只展示 UI，无 JS 业务逻辑）
- 本目录的同名 HTML：**伪 SPA**（含 fetch + localStorage + 跳转）

字节数对比：
- 6 个后台 HTML 与视觉锚点完全一致（重复保留即可）
- 6 个 App HTML 字节略有差异（apps/ 版本是修改过的版本，保留为参考）

## 为什么归档

按用户要求："**HTML 只是产品需求来看的，App 用 RN 重写代码，后台管理也是重新写代码**"。

`apps/dashboard/` 目录将用于放置真正的 Expo Web 代码，腾空目录。

## 恢复

```bash
mv 产品需求/_archive_伪SPA原型/*.html apps/dashboard/
```
