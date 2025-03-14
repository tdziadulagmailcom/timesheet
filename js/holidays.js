// Funkcje związane z obsługą dni świątecznych (bank holidays)

// Renderowanie listy dni świątecznych
function renderBankHolidaysList() {
    const holidaysList = document.getElementById('bank-holiday-list');
    holidaysList.innerHTML = '';
    
    const language = appState.settings.language;
    
    appState.bankHolidays.forEach(holiday => {
        const item = document.createElement('div');
        item.className = 'bank-holiday-item';
        
        // Format daty do wyświetlenia
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

// Dodawanie nowego dnia świątecznego
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
    
    // Generowanie nowego ID
    const newId = appState.bankHolidays.length > 0 
        ? Math.max(...appState.bankHolidays.map(h => h.id)) + 1 
        : 1;
    
    // Dodanie dnia świątecznego do tablicy
    appState.bankHolidays.push({
        id: newId,
        name: name,
        date: date
    });
    
    // Zapisanie do localStorage
    saveAppData();
    
    // Wyczyszczenie pól
    nameInput.value = '';
    dateInput.value = '';
    
    // Aktualizacja UI
    renderBankHolidaysList();
    updateScheduleUI();
    updateCalendarUI();
    
    alert(translations[language]['holiday-added']);
}

// Usuwanie dnia świątecznego
function deleteBankHoliday(event) {
    const holidayId = Number(event.target.getAttribute('data-id'));
    
    const language = appState.settings.language;
    
    // Potwierdzenie usunięcia
    if (!confirm(translations[language]['confirm-delete-holiday'])) {
        return;
    }
    
    // Usunięcie dnia świątecznego z tablicy
    appState.bankHolidays = appState.bankHolidays.filter(h => h.id !== holidayId);
    
    // Zapisanie do localStorage
    saveAppData();
    
    // Aktualizacja UI
    renderBankHolidaysList();
    updateScheduleUI();
    updateCalendarUI();
    
    alert(translations[language]['holiday-deleted']);
}

// Sprawdzanie czy data jest dniem świątecznym
function isBankHoliday(dateStr) {
    return appState.bankHolidays.some(holiday => holiday.date === dateStr);
}

// Pobieranie nazwy dnia świątecznego dla danej daty
function getBankHolidayName(dateStr) {
    const holiday = appState.bankHolidays.find(h => h.date === dateStr);
    return holiday ? holiday.name : null;
}