// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
};

// Dashboard API
export const dashboardApi = {
    getStats: () => apiRequest('/dashboard/stats'),
    getRecentActivities: () => apiRequest('/dashboard/recent-activities'),
    getUpcomingAppointments: () => apiRequest('/dashboard/upcoming-appointments'),
    getRevenueChart: (period?: string) =>
        apiRequest(`/dashboard/revenue-chart${period ? `?period=${period}` : ''}`),
};

// Patients API
export const patientsApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/patients${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/patients/${id}`),
    create: (data: any) => apiRequest('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/patients/${id}`, {
        method: 'DELETE',
    }),
    getAppointments: (id: string) => apiRequest(`/patients/${id}/appointments`),
    getTreatments: (id: string) => apiRequest(`/patients/${id}/treatments`),
    getBilling: (id: string) => apiRequest(`/patients/${id}/billing`),
};

// Appointments API
export const appointmentsApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/appointments${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/appointments/${id}`),
    getCalendar: (start: string, end: string, dentist?: string) => {
        const params = new URLSearchParams({ start, end });
        if (dentist) params.append('dentist', dentist);
        return apiRequest(`/appointments/calendar?${params.toString()}`);
    },
    getAvailableSlots: (dentistId: string, date: string) =>
        apiRequest(`/appointments/available-slots?dentistId=${dentistId}&date=${date}`),
    create: (data: any) => apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    confirm: (id: string) => apiRequest(`/appointments/${id}/confirm`, {
        method: 'POST',
    }),
    complete: (id: string) => apiRequest(`/appointments/${id}/complete`, {
        method: 'POST',
    }),
    markNoShow: (id: string) => apiRequest(`/appointments/${id}/no-show`, {
        method: 'POST',
    }),
    cancel: (id: string, reason: string) => apiRequest(`/appointments/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
    }),
};

// Dental Chart API
export const dentalChartApi = {
    getPatientChart: (patientId: string) => apiRequest(`/dental-chart/patient/${patientId}`),
    updateChart: (patientId: string, data: any) => apiRequest(`/dental-chart/patient/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    addToothTreatment: (patientId: string, toothNumber: number, data: any) =>
        apiRequest(`/dental-chart/patient/${patientId}/tooth/${toothNumber}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    updateToothTreatment: (patientId: string, toothNumber: number, treatmentId: string, data: any) =>
        apiRequest(`/dental-chart/patient/${patientId}/tooth/${toothNumber}/treatment/${treatmentId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

// Treatments API
export const treatmentsApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/treatments${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/treatments/${id}`),
    create: (data: any) => apiRequest('/treatments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/treatments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/treatments/${id}`, {
        method: 'DELETE',
    }),
};

// Prescriptions API
export const prescriptionsApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/prescriptions${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/prescriptions/${id}`),
    create: (data: any) => apiRequest('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/prescriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/prescriptions/${id}`, {
        method: 'DELETE',
    }),
};

// Lab Work API
export const labWorkApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/lab-work${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/lab-work/${id}`),
    create: (data: any) => apiRequest('/lab-work', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/lab-work/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/lab-work/${id}`, {
        method: 'DELETE',
    }),
};

// Billing API
export const billingApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/billing/${id}`),
    create: (data: any) => apiRequest('/billing', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/billing/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/billing/${id}`, {
        method: 'DELETE',
    }),
};

// Inventory API
export const inventoryApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/inventory${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/inventory/${id}`),
    create: (data: any) => apiRequest('/inventory', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/inventory/${id}`, {
        method: 'DELETE',
    }),
};

// Staff API
export const staffApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/staff${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/staff/${id}`),
    create: (data: any) => apiRequest('/staff', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/staff/${id}`, {
        method: 'DELETE',
    }),
};

// Documents API
export const documentsApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/documents${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/documents/${id}`),
    upload: (formData: FormData) => fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
    }).then(res => res.json()),
    update: (id: string, data: any) => apiRequest(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/documents/${id}`, {
        method: 'DELETE',
    }),
};

// Settings API
export const settingsApi = {
    getAll: () => apiRequest('/settings'),
    getSetting: (category: string, key: string) => apiRequest(`/settings/${category}/${key}`),
    updateClinic: (data: any) => apiRequest('/settings/clinic', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    updateAppointment: (data: any) => apiRequest('/settings/appointment', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    updateBilling: (data: any) => apiRequest('/settings/billing', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    updateNotification: (data: any) => apiRequest('/settings/notification', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};

// Auth API
export const authApi = {
    login: (email: string, password: string) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    }),
    register: (data: any) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    logout: () => apiRequest('/auth/logout', {
        method: 'POST',
    }),
    getMe: () => apiRequest('/auth/me'),
};
