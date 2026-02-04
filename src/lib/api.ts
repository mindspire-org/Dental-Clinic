// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
    getPatientFlow: (period?: string) =>
        apiRequest(`/dashboard/patient-flow${period ? `?period=${period}` : ''}`),
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
    addSession: (id: string, data?: any) => apiRequest(`/treatments/${id}/sessions`, {
        method: 'POST',
        body: JSON.stringify(data || {}),
    }),
    updateSession: (id: string, sessionId: string, data?: any) => apiRequest(`/treatments/${id}/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(data || {}),
    }),
    update: (id: string, data: any) => apiRequest(`/treatments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/treatments/${id}`, {
        method: 'DELETE',
    }),
};

// Treatment Procedures API
export const treatmentProceduresApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/treatment-procedures${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/treatment-procedures/${id}`),
    create: (data: any) => apiRequest('/treatment-procedures', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/treatment-procedures/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/treatment-procedures/${id}`, {
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
    getSummary: () => apiRequest('/lab-work/summary'),
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

// Lab Test Templates API
export const labTestTemplatesApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/lab-test-templates${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/lab-test-templates/${id}`),
    create: (data: any) => apiRequest('/lab-test-templates', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/lab-test-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/lab-test-templates/${id}`, {
        method: 'DELETE',
    }),
};

// Billing API
export const billingApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/invoices${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/billing/invoices/${id}`),
    create: (data: any) => apiRequest('/billing/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/billing/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/billing/invoices/${id}`, {
        method: 'DELETE',
    }),

    getPayments: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/payments${query ? `?${query}` : ''}`);
    },
    recordPayment: (data: any) => apiRequest('/billing/payments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getInsuranceClaims: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/insurance${query ? `?${query}` : ''}`);
    },
    createInsuranceClaim: (data: any) => apiRequest('/billing/insurance', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // Context-specific billing
    getAppointmentsForBilling: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/checkup/appointments${query ? `?${query}` : ''}`);
    },
    createCheckupInvoice: (data: any) => apiRequest('/billing/checkup', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateCheckupInvoice: (id: string, data: any) => apiRequest(`/billing/checkup/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteCheckupInvoice: (id: string) => apiRequest(`/billing/checkup/${id}`, {
        method: 'DELETE',
    }),
    getCheckupReceipt: (id: string) => apiRequest(`/billing/checkup/${id}/receipt`),
    getCheckupStats: () => apiRequest('/billing/checkup/stats'),

    getTreatmentsForBilling: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/procedure/treatments${query ? `?${query}` : ''}`);
    },
    createProcedureInvoice: (data: any) => apiRequest('/billing/procedure', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateProcedureInvoice: (id: string, data: any) => apiRequest(`/billing/procedure/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteProcedureInvoice: (id: string) => apiRequest(`/billing/procedure/${id}`, {
        method: 'DELETE',
    }),
    getProcedureReceipt: (id: string) => apiRequest(`/billing/procedure/${id}/receipt`),
    getProcedureStats: () => apiRequest('/billing/procedure/stats'),

    getLabWorkForBilling: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/lab/labwork${query ? `?${query}` : ''}`);
    },
    createLabInvoice: (data: any) => apiRequest('/billing/lab', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateLabInvoice: (id: string, data: any) => apiRequest(`/billing/lab/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteLabInvoice: (id: string) => apiRequest(`/billing/lab/${id}`, {
        method: 'DELETE',
    }),
    getLabReceipt: (id: string) => apiRequest(`/billing/lab/${id}/receipt`),
    getLabStats: () => apiRequest('/billing/lab/stats'),

    getPrescriptionsForBilling: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/prescription/prescriptions${query ? `?${query}` : ''}`);
    },
    createPrescriptionInvoice: (data: any) => apiRequest('/billing/prescription', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updatePrescriptionInvoice: (id: string, data: any) => apiRequest(`/billing/prescription/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deletePrescriptionInvoice: (id: string) => apiRequest(`/billing/prescription/${id}`, {
        method: 'DELETE',
    }),
    getPrescriptionReceipt: (id: string) => apiRequest(`/billing/prescription/${id}/receipt`),
    getPrescriptionStats: () => apiRequest('/billing/prescription/stats'),

    // Invoice receipt and printing
    markPrinted: (id: string) => apiRequest(`/billing/invoices/${id}/print`, {
        method: 'POST',
    }),
};

// Inventory API
export const inventoryApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/inventory${query ? `?${query}` : ''}`);
    },
    getLowStock: () => apiRequest('/inventory/low-stock'),
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

    suppliers: {
        getAll: (params?: any) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest(`/inventory/suppliers${query ? `?${query}` : ''}`);
        },
        getById: (id: string) => apiRequest(`/inventory/suppliers/${id}`),
        create: (data: any) => apiRequest('/inventory/suppliers', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => apiRequest(`/inventory/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => apiRequest(`/inventory/suppliers/${id}`, {
            method: 'DELETE',
        }),
    },

    orders: {
        getAll: (params?: any) => {
            const query = new URLSearchParams(params).toString();
            return apiRequest(`/inventory/orders${query ? `?${query}` : ''}`);
        },
        getById: (id: string) => apiRequest(`/inventory/orders/${id}`),
        create: (data: any) => apiRequest('/inventory/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => apiRequest(`/inventory/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => apiRequest(`/inventory/orders/${id}`, {
            method: 'DELETE',
        }),
        receive: (id: string) => apiRequest(`/inventory/orders/${id}/receive`, {
            method: 'POST',
        }),
    },
};

// Reports API
export const reportsApi = {
    getFinancial: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/reports/financial${query ? `?${query}` : ''}`);
    },
};

// Staff API
export const staffApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/staff${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/staff/${id}`),
    getRoleManagementModules: () => apiRequest('/staff/role-management/modules'),
    getRoleManagementUsers: () => apiRequest('/staff/role-management/users'),
    setRoleManagementUserPermissions: (userId: string, payload: { permissions: string[] }) =>
        apiRequest(`/staff/role-management/users/${userId}/permissions`, { method: 'PUT', body: JSON.stringify(payload) }),
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

// Dentists API
export const dentistsApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/dentists${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/dentists/${id}`),
    create: (data: any) => apiRequest('/dentists', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/dentists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/dentists/${id}`, {
        method: 'DELETE',
    }),
};

// Waiting List API
export const waitingListApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/waiting-list${query ? `?${query}` : ''}`);
    },
    create: (data: any) => apiRequest('/waiting-list', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/waiting-list/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/waiting-list/${id}`, {
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
    upload: async (formData: FormData) => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const res = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data?.message || 'Upload failed');
        }
        return data;
    },
    update: (id: string, data: any) => apiRequest(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    createFolder: (data: any) => apiRequest('/documents/folders', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/documents/${id}`, {
        method: 'DELETE',
    }),
};

// ... rest of the code remains the same ...
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
    ownerLogin: (email: string, password: string, licenseKey: string) => apiRequest('/auth/owner-login', {
        method: 'POST',
        body: JSON.stringify({ email, password, licenseKey }),
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

// License API (Super Admin)
export const licenseApi = {
    getModules: async () => apiRequest('/license/modules'),
    getLicense: async () => apiRequest('/license'),
    activate: async (payload: { enabledModules: string[] }) => apiRequest('/license/activate', { method: 'POST', body: JSON.stringify(payload) }),
    setLicenseKey: async (payload: { licenseKey: string }) => apiRequest('/license/key', { method: 'PUT', body: JSON.stringify(payload) }),
    getAdmins: async () => apiRequest('/license/admins'),
    setAllAdminPermissions: async (payload: { permissions: string[] }) => apiRequest('/license/admins/permissions', { method: 'PUT', body: JSON.stringify(payload) }),
    setAdminPermissions: async (adminId: string, payload: { permissions: string[] }) => apiRequest(`/license/admins/${adminId}/permissions`, { method: 'PUT', body: JSON.stringify(payload) }),
};

// Expenses API
export const expensesApi = {
    getAll: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/expenses${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/expenses/${id}`),
    create: (data: any) => apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/expenses/${id}`, {
        method: 'DELETE',
    }),
    getStats: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/expenses/stats/summary${query ? `?${query}` : ''}`);
    },
    getCategoryBreakdown: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/expenses/stats/category-breakdown${query ? `?${query}` : ''}`);
    },
    getByDateRange: (params?: any) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/expenses/stats/date-range${query ? `?${query}` : ''}`);
    },
    approve: (id: string, data: any) => apiRequest(`/expenses/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};
