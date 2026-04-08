import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

export const uploadSettlements = (formData) => api.post('/settlements/upload', formData)
export const getSettlements = (status) => api.get('/settlements', { params: status ? { status } : {} })
export const getSettlementById = (id) => api.get(`/settlements/${id}`)
export const getJobs = () => api.get('/jobs')
export const triggerJob = () => api.post('/jobs/trigger')
export const getNotifications = () => api.get('/notifications')

export default api