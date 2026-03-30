import api from '../utils/axios'
export const getRecycleBin   = ()    => api.get('/recycle/bin')
export const restoreImage    = (id)  => api.patch(`/recycle/restore/${id}`)
export const permanentDelete = (id)  => api.delete(`/recycle/permanent/${id}`)