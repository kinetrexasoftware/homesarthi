import api from './api';

const supportApi = {
    createTicket: (data) => api.post('/support', data),
    getMyTickets: () => api.get('/support/my-tickets'),
    getTicketById: (id) => api.get(`/support/ticket/${id}`),
    addReply: (id, data) => api.post(`/support/ticket/${id}/reply`, data),

    // Shared status/priority mappings (can be used for icons/colors)
    getStatusConfig: (status) => {
        switch (status) {
            case 'open': return { label: 'Open', color: '#2563EB', bg: '#EFF6FF' };
            case 'in_progress': return { label: 'In Progress', color: '#D97706', bg: '#FFFBEB' };
            case 'resolved': return { label: 'Resolved', color: '#059669', bg: '#ECFDF5' };
            case 'closed': return { label: 'Closed', color: '#6B7280', bg: '#F9FAFB' };
            default: return { label: status, color: '#6B7280', bg: '#F9FAFB' };
        }
    }
};

export default supportApi;
