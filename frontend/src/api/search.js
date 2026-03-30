import api from '../utils/axios'
export const keywordSearch  = (q) => api.get(`/search/keyword?q=${encodeURIComponent(q)}`)
export const semanticSearch = (q) => api.get(`/search/semantic?q=${encodeURIComponent(q)}`)