/**
 * recycleBinModel.js
 * ------------------
 * All API calls related to the recycle bin.
 */
import api from "../api/axios";

export const recycleBinModel = {
  // Get all items in recycle bin (also triggers auto-purge of expired items)
  list: async () => {
    const res = await api.get("/recycle/bin");
    return res.data; // { results, count, message? }
  },

  // Restore an image back to the library
  restore: async (imageId) => {
    const res = await api.patch(`/recycle/restore/${imageId}`);
    return res.data;
  },

  // Permanently delete an image immediately (no waiting for 24hr auto-purge)
  permanentDelete: async (imageId) => {
    const res = await api.delete(`/recycle/permanent/${imageId}`);
    return res.data;
  },
};