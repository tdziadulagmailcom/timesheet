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
        
        // Create or update the weekly summary panel
        createOrUpdateWeeklySummaryPanel();
        
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

// Funkcja do tworzenia lub aktualizacji panelu podsumowania tygodniowego
function createOrUpdateWeeklySummaryPanel() {
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
        let summaryPanel = document.querySelector('.weekly-summary-panel');
        if (!summaryPanel) {
            // Utwórz panel podsumowania
            summaryPanel = document.createElement('div');
            summaryPanel.className = 'weekly-summary-panel';
            
            // Utwórz tytuł
            const title = document.createElement('div');
            title.className = 'weekly-summary-title';
            title.id = 'weekly-summary-title';
            const language = appState.settings.language || 'pl';
            title.textContent = language === 'pl' ? 'Podsumowanie tygodniowe' : 'Weekly Summary';
            
            // Utwórz listę
            const list = document.createElement('div');
            list.className = 'weekly-summary-list';
            list.id = 'weekly-summary-list';
            
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
        
        // Aktualizuj zawartość podsumowania tygodniowego
        updateWeeklySummary();
    } catch (error) {
        console.error('Błąd podczas tworzenia panelu podsumowania:', error);
    }
}

// Funkcja do aktualizacji podsumowania tygodniowego
function updateWeeklySummary() {
    try {
        const list = document.getElementById('weekly-summary-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        // Pobierz bieżący miesiąc i rok
        const month = appState.currentMonth;
        const year = appState.currentYear;
        
        // Pobierz ID wybranego pracownika
        const selectedEmployeeId = Number(document.getElementById('calendar-employee-select').value);
        
        // Oblicz daty początku i końca dla każdego tygodnia miesiąca
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Utwórz tablicę dat początku tygodnia (poniedziałków)
        const weekStarts = [];
        let currentDate = new Date(firstDay);
        
        // Znajdź poniedziałek na lub przed 1-ym dniem miesiąca
        const dayOfWeek = currentDate.getDay() || 7; // 0 to niedziela, traktujemy jako 7
        currentDate.setDate(currentDate.getDate() - dayOfWeek + 1); // Przesuń do poprzedniego poniedziałku
        
        // Dodaj wszystkie poniedziałki, które wypadają w miesiącu lub tuż przed nim
        while (currentDate <= lastDay) {
            weekStarts.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 7);
        }
        
        // Dla każdego tygodnia oblicz całkowitą liczbę godzin dla każdego pracownika
        const language = appState.settings.language || 'pl';
        
        weekStarts.forEach(weekStart => {
            // Utwórz datę końca tygodnia (niedziela)
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            // Pomiń tygodnie całkowicie poza miesiącem
            if (weekEnd.getMonth() < month && weekEnd.getFullYear() <= year) return;
            if (weekStart.getMonth() > month && weekStart.getFullYear() >= year) return;
            
            // Pobierz zakres tygodnia do wyświetlenia
            const weekRange = `${formatDateForDisplay(weekStart)} - ${formatDateForDisplay(weekEnd)}`;
            
            // Dodaj nagłówek tygodnia
            const weekHeader = document.createElement('div');
            weekHeader.className = 'weekly-summary-header';
            weekHeader.textContent = language === 'pl' ? `Tydzień: ${weekRange}` : `Week: ${weekRange}`;
            list.appendChild(weekHeader);
            
            // Oblicz godziny dla każdego pracownika
            appState.employees.forEach(employee => {
                const employeeHours = calculateEmployeeWeekHours(employee.id, weekStart, weekEnd);
                if (employeeHours > 0) {
                    // Utwórz wiersz pracownika
                    const item = document.createElement('div');
                    item.className = 'weekly-summary-item';
                    
                    // Podświetl, jeśli to wybrany pracownik
                    if (employee.id === selectedEmployeeId) {
                        item.classList.add('highlighted');
                    }
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'weekly-summary-name';
                    nameSpan.textContent = employee.name;
                    
                    const hoursSpan = document.createElement('span');
                    hoursSpan.className = 'weekly-summary-hours';
                    hoursSpan.textContent = `${employeeHours.toFixed(1)} h`;
                    
                    item.appendChild(nameSpan);
                    item.appendChild(hoursSpan);
                    list.appendChild(item);
                }
            });
        });
    } catch (error) {
        console.error('Błąd podczas aktualizacji podsumowania tygodniowego:', error);
    }
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
    
    // Aktualizuj podsumowanie tygodniowe i podświetlenie wybranego pracownika
    updateWeeklySummary();
    highlightSelectedEmployee();
}

// Navigate to previous month in calendar
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
    } catch (error) {
        console.error('Error navigating to previous month:', error);
    }
}

// Navigate to next month in calendar
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
    } catch (error) {
        console.error('Error navigating to next month:', error);
    }
}