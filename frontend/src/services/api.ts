import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7676";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const rfpApi = {
  getAll: () => api.get("/rfps"),
  getById: (id: string) => api.get(`/rfps/${id}`),
  create: (data: { description: string }) => api.post("/rfps", data),
  update: (id: string, data: { description?: string }) =>
    api.patch(`/rfps/${id}`, data),
  delete: (id: string) => api.delete(`/rfps/${id}`),
  send: (id: string, vendor_ids: string[]) =>
    api.post(`/rfps/${id}/send`, { vendor_ids }),
  regenerate: (id: string) => api.post(`/rfps/${id}/regenerate`),
  getEmailPreview: (id: string) => api.get(`/rfps/${id}/email-preview`),
  getAllDrafts: () => api.get("/rfps/drafts"),
  createDraft: (data: { description: string }) =>
    api.post("/rfps/drafts", data),
  updateDraft: (
    id: string,
    data: { description?: string; selected_vendors?: string[] }
  ) => api.patch(`/rfps/drafts/${id}`, data),
  convertDraftToRfp: (id: string, description?: string) =>
    api.post(`/rfps/${id}/convert-to-rfp`, description ? { description } : {}),
};

export const vendorApi = {
  getAll: () => api.get("/vendors"),
  getById: (id: string) => api.get(`/vendors/${id}`),
  create: (data: {
    name: string;
    email: string;
    metadata?: Record<string, any>;
  }) => api.post("/vendors", data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      email: string;
      metadata?: Record<string, any>;
    }>
  ) => api.patch(`/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/vendors/${id}`),
};

export const proposalApi = {
  getAll: () => api.get("/proposals"),
  getById: (id: string) => api.get(`/proposals/${id}`),
  getByRfpId: (rfp_id: string) => api.get(`/proposals/rfp/${rfp_id}`),
  compare: (rfp_id: string) => api.get(`/proposals/rfp/${rfp_id}/compare`),
  update: (id: string, data: any) => api.patch(`/proposals/${id}`, data),
};

export const emailApi = {
  getSent: () => api.get("/email/sent"),
  getSentForRfp: (rfp_id: string) => api.get(`/email/sent/rfp/${rfp_id}`),
};
