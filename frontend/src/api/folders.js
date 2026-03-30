import api from '../utils/axios'
export const listFolders  = ()         => api.get('/folders/')
export const createFolder = (data)     => api.post('/folders/', data)
export const renameFolder = (id, data) => api.patch(`/folders/${id}`, data)
export const deleteFolder = (id)       => api.delete(`/folders/${id}`)
export const folderImages = (id)       => api.get(`/folders/${id}/images`)