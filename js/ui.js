// UI-related functions

// Tab functionality
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to selected tab and content
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Add event listeners
function addEventListeners() {
    console.log('Adding event listeners...');
    
    initCustomCategoryFields();

    try {
        
        // Initialize schedule inputs
        initScheduleInputs();
        
        safeBind('reset-week', 'click', resetWeek);

        // Employee selectors
        safeBind('employee-select', 'change', handleEmployeeChange);
        safeBind('calendar-employee-select', 'change', handleCalendarEmployeeChange);

        // Navigation buttons
        safeBind('prev-week', 'click', navigateToPreviousWeek);
        safeBind('next-week', 'click', navigateToNextWeek);
        safeBind('prev-month', 'click', navigateToPreviousMonth);
        safeBind('next-month', 'click', navigateToNextMonth);

        // Action buttons
        safeBind('save-schedule', 'click', saveSchedule);
        safeBind('export-week', 'click', exportWeekToExcel);
        safeBind('add-employee', 'click', addEmployee);
        safeBind('save-settings', 'click', saveSettings);
        safeBind('add-bank-holiday', 'click', addBankHoliday);

        // Dodaj obsługę przycisku odblokowywania harmonogramu
        safeBind('unlock-schedule', 'click', unlockSchedule);

        // Currency selector
        safeBind('currency-select', 'change', function(e) {
            appState.settings.currency = e.target.value;
            updateWeekSummary();
            renderEmployeesList();
            saveAppData();
        });

        // Language selectors
        safeBind('header-language-select', 'change', function(e) {
            updateLanguage(e.target.value);
            const langSelect = document.getElementById('language-select');
            if (langSelect) langSelect.value = e.target.value;
        });

        safeBind('language-select', 'change', function(e) {
            updateLanguage(e.target.value);
            const headerLangSelect = document.getElementById('header-language-select');
            if (headerLangSelect) headerLangSelect.value = e.target.value;
        });

        // Set up event delegation for bank holiday delete buttons
        const holidayList = document.getElementById('bank-holiday-list');
        if (holidayList) {
            holidayList.addEventListener('click', function(e) {
                if (e.target.classList.contains('delete-holiday')) {
                    deleteBankHoliday(e);
                }
            });
        }
        
        // Set up event delegation for employee buttons
        const employeesList = document.getElementById('employees-list');
        if (employeesList) {
            employeesList.addEventListener('click', function(e) {
                if (e.target.classList.contains('edit-employee')) {
                    editEmployee(e);
                } else if (e.target.classList.contains('delete-employee')) {
                    deleteEmployee(e);
                }
            });
        }
        
        console.log('Event listeners added successfully');
    } catch (error) {
        console.error('Error adding event listeners:', error);
    }
}

// Update UI language
function updateLanguage(language) {
    console.log('Updating language to:', language);
    
    const category1Input = document.getElementById('custom-category-1');
    const category2Input = document.getElementById('custom-category-2');

    if (category1Input) category1Input.placeholder = translations[language]['custom-category-1-placeholder'];
    if (category2Input) category2Input.placeholder = translations[language]['custom-category-2-placeholder'];

    // Make sure language is valid
    if (language !== 'pl' && language !== 'en') {
        console.error('Invalid language:', language);
        language = 'pl'; // Default to Polish
    }
    
    // Update settings
    appState.settings.language = language;
    
    try {
        // Set language selector values
        const headerLangSelect = document.getElementById('header-language-select');
        const settingsLangSelect = document.getElementById('language-select');
        
        if (headerLangSelect) headerLangSelect.value = language;
        if (settingsLangSelect) settingsLangSelect.value = language;
        // Update payments summary label if it exists
        const paymentsTotalLabel = document.querySelector('.payments-total-container div:first-child');
        if (paymentsTotalLabel) {
            paymentsTotalLabel.textContent = language === 'pl' ? 'Suma niezapłaconych:' : 'Total unpaid:';
        }
        
        // Update text for all elements with translation
        if (translations[language]) {
            const translationKeys = Object.keys(translations[language]);
            
            translationKeys.forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.textContent = translations[language][key];
                }
            });
            
            // Update elements with data-translate attribute
            document.querySelectorAll('[data-translate]').forEach(element => {
                const translationKey = element.getAttribute('data-translate');
                if (translations[language][translationKey]) {
                    element.textContent = translations[language][translationKey];
                }
            });
            
            // Update placeholders
            const employeeNameInput = document.getElementById('employee-name');
            const employeeRateInput = document.getElementById('employee-rate');
            const holidayNameInput = document.getElementById('bank-holiday-name');
            
            if (employeeNameInput) employeeNameInput.placeholder = language === 'pl' ? 'Np. Jan Kowalski' : 'E.g. John Smith';
            if (employeeRateInput) employeeRateInput.placeholder = language === 'pl' ? 'Np. 20.00' : 'E.g. 20.00';
            if (holidayNameInput) holidayNameInput.placeholder = language === 'pl' ? 'Np. Boże Narodzenie' : 'E.g. Christmas Day';
            
            // Update calendar header day names
            const dayIds = ['day-mon', 'day-tue', 'day-wed', 'day-thu', 'day-fri', 'day-sat', 'day-sun'];
            const dayTextPL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];
            const dayTextEN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            dayIds.forEach((id, index) => {
                const dayElement = document.getElementById(id);
                if (dayElement) {
                    dayElement.textContent = language === 'pl' ? dayTextPL[index] : dayTextEN[index];
                }
            });
        }
        
        // Update dynamic UI elements
        if (typeof updateWeekSummary === 'function') updateWeekSummary();
        if (typeof renderEmployeesList === 'function') renderEmployeesList();
        if (typeof renderBankHolidaysList === 'function') renderBankHolidaysList();
        if (typeof updateScheduleUI === 'function') updateScheduleUI();
        if (typeof updateCalendarUI === 'function') updateCalendarUI();
        
        // Zaktualizuj tłumaczenia zakładki płatności
        if (typeof updatePaymentsTranslations === 'function') updatePaymentsTranslations();

        // Save settings to localStorage
        if (typeof saveAppData === 'function') saveAppData();
        
        console.log('Language updated successfully');
    } catch (error) {
        console.error('Error updating language:', error);
        alert('An error occurred while changing language. Try refreshing the page.');
    }
}

// Populate employee selectors in different tabs
function populateEmployeeSelectors() {
    const selectors = ['employee-select', 'calendar-employee-select'];
    
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        select.innerHTML = '';
        
        // Dodaj pustą opcję tylko dla selektora kalendarza
        if (selectorId === 'calendar-employee-select') {
            const language = appState.settings.language || 'pl';
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = language === 'pl' ? '-- Brak podświetlenia --' : '-- No highlight --';
            select.appendChild(emptyOption);
        }
        
        appState.employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name;
            select.appendChild(option);
        });
        
        // Ustaw domyślną wartość
        select.value = selectorId === 'calendar-employee-select' ? '' : appState.currentEmployeeId;
    });
}