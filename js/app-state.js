// Application state management
const appState = {
    employees: [
        { id: 1, name: 'Jan Kowalski', rate: 25.00, payroll: 1000.00 },
        { id: 2, name: 'Anna Nowak', rate: 27.50, payroll: 1200.00 }
    ],
    settings: {
        regularHoursLimit: 40,
        overtimeRateMultiplier: 1.5,
        currency: 'PLN',
        language: 'pl',
        resetPassword: '' // Add th
    },
    bankHolidays: [
        { id: 1, name: 'Nowy Rok', date: '2025-01-01' },
        { id: 2, name: 'Święto Pracy', date: '2025-05-01' }
    ],
    schedule: {}, // Will store schedule data by employee ID, week, and day
    currentEmployeeId: 1,
    currentDate: new Date(),
    currentWeekStart: null,
    currentMonth: null,
    currentYear: null
};

// Save app data to localStorage
function saveAppData() {
    console.log('Zapisuję dane aplikacji:', JSON.stringify(appState.employees));
    console.log('localStorage dostępny:', typeof localStorage !== 'undefined');
    localStorage.setItem('harmonogramApp', JSON.stringify({
        employees: appState.employees,
        settings: appState.settings,
        bankHolidays: appState.bankHolidays,
        schedule: appState.schedule
    }));
}

// Load app data from localStorage
function loadAppData() {
    console.log('Loading application data from localStorage...');
    
    try {
        const savedData = localStorage.getItem('harmonogramApp');
        
        if (savedData) {
            // Try to parse data
            try {
                const parsedData = JSON.parse(savedData);
                
                // Load data if available
                if (parsedData.employees) appState.employees = parsedData.employees;
                if (parsedData.settings) appState.settings = parsedData.settings;
                if (parsedData.bankHolidays) appState.bankHolidays = parsedData.bankHolidays;
                if (parsedData.schedule) appState.schedule = parsedData.schedule;
                
                console.log('Data loaded successfully from localStorage');
            } catch (parseError) {
                console.error('Error parsing data from localStorage:', parseError);
            }
        } else {
            console.log('No saved data in localStorage, using defaults');
        }
        
        // Check and repair app state if needed
        checkAppState();
        
        // Set current employee ID to first employee if available
        if (appState.employees.length > 0 && !appState.currentEmployeeId) {
            appState.currentEmployeeId = appState.employees[0].id;
        }
        
        // Update settings fields
        const regularHoursLimitInput = document.getElementById('regular-hours-limit');
        const overtimeRateMultiplierInput = document.getElementById('overtime-rate-multiplier');
        const currencySelect = document.getElementById('currency-select');
        const languageSelect = document.getElementById('language-select');
        const headerLanguageSelect = document.getElementById('header-language-select');
        
        if (regularHoursLimitInput) regularHoursLimitInput.value = appState.settings.regularHoursLimit;
        if (overtimeRateMultiplierInput) overtimeRateMultiplierInput.value = appState.settings.overtimeRateMultiplier;
        if (currencySelect) currencySelect.value = appState.settings.currency;
        if (languageSelect) languageSelect.value = appState.settings.language;
        if (headerLanguageSelect) headerLanguageSelect.value = appState.settings.language;
    } catch (error) {
        console.error('Error loading application data:', error);
    }
}

// Check if application is in working state and try to recover if not
function checkAppState() {
    console.log('Checking application state...');
    
    // Check if employees exist
    if (!appState.employees || appState.employees.length === 0) {
        console.warn('No employees, adding defaults...');
        appState.employees = [
            { id: 1, name: 'Jan Kowalski', rate: 25.00 },
            { id: 2, name: 'Anna Nowak', rate: 27.50 }
        ];
    }
    
    if (!appState.employees || appState.employees.length === 0) {
        console.warn('No employees, adding defaults...');
        appState.employees = [
            { id: 1, name: 'Jan Kowalski', rate: 25.00, payroll: 1000.00 },
            { id: 2, name: 'Anna Nowak', rate: 27.50, payroll: 1200.00 }
        ];
    }

    // Check if current employee is set
    if (!appState.currentEmployeeId || !appState.employees.some(e => e.id === appState.currentEmployeeId)) {
        console.warn('Invalid current employee, setting first...');
        appState.currentEmployeeId = appState.employees[0].id;
    }
    
    // Check settings
    if (!appState.settings) {
        console.warn('No settings, setting defaults...');
        appState.settings = {
            regularHoursLimit: 40,
            overtimeRateMultiplier: 1.5,
            currency: 'PLN',
            language: 'pl'
        };
    }
    
    // Check holidays
    if (!appState.bankHolidays || !Array.isArray(appState.bankHolidays)) {
        console.warn('No bank holidays, setting defaults...');
        appState.bankHolidays = [
            { id: 1, name: 'Nowy Rok', date: '2025-01-01' },
            { id: 2, name: 'Święto Pracy', date: '2025-05-01' }
        ];
    }
    
    // Check if schedule is an object
    if (!appState.schedule || typeof appState.schedule !== 'object') {
        console.warn('Invalid schedule, resetting...');
        appState.schedule = {};
    }
    
    console.log('Application state checked and repaired');
    saveAppData();
}

// Add sample data for testing
function addMockData() {
    // Add sample schedule data for the current week
    const today = new Date();
    const currentWeekStart = new Date(today);
    const day = today.getDay() || 7; // Convert Sunday (0) to 7
    currentWeekStart.setDate(today.getDate() - day + 1); // Set to Monday of current week
    
    // Add some sample schedule entries
    for (let i = 0; i < 5; i++) { // Monday to Friday
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        const dateString = formatDate(date);
        
        // Add for first employee
        appState.schedule[`1_${dateString}`] = {
            start: "09:00",
            end: "17:00"
        };
        
        // Add for second employee with different hours
        appState.schedule[`2_${dateString}`] = {
            start: "08:00",
            end: "16:00"
        };
    }
    
    console.log('Mock data added to schedule');
}