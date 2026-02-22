import api from './api';

const supportApi = {
    createTicket: (data) => api.post('/support', data),
    getMyTickets: () => api.get('/support/my-tickets'),
    getTicketById: (id) => api.get(`/support/ticket/${id}`),
    addReply: (id, data) => api.post(`/support/ticket/${id}/reply`, data),

    // Admin Methods
    getAllTickets: (params) => api.get('/support/admin/all', { params }),
    updateStatus: (id, data) => api.put(`/support/ticket/${id}/status`, data),
    getStats: () => api.get('/support/admin/stats')
};

export default supportApi;
