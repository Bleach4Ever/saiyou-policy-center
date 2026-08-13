# 赛优制度

赛优集团内部制度资料库前端工程。普通员工查阅制度，Nacos 配置的管理员可维护分区、上传文档和调整顺序。

## 本地开发

需要 Node.js `>=18.0.0`。工程基于 React 18 + Vite 5；Node 只用于本地开发和构建，
生产产物为 `dist/` 下的纯静态文件，不需要启动 Node 服务。

```bash
npm install
npm run dev
```

默认访问 `http://localhost:3000/`。

本地开发通过 Vite 将 `/data-api` 代理到测试环境
`https://data-api.saiyoujiaoyu.com`，浏览器不会受到测试环境 CORS 白名单限制。

## 构建检查

```bash
npm run build
npm test
```

## 身份与后端接入

- 钉钉登录：宿主前端使用 `innerCode` 调用 questionnaire 的
  `/login/dingding/inner-code` 获取 token，再实现
  `window.getSaiyouPolicyToken(): Promise<string>`。页面也支持由宿主预先设置
  `window.__SAIYOU_POLICY_TOKEN__`。
- 本地联调：可使用 `http://localhost:3000/?token=<questionnaire-token>`；页面会立即
  将 token 转存到当前标签页的 `sessionStorage`，并从地址栏移除。
- 页面数据：调用 DATA 的 `GET /api/policy-center/bootstrap`。
- 文档地址：调用 DATA 的 `GET /api/policy-center/documents/{id}/url` 获取 OSS 签名地址。
- 管理权限：以初始化接口返回的 `canManage` 控制入口，写接口仍由 DATA 二次校验。
- DATA 正式地址默认为 `https://data-api.saiyoujiaoyu.com`，可通过
  `VITE_DATA_API_BASE_URL` 覆盖。

PDF 使用 React-PDF，DOCX 使用 `docx-preview`，Excel 使用 `@js-preview/excel` 在浏览器端渲染，后端只返回
OSS 签名地址。正式接入 OSS 时需允许前端域名进行 `GET`、`HEAD` 跨域访问。

## 初始化数据

测试库没有分区数据时，在 CRM 库执行
[`sql/seed_cu_policy_sections.sql`](sql/seed_cu_policy_sections.sql)。脚本可重复执行；文档不要通过
SQL 伪造，直接使用管理员页面上传，确保 OSS 对象与数据库记录一致。

仓库不包含公司内部制度原文件；本地验证使用的文档位于 `public/documents/`，该目录不会提交到 Git。
