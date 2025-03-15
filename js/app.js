// Main application script

// Initialize the application
function initApp() {
    console.log('Initializing application...');
    try {
        // Set current week start date (Monday of current week)
        setCurrentWeekStart(appState.currentDate);
        
        // Set current month and year for calendar
        appState.currentMonth = appState.currentDate.getMonth();
        appState.currentYear = appState.currentDate.getFullYear();
        
        console.log(`Current month: ${appState.currentMonth + 1}, year: ${appState.currentYear}`);
        
        // Load data from localStorage if available
        loadAppData();
        
        // Add sample data if no schedule entries exist
        if (Object.keys(appState.schedule).length === 0) {
            addMockData();
        }
        
        // Initialize UI components
        initTabs();
        
        // First add event listeners
        addEventListeners();
        
        // Then update UI
        populateEmployeeSelectors();
        renderEmployeesList();
        renderBankHolidaysList();
        
        // Update UI with current language
        updateLanguage(appState.settings.language);
        
        // After language update, update these UI elements that depend on language
        updateScheduleUI();
        updateCalendarUI();
        initPaymentsTab();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during application initialization:', error);
        alert('An error occurred during application initialization. Try refreshing the page.');
    }
}

// Debug function to print current application state
function debugState() {
    console.log('====== APPLICATION STATE DEBUG ======');
    console.log('Current Employee ID:', appState.currentEmployeeId);
    console.log('Current Week Start:', appState.currentWeekStart);
    console.log('Current Month/Year:', appState.currentMonth + 1, '/', appState.currentYear);
    console.log('Total Employees:', appState.employees.length);
    console.log('Total Bank Holidays:', appState.bankHolidays.length);
    console.log('Total Schedule Entries:', Object.keys(appState.schedule).length);
    console.log('Settings:', appState.settings);
    console.log('===================================');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);