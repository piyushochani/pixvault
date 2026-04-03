import api from '../utils/axios'
export const register = (data) => api.post('/auth/register', data)
export const login    = (data) => api.post('/auth/login', data)
export const saveToken = (token) => localStorage.setItem('token', token)
export const getToken  = ()      => localStorage.getItem('token')
export const clearToken = ()     => localStorage.removeItem('token')
export const isLoggedIn = ()     => !!getToken()