// Calendar-related functions

// Update calendar UI
function updateCalendarUI() {
    console.log('Updating calendar...');
    try {
        // Update month display
        const monthDisplay = document.getElementById('current-month-display');
        if (monthDisplay) {
            monthDisplay.textContent = formatMonthYear(appState.currentMonth, appState.currentYear);
        }
        
        // Create or update the monthly summary panel
        createOrUpdateMonthlySummaryPanel();
        
        // Create or update the yearly summary panel
        createOrUpdateYearlySummaryPanel();
             
        // Get calendar table body
        const tableBody = document.getElementById('calendar-table-body');
        if (!tableBody) {
            console.error('Element calendar-table-body not found');
            return;
        }
        
        // Clear previous content
        tableBody.innerHTML = '';
        
        // Get first day of month
        const firstDay = new Date(appState.currentYear, appState.currentMonth, 1);
        
        // Get last day of month
        const lastDay = new Date(appState.currentYear, appState.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        console.log(`Days in month: ${daysInMonth}`);
        
        // Get language
        const language = appState.settings.language || 'pl';
        const bankHolidayText = language === 'pl' ? 'Dzień świąteczny' : 'Bank Holiday';
        
        // Get day name abbreviations based on language
        const dayAbbreviations = language === 'pl' 
            ? ['P', 'W', 'Ś', 'C', 'P', 'S', 'N'] 
            : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        
        // Create header row with days
        const headerRow = document.createElement('tr');
        headerRow.className = 'calendar-header-row';
        
        // Add empty cell for employee names column
        const emptyHeaderCell = document.createElement('th');
        emptyHeaderCell.className = 'employee-name-header';
        emptyHeaderCell.textContent = language === 'pl' ? 'Pracownik' : 'Employee';
        headerRow.appendChild(emptyHeaderCell);
        
        // Create cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(appState.currentYear, appState.currentMonth, day);
            const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
            const dateString = formatDate(date);
            
            // Check if day is a holiday
            const isBankHol = isBankHoliday(dateString);
            
            // Create header cell for the day
            const dayCell = document.createElement('th');
            dayCell.className = 'calendar-day-header';
            
            // Add classes for weekends and holidays
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayCell.classList.add('weekend-day');
            }
            if (isBankHol) {
                dayCell.classList.add('bank-holiday');
            }
            
            // Add day number and weekday abbreviation
            dayCell.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-letter">${dayAbbreviations[dayOfWeek === 0 ? 6 : dayOfWeek - 1]}</div>
            `;
            
            headerRow.appendChild(dayCell);
        }
        
        // Add header row to table
        tableBody.appendChild(headerRow);
        
        // Create a row for each employee
        appState.employees.forEach(employee => {
            const employeeRow = document.createElement('tr');
            employeeRow.className = 'employee-schedule-row';
            employeeRow.setAttribute('data-employee-id', employee.id);
            
            // Selected employee highlight
            const selectedEmployeeId = Number(document.getElementById('calendar-employee-select').value);
            if (selectedEmployeeId && employee.id === selectedEmployeeId) {
                employeeRow.classList.add('highlighted-employee-row');
            }
            
            // Create employee name cell
            const nameCell = document.createElement('td');
            nameCell.className = 'employee-name-cell';
            nameCell.textContent = employee.name;
            employeeRow.appendChild(nameCell);
            
            // Create cells for each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(appState.currentYear, appState.currentMonth, day);
                const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
                const dateString = formatDate(date);
                
                // Get schedule for this employee on this date
                const scheduleKey = `${employee.id}_${dateString}`;
                const daySchedule = appState.schedule[scheduleKey];
                
                // Create cell for this day
                const dayCell = document.createElement('td');
                dayCell.className = 'calendar-day-cell';
                
                // Add classes for weekends and holidays
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    dayCell.classList.add('weekend-day');
                }
                if (isBankHoliday(dateString)) {
                    dayCell.classList.add('bank-holiday');
                }
                
                // Add schedule information if exists
                if (daySchedule) {
                    // Sprawdź typ dnia
                    const scheduleType = daySchedule.type || '';
                    let displayText = '';
                    let typeClass = '';
                    
                    if (scheduleType === 'Holiday') {
                        displayText = 'H';
                        typeClass = 'holiday-type';
                    } else if (scheduleType === 'Bank Holiday') {
                        displayText = 'BH';
                        typeClass = 'bank-holiday-type';
                    } else if (scheduleType === 'Home') {
                        displayText = 'Ho';
                        typeClass = 'home-type';
                    } else if (scheduleType === 'Sick') {
                        displayText = 'S';
                        typeClass = 'sick-type';
                    } else if (scheduleType === 'Off') {
                        displayText = 'O';
                        typeClass = 'off-type';
                    } else if (daySchedule.start && daySchedule.end) {
                        // Standardowe godziny, jeśli nie ma specjalnego typu
                        const hours = calculateHours(daySchedule.start, daySchedule.end);
                        displayText = formatHoursForCalendar(hours);
                    }
                    
                    if (displayText) {
                        const scheduleDiv = document.createElement('div');
                        scheduleDiv.className = 'day-schedule';
                        if (typeClass) {
                            scheduleDiv.classList.add(typeClass);
                        }
                        scheduleDiv.textContent = displayText;
                        dayCell.appendChild(scheduleDiv);
                    }
                }
                
                employeeRow.appendChild(dayCell);
            }
            
            // Add employee row to table
            tableBody.appendChild(employeeRow);
        });
        
        console.log('Calendar updated successfully');
    } catch (error) {
        console.error('Error updating calendar:', error);
    }
}

// Pozostałe funkcje kalendarza pozostają bez zmian

// Funkcja do tworzenia lub aktualizacji panelu podsumowania rocznego
function createOrUpdateYearlySummaryPanel() {
    try {
        // Sprawdź czy istnieje panel miesięczny, po którym możemy dodać roczny
        const monthlySummaryPanel = document.querySelector('.monthly-summary-panel');
        if (!monthlySummaryPanel) {
            console.error('Nie znaleziono panelu podsumowania miesięcznego');
            return;
        }
        
        // Sprawdź czy panel roczny już istnieje, jeśli nie, utwórz go
        let yearlySummaryPanel = document.querySelector('.yearly-summary-panel');
        if (!yearlySummaryPanel) {
            // Utwórz panel podsumowania
            yearlySummaryPanel = document.createElement('div');
            yearlySummaryPanel.className = 'yearly-summary-panel';
            
            // Utwórz tytuł
            const title = document.createElement('div');
            title.className = 'yearly-summary-title';
            title.id = 'yearly-summary-title';
            const language = appState.settings.language || 'pl';
            title.textContent = language === 'pl' ? 'Podsumowanie roczne' : 'Yearly Summary';
            
            // Utwórz listę
            const list = document.createElement('div');
            list.className = 'yearly-summary-list';
            list.id = 'yearly-summary-list';
            
            // Złóż panel
            yearlySummaryPanel.appendChild(title);
            yearlySummaryPanel.appendChild(list);
            
            // Dodaj panel po panelu miesięcznym
            monthlySummaryPanel.parentNode.insertBefore(yearlySummaryPanel, monthlySummaryPanel.nextSibling);
        }
        
        // Aktualizuj zawartość podsumowania rocznego
        updateYearlySummary();
    } catch (error) {
        console.error('Błąd podczas tworzenia panelu podsumowania rocznego:', error);
    }
}

// Funkcja do aktualizacji podsumowania rocznego
function updateYearlySummary() {
    try {
        const list = document.getElementById('yearly-summary-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        // Pobierz bieżący rok
        const year = appState.currentYear;
        
        // Pobierz ID wybranego pracownika
        const selectedEmployeeId = Number(document.getElementById('calendar-employee-select').value);
        
        // Nagłówek roku
        const language = appState.settings.language || 'pl';
        
        const yearHeader = document.createElement('div');
        yearHeader.className = 'yearly-summary-header';
        yearHeader.textContent = language === 'pl' ? `Rok: ${year}` : `Year: ${year}`;
        list.appendChild(yearHeader);
        
        // Oblicz statystyki dla każdego pracownika
        appState.employees.forEach(employee => {
            // Oblicz statystyki roczne dla pracownika
            const stats = calculateEmployeeYearStats(employee.id, year);
            
            // Oblicz pozostałe dni urlopowe
            const holidayDaysPerYear = employee.holidayDaysPerYear || appState.settings.defaultHolidayDays || 26;
            stats.remainingHolidayDays = holidayDaysPerYear - (stats.holidayDays + stats.bankHolidayDays);

            // Jeśli pracownik ma jakieś dni pracy lub specjalne dni w roku, pokaż go
            if (stats.totalHours > 0 || stats.holidayDays > 0 || stats.bankHolidayDays > 0 || stats.sickDays > 0 || stats.offDays > 0) {
                // Utwórz wiersz pracownika
                const item = document.createElement('div');
                item.className = 'yearly-summary-item';
                
                // Podświetl, jeśli to wybrany pracownik
                if (employee.id === selectedEmployeeId) {
                    item.classList.add('highlighted');
                }
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'yearly-summary-name';
                nameSpan.textContent = employee.name;
                
                const statsDiv = document.createElement('div');
                statsDiv.className = 'yearly-summary-stats';
                
                // Godziny pracy
                const hoursSpan = document.createElement('span');
                hoursSpan.className = 'yearly-summary-hours yearly-summary-stat';
                const hoursLabel = language === 'pl' ? 'Suma godzin: ' : 'Total hours: ';
                hoursSpan.textContent = `${hoursLabel}${stats.totalHours.toFixed(1)} h`;
                
                // Holiday
                const holidaySpan = document.createElement('span');
                holidaySpan.className = 'yearly-summary-holiday yearly-summary-stat';
                holidaySpan.textContent = `Holiday: ${stats.holidayDays}`;
                
                // Bank Holiday
                const bankHolidaySpan = document.createElement('span');
                bankHolidaySpan.className = 'yearly-summary-bank-holiday yearly-summary-stat';
                bankHolidaySpan.textContent = `Bank Holiday: ${stats.bankHolidayDays}`;
                
                // Sick
                const sickSpan = document.createElement('span');
                sickSpan.className = 'yearly-summary-sick yearly-summary-stat';
                sickSpan.textContent = `Sick: ${stats.sickDays}`;
                
                // Off
                const offSpan = document.createElement('span');
                offSpan.className = 'yearly-summary-off yearly-summary-stat';
                offSpan.textContent = `Days Off: ${stats.offDays}`;
                
                statsDiv.appendChild(hoursSpan);
                statsDiv.appendChild(holidaySpan);
                statsDiv.appendChild(bankHolidaySpan);
                statsDiv.appendChild(sickSpan);
                statsDiv.appendChild(offSpan);
                
                // Dodaj specjalną ramkę dla pozostałych dni urlopowych
                const holidayBoxDiv = document.createElement('div');
                holidayBoxDiv.className = 'yearly-summary-holiday-box';

                const remainingHolidaySpan = document.createElement('span');
                remainingHolidaySpan.className = 'yearly-summary-remaining-holiday';
                const holidayLabel = language === 'pl' ? 'Pozostało dni urlopowych: ' : 'Remaining holiday days: ';
                remainingHolidaySpan.textContent = `${holidayLabel}${stats.remainingHolidayDays}`;

                holidayBoxDiv.appendChild(remainingHolidaySpan);
                statsDiv.appendChild(holidayBoxDiv);

                item.appendChild(nameSpan);
                item.appendChild(statsDiv);
                list.appendChild(item);
            }
        });
    } catch (error) {
        console.error('Błąd podczas aktualizacji podsumowania rocznego:', error);
    }
}

// Funkcja do obliczania statystyk pracownika w roku
function calculateEmployeeYearStats(employeeId, year) {
    // Inicjalizacja statystyk
    const stats = {
        totalHours: 0,
        holidayDays: 0,
        bankHolidayDays: 0,
        sickDays: 0,
        offDays: 0,
        remainingHolidayDays: 0
    };    

    // Pobierz pierwszy i ostatni dzień roku
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);
    
    // Inicjalizacja daty bieżącej
    const currentDate = new Date(firstDay);
    
    // Pętla przez każdy dzień roku
    while (currentDate <= lastDay) {
        const dateString = formatDate(currentDate);
        const scheduleKey = `${employeeId}_${dateString}`;
        const daySchedule = appState.schedule[scheduleKey];
        
        if (daySchedule) {
            // Sprawdź typ dnia
            if (daySchedule.type === 'Holiday') {
                stats.holidayDays++;
            } else if (daySchedule.type === 'Bank Holiday') {
                stats.bankHolidayDays++;
            } else if (daySchedule.type === 'Sick') {
                stats.sickDays++;
            } else if (daySchedule.type === 'Off') {
                stats.offDays++;
            } else if (daySchedule.start && daySchedule.end) {
                // Oblicz godziny dla standardowego dnia pracy
                const hoursStr = calculateHours(daySchedule.start, daySchedule.end);
                if (hoursStr) {
                    const [hours, minutes] = hoursStr.split(':').map(Number);
                    stats.totalHours += hours + (minutes / 60);
                }
            }
        }
        
        // Przejdź do następnego dnia
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return stats;
}

// Funkcja do tworzenia lub aktualizacji panelu podsumowania miesięcznego
function createOrUpdateMonthlySummaryPanel() {
    try {
        // Sprawdź czy kontener treści kalendarza istnieje, jeśli nie, utwórz go
        let contentWrapper = document.querySelector('.calendar-content');
        if (!contentWrapper) {
            // Pobierz kontener kalendarza
            const calendarContainer = document.querySelector('.calendar-container');
            if (!calendarContainer) {
                console.error('Nie znaleziono kontenera kalendarza');
                return;
            }
            
            // Utwórz wrapper dla tabeli kalendarza
            const calendarTable = document.querySelector('.calendar');
            const calendarWrapper = document.createElement('div');
            calendarWrapper.className = 'calendar-table-wrapper';
            
            // Wstaw wrapper przed tabelą
            if (calendarTable && calendarTable.parentNode) {
                calendarTable.parentNode.insertBefore(calendarWrapper, calendarTable);
                calendarWrapper.appendChild(calendarTable);
                
                // Utwórz wrapper treści
                contentWrapper = document.createElement('div');
                contentWrapper.className = 'calendar-content';
                
                // Dodaj wrapper treści do kontenera kalendarza po elementach nawigacyjnych
                const monthNavigator = document.querySelector('.month-navigator');
                if (monthNavigator && monthNavigator.nextSibling) {
                    calendarContainer.insertBefore(contentWrapper, monthNavigator.nextSibling);
                } else {
                    calendarContainer.appendChild(contentWrapper);
                }
                
                // Przenieś wrapper kalendarza do wrappera treści
                contentWrapper.appendChild(calendarWrapper);
            } else {
                console.error('Nie znaleziono tabeli kalendarza');
                return;
            }
        }
        
        // Sprawdź czy panel podsumowania istnieje, jeśli nie, utwórz go
        let summaryPanel = document.querySelector('.monthly-summary-panel');
        if (!summaryPanel) {
            // Usuń stary panel podsumowania tygodniowego, jeśli istnieje
            const oldPanel = document.querySelector('.weekly-summary-panel');
            if (oldPanel) {
                oldPanel.remove();
            }
            
            // Utwórz panel podsumowania
            summaryPanel = document.createElement('div');
            summaryPanel.className = 'monthly-summary-panel';
            
            // Utwórz tytuł
            const title = document.createElement('div');
            title.className = 'monthly-summary-title';
            title.id = 'monthly-summary-title';
            const language = appState.settings.language || 'pl';
            title.textContent = language === 'pl' ? 'Podsumowanie miesięczne' : 'Monthly Summary';
            
            // Utwórz listę
            const list = document.createElement('div');
            list.className = 'monthly-summary-list';
            list.id = 'monthly-summary-list';
            
            // Złóż panel
            summaryPanel.appendChild(title);
            summaryPanel.appendChild(list);
            
            // Dodaj panel do wrappera treści PO wrapperze kalendarza
            const calendarWrapper = contentWrapper.querySelector('.calendar-table-wrapper');
            if (calendarWrapper) {
                contentWrapper.appendChild(summaryPanel);
            } else {
                contentWrapper.appendChild(summaryPanel);
            }
        }
        
        // Aktualizuj zawartość podsumowania miesięcznego
        updateMonthlySummary();
    } catch (error) {
        console.error('Błąd podczas tworzenia panelu podsumowania:', error);
    }
}

// Funkcja do aktualizacji podsumowania miesięcznego
function updateMonthlySummary() {
    try {
        const list = document.getElementById('monthly-summary-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        // Pobierz bieżący miesiąc i rok
        const month = appState.currentMonth;
        const year = appState.currentYear;
        
        // Pobierz ID wybranego pracownika
        const selectedEmployeeId = Number(document.getElementById('calendar-employee-select').value);
        
        // Nagłówek miesiąca
        const language = appState.settings.language || 'pl';
        const monthName = translations[language]['months'][month];
        
        const monthHeader = document.createElement('div');
        monthHeader.className = 'monthly-summary-header';
        monthHeader.textContent = language === 'pl' ? `Miesiąc: ${monthName} ${year}` : `Month: ${monthName} ${year}`;
        list.appendChild(monthHeader);
        
        // Oblicz statystyki dla każdego pracownika
        appState.employees.forEach(employee => {
            // Oblicz statystyki miesięczne dla pracownika
            const stats = calculateEmployeeMonthStats(employee.id, month, year);
            
            // Jeśli pracownik ma jakieś dni pracy lub specjalne dni w miesiącu, pokaż go
            if (stats.totalHours > 0 || stats.holidayDays > 0 || stats.bankHolidayDays > 0 || stats.sickDays > 0 || stats.offDays > 0) {                // Utwórz wiersz pracownika
                const item = document.createElement('div');
                item.className = 'monthly-summary-item';
                
                // Podświetl, jeśli to wybrany pracownik
                if (employee.id === selectedEmployeeId) {
                    item.classList.add('highlighted');
                }
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'monthly-summary-name';
                nameSpan.textContent = employee.name;
                
                const statsDiv = document.createElement('div');
                statsDiv.className = 'monthly-summary-stats';
                
                // Godziny pracy
                const hoursSpan = document.createElement('span');
                hoursSpan.className = 'monthly-summary-hours monthly-summary-stat';
                const hoursLabel = language === 'pl' ? 'Suma godzin: ' : 'Total hours: ';
                hoursSpan.textContent = `${hoursLabel}${stats.totalHours.toFixed(1)} h`;
                
                // Holiday
                const holidaySpan = document.createElement('span');
                holidaySpan.className = 'monthly-summary-holiday monthly-summary-stat';
                holidaySpan.textContent = `Holiday: ${stats.holidayDays}`;
                
                // Bank Holiday
                const bankHolidaySpan = document.createElement('span');
                bankHolidaySpan.className = 'monthly-summary-bank-holiday monthly-summary-stat';
                bankHolidaySpan.textContent = `Bank Holiday: ${stats.bankHolidayDays}`;
                
                // Sick
                // Sick
                const sickSpan = document.createElement('span');
                sickSpan.className = 'monthly-summary-sick monthly-summary-stat';
                sickSpan.textContent = `Sick: ${stats.sickDays}`;

                // Off
                const offSpan = document.createElement('span');
                offSpan.className = 'yearly-summary-off monthly-summary-stat';
                offSpan.textContent = `Days Off: ${stats.offDays}`;

                statsDiv.appendChild(hoursSpan);
                statsDiv.appendChild(holidaySpan);
                statsDiv.appendChild(bankHolidaySpan);
                statsDiv.appendChild(sickSpan);
                statsDiv.appendChild(offSpan);                
                item.appendChild(nameSpan);
                item.appendChild(statsDiv);
                list.appendChild(item);
            }
        });
    } catch (error) {
        console.error('Błąd podczas aktualizacji podsumowania miesięcznego:', error);
    }
}

// Funkcja do obliczania statystyk pracownika w miesiącu
function calculateEmployeeMonthStats(employeeId, month, year) {
    // Inicjalizacja statystyk
    const stats = {
        totalHours: 0,
        holidayDays: 0,
        bankHolidayDays: 0,
        sickDays: 0,
        offDays: 0
    };
    
    // Pobierz pierwszy i ostatni dzień miesiąca
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Inicjalizacja daty bieżącej
    const currentDate = new Date(firstDay);
    
    // Pętla przez każdy dzień miesiąca
    while (currentDate <= lastDay) {
        const dateString = formatDate(currentDate);
        const scheduleKey = `${employeeId}_${dateString}`;
        const daySchedule = appState.schedule[scheduleKey];
        
        if (daySchedule) {
            // Sprawdź typ dnia
            if (daySchedule.type === 'Holiday') {
                stats.holidayDays++;
            } else if (daySchedule.type === 'Bank Holiday') {
                stats.bankHolidayDays++;
            } else if (daySchedule.type === 'Sick') {
                stats.sickDays++;
            } else if (daySchedule.type === 'Off') {
                stats.offDays++;
            } else if (daySchedule.start && daySchedule.end) {                // Oblicz godziny dla standardowego dnia pracy
                const hoursStr = calculateHours(daySchedule.start, daySchedule.end);
                if (hoursStr) {
                    const [hours, minutes] = hoursStr.split(':').map(Number);
                    stats.totalHours += hours + (minutes / 60);
                }
            }
        }
        
        // Przejdź do następnego dnia
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return stats;
}

// Funkcja do obliczania godzin pracownika w tygodniu
function calculateEmployeeWeekHours(employeeId, weekStart, weekEnd) {
    let totalHours = 0;
    const currentDate = new Date(weekStart);
    
    // Pętla przez każdy dzień tygodnia
    while (currentDate <= weekEnd) {
        const dateString = formatDate(currentDate);
        const scheduleKey = `${employeeId}_${dateString}`;
        const daySchedule = appState.schedule[scheduleKey];
        
        if (daySchedule && daySchedule.start && daySchedule.end) {
            // Oblicz godziny dla tego dnia
            const hoursStr = calculateHours(daySchedule.start, daySchedule.end);
            if (hoursStr) {
                const [hours, minutes] = hoursStr.split(':').map(Number);
                totalHours += hours + (minutes / 60);
            }
        }
        
        // Przejdź do następnego dnia
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return totalHours;
}

// Funkcja do podświetlania wybranego pracownika w kalendarzu
function highlightSelectedEmployee() {
    try {
        const selectedEmployeeId = document.getElementById('calendar-employee-select').value;
        
        // Znajdź wszystkie wiersze pracowników
        document.querySelectorAll('.employee-schedule-row').forEach(row => {
            // Usuń istniejące klasy podświetlenia
            row.classList.remove('highlighted-employee-row');
            
            // Jeśli wybrano pracownika, podświetl go
            if (selectedEmployeeId) {
                // Pobierz ID pracownika z atrybutu data
                const employeeId = row.getAttribute('data-employee-id');
                
                // Dodaj podświetlenie, jeśli to wybrany pracownik
                if (employeeId === selectedEmployeeId) {
                    row.classList.add('highlighted-employee-row');
                }
            }
        });
    } catch (error) {
        console.error('Błąd podczas podświetlania pracownika:', error);
    }
}

// Modyfikacja funkcji handleCalendarEmployeeChange
function handleCalendarEmployeeChange(event) {
    console.log('Zmieniony pracownik w kalendarzu');
    appState.currentEmployeeId = Number(event.target.value);
    
    // Aktualizuj podsumowanie miesięczne, roczne i podświetlenie wybranego pracownika
    updateMonthlySummary();
    updateYearlySummary();
    highlightSelectedEmployee();
}

function navigateToPreviousMonth() {
    console.log('Going to previous month');
    try {
        appState.currentMonth--;
        if (appState.currentMonth < 0) {
            appState.currentMonth = 11;
            appState.currentYear--;
        }
        console.log(`New month: ${appState.currentMonth + 1}, year: ${appState.currentYear}`);
        updateCalendarUI();
        // Aktualizuj podsumowanie roczne przy zmianie roku
        updateYearlySummary();
    } catch (error) {
        console.error('Error navigating to previous month:', error);
    }
}

function navigateToNextMonth() {
    console.log('Going to next month');
    try {
        appState.currentMonth++;
        if (appState.currentMonth > 11) {
            appState.currentMonth = 0;
            appState.currentYear++;
        }
        console.log(`New month: ${appState.currentMonth + 1}, year: ${appState.currentYear}`);
        updateCalendarUI();
        // Aktualizuj podsumowanie roczne przy zmianie roku
        updateYearlySummary();
    } catch (error) {
        console.error('Error navigating to next month:', error);
    }
}