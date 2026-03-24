/**
 * folderModel.js
 * --------------
 * All API calls related to folders.
 */
import api from "../api/axios";

export const folderModel = {
  list: async () => {
    const res = await api.get("/folders/");
    return res.data; // { folders, count }
  },

  create: async (name) => {
    const res = await api.post("/folders/", { name });
    return res.data;
  },

  rename: async (folderId, name) => {
    const res = await api.patch(`/folders/${folderId}`, { name });
    return res.data;
  },

  delete: async (folderId) => {
    const res = await api.delete(`/folders/${folderId}`);
    return res.data;
  },

  images: async (folderId) => {
    const res = await api.get(`/folders/${folderId}/images`);
    return res.data;
  },
};