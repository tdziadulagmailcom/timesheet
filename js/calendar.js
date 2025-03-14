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
                        
                        if (daySchedule && daySchedule.start && daySchedule.end) {
                            hasSchedules = true;
                            
                            // Format hours
                            const hours = calculateHours(daySchedule.start, daySchedule.end);
                            const formattedHours = formatHoursForCalendar(hours);
                            
                            // Add employee schedule to cell
                            cellContent += `
                                <div class="employee-schedule">
                                    <span class="employee-name" data-employee-id="${employee.id}">${employee.name}</span>
                                    <span class="employee-hours">${formattedHours}</span>
                                </div>
                            `;
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