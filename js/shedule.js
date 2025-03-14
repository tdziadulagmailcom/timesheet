// Schedule-related functions

// Update the schedule UI based on current state
function updateScheduleUI() {
    console.log('Updating schedule UI...');
    try {
        // Update week display
        document.getElementById('current-week-display').textContent = formatWeekRange();
        
        // Get schedule table body
        const tableBody = document.getElementById('schedule-table-body');
        tableBody.innerHTML = '';
        
        // Create row for each day of the week
        const language = appState.settings.language;
        const days = translations[language]['days'];
        
        for (let i = 0; i < 7; i++) {
            const date = getDateForDay(i);
            const dateString = formatDate(date);
            
            // Get saved schedule for this day, if it exists
            const scheduleKey = `${appState.currentEmployeeId}_${dateString}`;
            const daySchedule = appState.schedule[scheduleKey] || { start: '', end: '' };
            
            const row = document.createElement('tr');
            
            // Check if day is a holiday
            const isBankHol = isBankHoliday(dateString);
            if (isBankHol) {
                row.classList.add('bank-holiday');
            }
            
            // Calculate hours in new format (X hr)
            const hoursValue = calculateHours(daySchedule.start, daySchedule.end);
            const formattedHours = hoursValue ? formatHoursForDisplay(hoursValue) : '';
            
            row.innerHTML = `
                <td>${days[i]}${isBankHol ? `<br><span class="bank-holiday-label">${translations[language]['bank-holiday']}</span>` : ''}</td>
                <td>${formatDateForDisplay(date)}</td>
                <td><input type="time" class="start-time" data-day="${i}" value="${daySchedule.start}" step="900"></td>
                <td><input type="time" class="end-time" data-day="${i}" value="${daySchedule.end}" step="900"></td>
                <td class="hours-cell" data-day="${i}">${formattedHours}</td>
            `;
            
            tableBody.appendChild(row);
        }
        
        // Add event listeners to time inputs
        initScheduleInputs();
        
        // Update summary
        updateWeekSummary();
        
        console.log('Schedule UI updated successfully');
    } catch (error) {
        console.error('Error updating schedule UI:', error);
    }
}

// Initialize schedule time inputs event listeners
function initScheduleInputs() {
    console.log('Initializing time fields...');
    
    try {
        // Replace standard time fields with custom selectors
        document.querySelectorAll('.start-time, .end-time').forEach(timeInput => {
            const dayIndex = timeInput.getAttribute('data-day');
            const isStartTime = timeInput.classList.contains('start-time');
            const timeValue = timeInput.value;
            
            // Create div for custom time selector
            const customTimeSelect = document.createElement('div');
            customTimeSelect.className = 'custom-time-select';
            customTimeSelect.setAttribute('data-day', dayIndex);
            customTimeSelect.setAttribute('data-type', isStartTime ? 'start' : 'end');
            
            // Create select for hours
            const hourSelect = document.createElement('select');
            hourSelect.className = 'hour-select';
            
            // Add hour options (0-23)
            for (let h = 0; h < 24; h++) {
                const option = document.createElement('option');
                option.value = String(h).padStart(2, '0');
                option.textContent = h;
                hourSelect.appendChild(option);
            }
            
            // Create select for minutes
            const minuteSelect = document.createElement('select');
            minuteSelect.className = 'minute-select';
            
            // Add minute options (only 00, 15, 30, 45)
            [0, 15, 30, 45].forEach(m => {
                const option = document.createElement('option');
                option.value = String(m).padStart(2, '0');
                option.textContent = String(m).padStart(2, '0');
                minuteSelect.appendChild(option);
            });
            
            // Add separator
            const separator = document.createElement('span');
            separator.textContent = ':';
            
            // Set initial values if they exist
            if (timeValue) {
                const [hours, minutes] = timeValue.split(':');
                hourSelect.value = hours;
                
                // Round minutes to nearest quarter
                const min = parseInt(minutes);
                let roundedMin = Math.round(min / 15) * 15;
                if (roundedMin === 60) roundedMin = 45;
                minuteSelect.value = String(roundedMin).padStart(2, '0');
            }
            
            // Add event listeners to update original input
            const updateTime = () => {
                const newTime = `${hourSelect.value}:${minuteSelect.value}`;
                timeInput.value = newTime;
                timeInput.dispatchEvent(new Event('change'));
            };
            
            hourSelect.addEventListener('change', updateTime);
            minuteSelect.addEventListener('change', updateTime);
            
            // Build selector
            customTimeSelect.appendChild(hourSelect);
            customTimeSelect.appendChild(separator);
            customTimeSelect.appendChild(minuteSelect);
            
            // Replace original input with new selector
            timeInput.style.display = 'none';
            timeInput.parentNode.insertBefore(customTimeSelect, timeInput);
        });
        
        // Add event listeners for original fields
        const timeInputs = document.querySelectorAll('.start-time, .end-time');
        timeInputs.forEach(input => {
            input.addEventListener('change', updateHoursForDay);
        });
        
        console.log('Time fields initialized successfully');
    } catch (error) {
        console.error('Error initializing time fields:', error);
    }
}

// Update hours display for a specific day when time inputs change
function updateHoursForDay(event) {
    console.log('Updating hours for day...');
    
    try {
        const dayIndex = event.target.getAttribute('data-day');
        const startInput = document.querySelector(`.start-time[data-day="${dayIndex}"]`);
        const endInput = document.querySelector(`.end-time[data-day="${dayIndex}"]`);
        const hoursCell = document.querySelector(`.hours-cell[data-day="${dayIndex}"]`);
        
        if (!startInput || !endInput || !hoursCell) {
            console.error('Could not find elements for updating hours');
            return;
        }
        
        const hours = calculateHours(startInput.value, endInput.value);
        // Use new formatting function to display hours in "X hr" format
        hoursCell.textContent = formatHoursForDisplay(hours);
        
        // Update summary
        updateWeekSummary();
        
        console.log('Hours updated successfully');
    } catch (error) {
        console.error('Error updating hours for day:', error);
    }
}

// Calculate total hours for the week
function calculateTotalHours() {
    let totalMinutes = 0;
    
    for (let i = 0; i < 7; i++) {
        const startInput = document.querySelector(`.start-time[data-day="${i}"]`);
        const endInput = document.querySelector(`.end-time[data-day="${i}"]`);
        
        if (startInput.value && endInput.value) {
            const hours = calculateHours(startInput.value, endInput.value);
            const [h, m] = hours.split(':').map(Number);
            totalMinutes += h * 60 + m;
        }
    }
    
    return totalMinutes;
}

// Update week summary section
function updateWeekSummary() {
    const totalMinutes = calculateTotalHours();
    const regularHoursLimit = appState.settings.regularHoursLimit * 60; // Convert to minutes
    
    // Calculate regular and overtime hours
    const regularMinutes = Math.min(totalMinutes, regularHoursLimit);
    const overtimeMinutes = Math.max(0, totalMinutes - regularHoursLimit);
    
    // Format hours
    const formatHoursFromMinutes = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    
    // Get employee rate
    const employee = appState.employees.find(emp => emp.id === Number(appState.currentEmployeeId));
    const rate = employee ? employee.rate : 0;
    
    // Calculate values
    const regularValue = (regularMinutes / 60) * rate;
    const overtimeValue = (overtimeMinutes / 60) * rate * appState.settings.overtimeRateMultiplier;
    const totalValue = regularValue + overtimeValue;
    
    // Update the summary table
    document.getElementById('regular-hours').textContent = formatHoursFromMinutes(regularMinutes);
    document.getElementById('overtime-hours').textContent = formatHoursFromMinutes(overtimeMinutes);
    document.getElementById('total-hours').textContent = formatHoursFromMinutes(totalMinutes);
    
    document.getElementById('regular-value').textContent = formatCurrency(regularValue);
    document.getElementById('overtime-value').textContent = formatCurrency(overtimeValue);
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
}

// Save schedule data
function saveSchedule() {
    // For each day of the week, save start and end times
    for (let i = 0; i < 7; i++) {
        const date = getDateForDay(i);
        const dateString = formatDate(date);
        const startInput = document.querySelector(`.start-time[data-day="${i}"]`);
        const endInput = document.querySelector(`.end-time[data-day="${i}"]`);
        
        const scheduleKey = `${appState.currentEmployeeId}_${dateString}`;
        
        // Only save if both start and end times are set
        if (startInput.value && endInput.value) {
            appState.schedule[scheduleKey] = {
                start: startInput.value,
                end: endInput.value
            };
        } else if (appState.schedule[scheduleKey]) {
            // Remove entry if times are cleared
            delete appState.schedule[scheduleKey];
        }
    }
    
    // Print the schedule for debugging
    console.log('Current schedule after save:', appState.schedule);
    
    // Save to localStorage
    saveAppData();
    
    // Update calendar
    updateCalendarUI();
    
    // Show confirmation
    const language = appState.settings.language;
    alert(translations[language]['schedule-saved']);
}

// Export week schedule to Excel
function exportWeekToExcel() {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Get employee name
    const employee = appState.employees.find(emp => emp.id === Number(appState.currentEmployeeId));
    const employeeName = employee ? employee.name : 'Pracownik';
    
    // Get translations for current language
    const language = appState.settings.language;
    const days = translations[language]['days'];
    
    // Create data for the worksheet
    const wsData = [
        [(language === 'pl' ? 'Harmonogram pracy - ' : 'Work Schedule - ') + employeeName, '', '', '', ''],
        [(language === 'pl' ? 'Tydzień:' : 'Week:'), formatWeekRange(), '', '', ''],
        ['', '', '', '', ''],
        [
            translations[language]['th-day'], 
            translations[language]['th-date'], 
            translations[language]['th-start'], 
            translations[language]['th-end'], 
            translations[language]['th-hours']
        ]
    ];
    
    // Add data for each day
    for (let i = 0; i < 7; i++) {
        const date = getDateForDay(i);
        const dateString = formatDate(date);
        const displayDate = formatDateForDisplay(date);
        
        const scheduleKey = `${appState.currentEmployeeId}_${dateString}`;
        const daySchedule = appState.schedule[scheduleKey] || { start: '', end: '' };
        
        // Check if the day is a bank holiday
        const bankHolidayName = getBankHolidayName(dateString);
        
        wsData.push([
            days[i] + (bankHolidayName ? ` (${translations[language]['bank-holiday']}: ${bankHolidayName})` : ''),
            displayDate,
            daySchedule.start,
            daySchedule.end,
            calculateHours(daySchedule.start, daySchedule.end)
        ]);
    }
    
    // Add empty row before summary
    wsData.push(['', '', '', '', '']);
    
    // Add summary section
    const regularHours = document.getElementById('regular-hours').textContent;
    const overtimeHours = document.getElementById('overtime-hours').textContent;
    const totalHours = document.getElementById('total-hours').textContent;
    
    const regularValue = document.getElementById('regular-value').textContent;
    const overtimeValue = document.getElementById('overtime-value').textContent;
    const totalValue = document.getElementById('total-value').textContent;
    
    wsData.push([translations[language]['summary-title'], '', '', '', '']);
    wsData.push([
        translations[language]['th-category'], 
        '', 
        translations[language]['th-summary-hours'], 
        '', 
        translations[language]['th-value']
    ]);
    wsData.push([translations[language]['label-regular-hours'], '', regularHours, '', regularValue]);
    wsData.push([translations[language]['label-overtime-hours'], '', overtimeHours, '', overtimeValue]);
    wsData.push([translations[language]['label-total'], '', totalHours, '', totalValue]);
    
    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    
    // Add to workbook
    XLSX.utils.book_append_sheet(wb, ws, language === 'pl' ? "Harmonogram" : "Schedule");
    
    // Generate filename with week range
    const filename = `${language === 'pl' ? 'Harmonogram' : 'Schedule'}_${employeeName}_${formatDateForDisplay(appState.currentWeekStart)}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
}

// Navigate to previous week
function navigateToPreviousWeek() {
    const newDate = new Date(appState.currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
    updateScheduleUI();
}

// Navigate to next week
function navigateToNextWeek() {
    const newDate = new Date(appState.currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
    updateScheduleUI();
}