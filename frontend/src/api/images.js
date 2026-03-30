import api from '../utils/axios'
export const uploadImage       = (form)         => api.post('/images/upload', form)
export const listImages        = (sort = 'desc') => api.get(`/images/?sort=${sort}`)
export const recentImages      = ()              => api.get('/images/recent')
export const getImage          = (id)            => api.get(`/images/${id}`)
export const updateDescription = (id, data)      => api.patch(`/images/${id}/description`, data)
export const moveToFolder      = (id, data)      => api.patch(`/images/${id}/folder`, data)
export const softDelete        = (id)            => api.delete(`/images/${id}`)
export const getStats          = ()              => api.get('/images/stats/overview')