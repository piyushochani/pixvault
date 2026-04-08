import api from '../utils/axios'

export const recycleBinModel = {
  list: () => api.get('/recycle/bin').then((r) => r.data),
  restore: (id) => api.patch(`/recycle/restore/${id}`).then((r) => r.data),
  permanentDelete: (id) => api.delete(`/recycle/permanent/${id}`).then((r) => r.data),
}