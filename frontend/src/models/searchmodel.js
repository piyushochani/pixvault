/**
 * searchModel.js
 * --------------
 * All API calls related to search (keyword + semantic).
 */
import api from "../api/axios";

export const searchModel = {
  // Keyword search — matches against user_description
  keyword: async (query) => {
    const res = await api.get(`/search/keyword?q=${encodeURIComponent(query)}`);
    return res.data; // { results, count, message? }
  },

  // Semantic search — CLIP embedding → Pinecone similarity
  semantic: async (query) => {
    const res = await api.get(`/search/semantic?q=${encodeURIComponent(query)}`);
    return res.data; // { results, count, message? }
  },
};