// Application state management
const appState = {
    employees: [
        { id: 1, name: 'Jan Kowalski', rate: 25.00, payroll: 1000.00, avgHoursPerWeek: 0 },
        { id: 2, name: 'Anna Nowak', rate: 27.50, payroll: 1200.00, avgHoursPerWeek: 0 }
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

// Save app data to database or localStorage
async function saveAppData() {
    console.log('Saving application data...');

    try {
        if (databaseInterface.useDatabase()) {
            // Save to database
            await Promise.all([
                databaseInterface.employees.save(appState.employees),
                databaseInterface.settings.save(appState.settings),
                databaseInterface.bankHolidays.save(appState.bankHolidays),
                databaseInterface.schedule.save(appState.schedule)
            ]);
            console.log('Data saved to database');
        } else {
            // Save to localStorage as fallback
            localStorage.setItem('harmonogramApp', JSON.stringify({
                employees: appState.employees,
                settings: appState.settings,
                bankHolidays: appState.bankHolidays,
                schedule: appState.schedule
            }));
            console.log('Data saved to localStorage');
        }
    } catch (error) {
        console.error('Error saving application data:', error);

        // Try localStorage as fallback if database save fails
        try {
            localStorage.setItem('harmonogramApp', JSON.stringify({
                employees: appState.employees,
                settings: appState.settings,
                bankHolidays: appState.bankHolidays,
                schedule: appState.schedule
            }));
            console.log('Data saved to localStorage as fallback');
        } catch (localError) {
            console.error('Error saving to localStorage:', localError);
        }
    }
}

// Load app data from database or localStorage
async function loadAppData() {
    console.log('Loading application data...');

    try {
        if (databaseInterface.useDatabase()) {
            // Load from database
            try {
                const [employees, settings, bankHolidays, schedule] = await Promise.all([
                    databaseInterface.employees.getAll(),
                    databaseInterface.settings.get(),
                    databaseInterface.bankHolidays.getAll(),
                    databaseInterface.schedule.getAll()
                ]);

                // Update appState with retrieved data
                if (employees) appState.employees = employees;
                if (settings) appState.settings = settings;
                if (bankHolidays) appState.bankHolidays = bankHolidays;
                if (schedule) appState.schedule = schedule;

                console.log('Data loaded from database');
            } catch (dbError) {
                console.error('Error loading from database:', dbError);
                // Fall back to localStorage if database load fails
                loadFromLocalStorage();
            }
        } else {
            // Load from localStorage
            loadFromLocalStorage();
        }

        // Update average hours for all employees
        appState.employees.forEach(employee => {
            employee.avgHoursPerWeek = calculateAvgHoursPerWeek(employee.id);
            employee.targetHoursPerWeek = employee.targetHoursPerWeek || 0;
            employee.targetHoursPerDay = employee.targetHoursPerDay || 0;
        });

        // Make sure default holiday days value is set
        if (!appState.settings.defaultHolidayDays) {
            appState.settings.defaultHolidayDays = 26; // Default 26 days
        }

        // Check and repair app state if needed
        checkAppState();

        // Set current employee ID to first employee if available
        if (appState.employees.length > 0 && !appState.currentEmployeeId) {
            appState.currentEmployeeId = appState.employees[0].id;
        }

        // Update settings fields in UI
        updateSettingsUI();

    } catch (error) {
        console.error('Error loading application data:', error);
    }
}

// Helper function to load from localStorage
function loadFromLocalStorage() {
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
    } catch (error) {
        console.error('Error accessing localStorage:', error);
    }
}

// New function to update settings UI
function updateSettingsUI() {
    const regularHoursLimitInput = document.getElementById('regular-hours-limit');
    const overtimeRateMultiplierInput = document.getElementById('overtime-rate-multiplier');
    const currencySelect = document.getElementById('currency-select');
    const languageSelect = document.getElementById('language-select');
    const headerLanguageSelect = document.getElementById('header-language-select');
    const defaultHolidayDaysInput = document.getElementById('default-holiday-days');

    if (regularHoursLimitInput) regularHoursLimitInput.value = appState.settings.regularHoursLimit;
    if (overtimeRateMultiplierInput) overtimeRateMultiplierInput.value = appState.settings.overtimeRateMultiplier;
    if (currencySelect) currencySelect.value = appState.settings.currency;
    if (languageSelect) languageSelect.value = appState.settings.language;
    if (headerLanguageSelect) headerLanguageSelect.value = appState.settings.language;
    if (defaultHolidayDaysInput) defaultHolidayDaysInput.value = appState.settings.defaultHolidayDays;
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

    // Ensure each employee has holiday days set
    appState.employees.forEach(employee => {
        employee.holidayDaysPerYear = employee.holidayDaysPerYear || 26;
    });

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