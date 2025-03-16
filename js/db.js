// Database interface for the application

// Configuration
const DB_CONFIG = {
    apiUrl: '/api', // Base URL for the API
    endpoints: {
        employees: '/employees',
        schedule: '/schedule',
        settings: '/settings',
        bankHolidays: '/bank-holidays',
        payments: '/payments'
    }
};

// Initialize database connection
async function initDatabase() {
    console.log('Initializing database connection...');
    try {
        // Test connection
        const response = await fetch(`${DB_CONFIG.apiUrl}/status`);
        if (!response.ok) {
            throw new Error('Database connection failed');
        }
        console.log('Database connection established');
        return true;
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        alert('Failed to connect to the database. Using local storage as fallback.');
        return false;
    }
}

// Generic fetch with error handling
async function fetchWithError(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// CRUD operations for employees
const employeesDB = {
    async getAll() {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.employees}`);
    },

    async getById(id) {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.employees}/${id}`);
    },

    async save(employees) {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.employees}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employees)
        });
    },

    async update(id, employee) {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.employees}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employee)
        });
    },

    async delete(id) {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.employees}/${id}`, {
            method: 'DELETE'
        });
    }
};

// CRUD operations for schedule
const scheduleDB = {
    async getAll() {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.schedule}`);
    },

    async save(scheduleData) {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.schedule}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });
    }
};

// CRUD operations for settings
const settingsDB = {
    async get() {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.settings}`);
    },

    async save(settings) {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.settings}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
    }
};

// CRUD operations for bank holidays
const bankHolidaysDB = {
    async getAll() {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.bankHolidays}`);
    },

    async save(holidays) {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.bankHolidays}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(holidays)
        });
    }
};

// CRUD operations for payments
const paymentsDB = {
    async getStatuses() {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.payments}/statuses`);
    },

    async saveStatuses(statuses) {
        return fetchWithError(`${DB_CONFIG.apiUrl}${DB_CONFIG.endpoints.payments}/statuses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(statuses)
        });
    }
};

// Fallback to localStorage if database is not available
let useDatabase = false;

// Export database interface
const databaseInterface = {
    init: async function () {
        useDatabase = await initDatabase();
        return useDatabase;
    },
    useDatabase: () => useDatabase,
    employees: employeesDB,
    schedule: scheduleDB,
    settings: settingsDB,
    bankHolidays: bankHolidaysDB,
    payments: paymentsDB
};