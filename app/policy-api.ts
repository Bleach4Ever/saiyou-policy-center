export type PolicyUser = {
  id: number;
  account: string;
  name: string;
  dingdingId: string;
  canManage: boolean;
};

export type PolicyDocument = {
  id: number;
  sectionId: number;
  title: string;
  originalFileName: string;
  fileExtension: string;
  previewType: "PDF" | "WORD" | "EXCEL";
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  uploaderName: string;
  updatedTime: string;
};

export type PolicySection = {
  id: number;
  name: string;
  code: string;
  description: string;
  sortOrder: number;
  documentCount: number;
  documents: PolicyDocument[];
};

export type PolicyBootstrap = {
  user: PolicyUser;
  sectionCount: number;
  documentCount: number;
  sections: PolicySection[];
};

export type PolicyDocumentUrl = {
  url: string;
  expiresAt: number;
  previewType: PolicyDocument["previewType"];
  fileExtension: string;
  mimeType: string;
};

type ApiEnvelope<T> = {
  code: number;
  error: number;
  message: string;
  data: T;
};

type SectionPayload = {
  name: string;
  code: string;
  description: string;
};

type DocumentPayload = {
  title?: string;
  sectionId?: number;
};

const TOKEN_KEY = "cu-policy-center-token";
let accessToken = "";

export class PolicyApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "PolicyApiError";
    this.status = status;
  }
}

function apiBaseUrl() {
  const configured = import.meta.env.VITE_DATA_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    return "/data-api";
  }
  return "https://data-api.saiyoujiaoyu.com";
}

function normalizeToken(value: string) {
  return value.replace(/^Bearer\s+/i, "").trim();
}

export async function resolvePolicyToken() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("token") || params.get("access_token");
  if (queryToken) {
    const token = normalizeToken(queryToken);
    window.sessionStorage.setItem(TOKEN_KEY, token);
    params.delete("token");
    params.delete("access_token");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    return token;
  }

  const injectedToken = window.__SAIYOU_POLICY_TOKEN__;
  if (injectedToken) return normalizeToken(injectedToken);

  if (window.getSaiyouPolicyToken) {
    const token = normalizeToken(await window.getSaiyouPolicyToken());
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    return token;
  }

  return normalizeToken(window.sessionStorage.getItem(TOKEN_KEY) || "");
}

export function setPolicyToken(token: string) {
  accessToken = normalizeToken(token);
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
  } catch {
    throw new PolicyApiError("暂时无法连接制度服务，请稍后重试");
  }

  const body = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !body || body.error) {
    const message = body?.message || (response.status === 401
      ? "登录状态已失效，请从钉钉工作台重新进入"
      : "制度服务暂时不可用，请稍后重试");
    throw new PolicyApiError(message, response.status);
  }
  return body.data;
}

export const policyApi = {
  bootstrap: () => request<PolicyBootstrap>("/api/policy-center/bootstrap"),
  createSection: (payload: SectionPayload) => request<PolicySection>("/api/policy-center/sections", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  updateSection: (id: number, payload: SectionPayload) => request<PolicySection>(`/api/policy-center/sections/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  deleteSection: (id: number) => request<void>(`/api/policy-center/sections/${id}`, { method: "DELETE" }),
  sortSections: (ids: number[]) => request<void>("/api/policy-center/sections/sort", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  }),
  uploadDocument: (form: FormData) => request<PolicyDocument>("/api/policy-center/documents", {
    method: "POST",
    body: form,
  }),
  updateDocument: (id: number, payload: DocumentPayload) => request<PolicyDocument>(`/api/policy-center/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  deleteDocument: (id: number) => request<void>(`/api/policy-center/documents/${id}`, { method: "DELETE" }),
  sortDocuments: (sectionId: number, ids: number[]) => request<void>(`/api/policy-center/sections/${sectionId}/documents/sort`, {
    method: "PUT",
    body: JSON.stringify({ ids }),
  }),
  documentUrl: (id: number, download = false) => request<PolicyDocumentUrl>(`/api/policy-center/documents/${id}/url?download=${download}`),
};

declare global {
  interface Window {
    __SAIYOU_POLICY_TOKEN__?: string;
    getSaiyouPolicyToken?: () => Promise<string>;
  }
}
