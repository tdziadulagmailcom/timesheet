// Calendar-related functions

// Update calendar UI
// Modyfikacja funkcji updateCalendarUI w calendar.js
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
        
        tableBody.innerHTML = '';
        
        // Get first day of month
        const firstDay = new Date(appState.currentYear, appState.currentMonth, 1);
        
        // Get day of week for first day (0-6, adjust Monday to 0)
        let firstDayOfWeek = firstDay.getDay() || 7;
        firstDayOfWeek--; // Adjust to 0-6 with Monday as 0
        
        // Get last day of month
        const lastDay = new Date(appState.currentYear, appState.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        console.log(`First day of week: ${firstDayOfWeek}, days in month: ${daysInMonth}`);
        
        // Create rows and cells for calendar
        let date = 1;
        
        // Get language
        const language = appState.settings.language || 'pl';
        const bankHolidayText = language === 'pl' ? 'Dzień świąteczny' : 'Bank Holiday';
        
        // Create rows for calendar
        for (let i = 0; i < 6; i++) {
            // Check if we've gone past the last day of the month
            if (date > daysInMonth) break;
            
            const row = document.createElement('tr');
            
            // Create cells for each day of the week
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                
                // Add date to calendar only if we've reached the first day of month and haven't gone past the last day
                if ((i === 0 && j < firstDayOfWeek) || date > daysInMonth) {
                    cell.innerHTML = '';
                } else {
                    // Create cell content
                    const cellDate = new Date(appState.currentYear, appState.currentMonth, date);
                    const dateString = formatDate(cellDate);
                    
                    // Check if day is a holiday
                    const isBankHol = isBankHoliday(dateString);
                    if (isBankHol) {
                        cell.classList.add('bank-holiday');
                    }
                    
                    // Create cell content
                    let cellContent = `<div class="calendar-date">${date}</div>`;
                    
                    // Add holiday label if applicable
                    if (isBankHol) {
                        cellContent += `<div class="bank-holiday-label">${bankHolidayText}</div>`;
                    }
                    
                    // Add hours section for employee schedules
                    cellContent += '<div class="calendar-hours">';
                    
                    // Get schedules for all employees on this date
                    let hasSchedules = false;
                    appState.employees.forEach(employee => {
                        const scheduleKey = `${employee.id}_${dateString}`;
                        const daySchedule = appState.schedule[scheduleKey];
                        
                        if (daySchedule) {
                            hasSchedules = true;
                            
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
                                // Określ, czy należy użyć klasy (dla typów) czy nie (dla godzin)
                                const hoursClass = (typeClass ? typeClass : 'employee-hours');
                                
                                // Add employee schedule to cell
                                cellContent += `
                                    <div class="employee-schedule">
                                        <span class="employee-name" data-employee-id="${employee.id}">${employee.name}</span>
                                        <span class="${hoursClass}">${displayText}</span>
                                    </div>
                                `;
                            }
                        }
                    });
                    
                    // Close hours section
                    cellContent += '</div>';
                    
                    cell.innerHTML = cellContent;
                    date++;
                }
                
                row.appendChild(cell);
            }
            
            tableBody.appendChild(row);
        }
        
        // Highlight selected employee in calendar
        highlightSelectedEmployee();
        
        console.log('Calendar updated successfully');
    } catch (error) {
        console.error('Error updating calendar:', error);
    }
}

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
            
            // Dodaj panel do wrappera treści
            contentWrapper.appendChild(summaryPanel);
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
        
        // Znajdź wszystkie elementy nazw pracowników w kalendarzu
        document.querySelectorAll('.employee-name').forEach(nameElement => {
            // Usuń istniejące klasy podświetlenia
            nameElement.classList.remove('highlighted-employee');
            
            // Jeśli wybrano pracownika, podświetl go
            if (selectedEmployeeId) {
                // Pobierz ID pracownika z atrybutu data
                const employeeId = nameElement.getAttribute('data-employee-id');
                
                // Dodaj podświetlenie, jeśli to wybrany pracownik
                if (employeeId === selectedEmployeeId) {
                    nameElement.classList.add('highlighted-employee');
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