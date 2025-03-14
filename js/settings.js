// Settings-related functions

// Save settings
function saveSettings() {
    console.log('Saving settings...');
    const regularHoursLimitInput = document.getElementById('regular-hours-limit');
    const overtimeRateMultiplierInput = document.getElementById('overtime-rate-multiplier');
    const currencySelect = document.getElementById('currency-select');
    const languageSelect = document.getElementById('language-select');
    const resetPasswordInput = document.getElementById('reset-password');
    const resetPassword = resetPasswordInput.value;
    
    const regularHoursLimit = parseInt(regularHoursLimitInput.value);
    const overtimeRateMultiplier = parseFloat(overtimeRateMultiplierInput.value);
    const currency = currencySelect.value;
    const language = languageSelect.value;
    
    console.log('New settings values:', {
        regularHoursLimit,
        overtimeRateMultiplier,
        currency,
        language
    });
    
    if (isNaN(regularHoursLimit) || regularHoursLimit < 0) {
        alert(translations[language]['invalid-hours-limit']);
        return;
    }
    
    if (isNaN(overtimeRateMultiplier) || overtimeRateMultiplier < 1) {
        alert(translations[language]['invalid-multiplier']);
        return;
    }
    
    // Store previous settings to check for changes
    const prevSettings = { ...appState.settings };
    
    // Update settings
    appState.settings.regularHoursLimit = regularHoursLimit;
    appState.settings.overtimeRateMultiplier = overtimeRateMultiplier;
    appState.settings.currency = currency;
    appState.settings.resetPassword = resetPassword;
    
    console.log('Settings updated in appState');
    
    // Save to localStorage first
    saveAppData();
    
    // Update summary to reflect new settings
    updateWeekSummary();
    
    // If currency changed, update employee list display
    if (prevSettings.currency !== currency) {
        console.log('Currency changed, updating employee list');
        renderEmployeesList();
    }
    
    // Update language if changed (do this last as it refreshes the UI)
    if (prevSettings.language !== language) {
        console.log('Language changed, updating UI');
        updateLanguage(language);
    }
    
    alert(translations[language]['settings-saved']);
}

// Render bank holidays list
function renderBankHolidaysList() {
    const holidaysList = document.getElementById('bank-holiday-list');
    holidaysList.innerHTML = '';
    
    const language = appState.settings.language;
    
    appState.bankHolidays.forEach(holiday => {
        const item = document.createElement('div');
        item.className = 'bank-holiday-item';
        
        // Format date for display
        const dateParts = holiday.date.split('-');
        const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
        
        item.innerHTML = `
            <div>
                <strong>${holiday.name}</strong><br>
                ${formattedDate}
            </div>
            <div>
                <button class="btn btn-danger delete-holiday" data-id="${holiday.id}">${translations[language]['delete']}</button>
            </div>
        `;
        
        holidaysList.appendChild(item);
    });
}

// Add new bank holiday
function addBankHoliday() {
    const nameInput = document.getElementById('bank-holiday-name');
    const dateInput = document.getElementById('bank-holiday-date');
    
    const name = nameInput.value.trim();
    const date = dateInput.value;
    
    const language = appState.settings.language;
    
    if (!name) {
        alert(translations[language]['invalid-holiday-name']);
        return;
    }
    
    if (!date) {
        alert(translations[language]['invalid-holiday-date']);
        return;
    }
    
    // Generate new ID
    const newId = appState.bankHolidays.length > 0 
        ? Math.max(...appState.bankHolidays.map(h => h.id)) + 1 
        : 1;
    
    // Add bank holiday to the array
    appState.bankHolidays.push({
        id: newId,
        name: name,
        date: date
    });
    
    // Save to localStorage
    saveAppData();
    
    // Clear inputs
    nameInput.value = '';
    dateInput.value = '';
    
    // Update UI
    renderBankHolidaysList();
    updateScheduleUI();
    updateCalendarUI();
    
    alert(translations[language]['holiday-added']);
}

// Delete bank holiday
function deleteBankHoliday(event) {
    const holidayId = Number(event.target.getAttribute('data-id'));
    
    const language = appState.settings.language;
    
    // Confirm deletion
    if (!confirm(translations[language]['confirm-delete-holiday'])) {
        return;
    }
    
    // Remove bank holiday from array
    appState.bankHolidays = appState.bankHolidays.filter(h => h.id !== holidayId);
    
    // Save to localStorage
    saveAppData();
    
    // Update UI
    renderBankHolidaysList();
    updateScheduleUI();
    updateCalendarUI();
    
    alert(translations[language]['holiday-deleted']);
}