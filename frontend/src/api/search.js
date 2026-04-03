import api from '../utils/axios'

export const keywordSearch  = (q) => api.get(`/images/search/keyword?q=${encodeURIComponent(q)}`)
export const semanticSearch = (q) => api.get(`/images/search/semantic?q=${encodeURIComponent(q)}`)