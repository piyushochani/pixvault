/**
 * imageModel.js
 * -------------
 * All API calls related to images.
 * Keeps API logic out of components and pages.
 */
import api from "../api/axios";

export const imageModel = {
  // Upload a new image (multipart/form-data)
  upload: async (file, userDescription = "") => {
    const form = new FormData();
    form.append("file", file);
    if (userDescription) form.append("user_description", userDescription);
    const res = await api.post("/images/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // List all active images (sort: "desc" | "asc")
  list: async (sort = "desc") => {
    const res = await api.get(`/images/?sort=${sort}`);
    return res.data;
  },

  // Recent 10 images for overview page
  recent: async () => {
    const res = await api.get("/images/recent");
    return res.data;
  },

  // Get a single image
  get: async (imageId) => {
    const res = await api.get(`/images/${imageId}`);
    return res.data;
  },

  // Update user description
  updateDescription: async (imageId, userDescription) => {
    const res = await api.patch(`/images/${imageId}/description`, {
      user_description: userDescription,
    });
    return res.data;
  },

  // Move image to a folder (folderId = null to remove from folder)
  moveToFolder: async (imageId, folderId) => {
    const res = await api.patch(`/images/${imageId}/folder`, {
      folder_id: folderId,
    });
    return res.data;
  },

  // Soft delete → recycle bin
  delete: async (imageId) => {
    const res = await api.delete(`/images/${imageId}`);
    return res.data;
  },

  // Overview stats
  stats: async () => {
    const res = await api.get("/images/stats/overview");
    return res.data;
  },
};