# 赛优制度

赛优集团内部制度资料库前端工程。普通员工查阅制度，Nacos 配置的管理员可维护分区、上传文档和调整顺序。

## 本地开发

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

默认访问 `http://localhost:3000/`。

## 构建检查

```bash
npm run build
npm test
```

## 后端接入

- 钉钉登录：前端使用 `innerCode` 调用 questionnaire 的 `/login/dingding/inner-code` 获取 token。
- 页面数据：调用 DATA 的 `GET /api/policy-center/bootstrap`。
- 文档地址：调用 DATA 的 `GET /api/policy-center/documents/{id}/url` 获取 OSS 签名地址。
- 管理权限：以初始化接口返回的 `canManage` 控制入口，写接口仍由 DATA 二次校验。

PDF 使用 React-PDF 在浏览器端渲染。正式接入 OSS 时需允许前端域名进行 `GET`、`HEAD` 跨域访问。

仓库不包含公司内部制度原文件；本地验证使用的文档位于 `public/documents/`，该目录不会提交到 Git。
