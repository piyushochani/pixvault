/**
 * userModel.js
 * ------------
 * All API calls related to authentication.
 */
import api from "../api/axios";

export const userModel = {
  register: async (email, password) => {
    const res = await api.post("/auth/register", { email, password });
    return res.data; // { token, email }
  },

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data; // { token, email }
  },
};