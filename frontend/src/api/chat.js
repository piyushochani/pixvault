import api from '../utils/axios'
export const textChat = (data) => api.post('/chat/text', data)