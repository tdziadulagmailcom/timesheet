// Utility functions

// Set the current week start date to Monday of the given date's week
function setCurrentWeekStart(date) {
    const dayOfWeek = date.getDay() || 7; // Get day of week (0-6, Sunday is 0), treat Sunday as 7
    const mondayOffset = 1 - dayOfWeek; // Calculate offset to Monday
    
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    appState.currentWeekStart = monday;
}

// Get a date object for a specific day in the current week
function getDateForDay(dayIndex) {
    const date = new Date(appState.currentWeekStart);
    date.setDate(appState.currentWeekStart.getDate() + dayIndex);
    return date;
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Format date for display (DD.MM.YYYY)
function formatDateForDisplay(date) {
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

// Format week range for display
function formatWeekRange() {
    const weekEnd = new Date(appState.currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return `${formatDateForDisplay(appState.currentWeekStart)} - ${formatDateForDisplay(weekEnd)}`;
}

// Format month and year for display
function formatMonthYear(month, year) {
    try {
        const language = appState.settings.language || 'pl';
        
        // Fallback month names in case translations don't work
        const monthsPL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
                          'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
        const monthsEN = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Check if translations exist
        if (translations[language] && translations[language]['months']) {
            return `${translations[language]['months'][month]} ${year}`;
        } else {
            // If no translations, use default arrays
            return `${language === 'pl' ? monthsPL[month] : monthsEN[month]} ${year}`;
        }
    } catch (error) {
        console.error('Error formatting month and year:', error);
        // In case of error return simple format
        return `${month + 1}/${year}`;
    }
}

// Check if a date is a bank holiday
function isBankHoliday(dateStr) {
    return appState.bankHolidays.some(holiday => holiday.date === dateStr);
}

// Get bank holiday name for a date
function getBankHolidayName(dateStr) {
    const holiday = appState.bankHolidays.find(h => h.date === dateStr);
    return holiday ? holiday.name : null;
}

// Convert hours from HH:MM format to decimal hours
function convertToDecimalHours(timeStr) {
    if (!timeStr) return 0;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
}

// Format decimal hours to "X hr" format
function formatHoursForCalendar(timeStr) {
    if (!timeStr) return '';
    
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        // Round to full hours or show with one decimal place
        if (minutes === 0) {
            return `${hours} hr`;
        }
        return `${hours + (minutes / 60).toFixed(1)} hr`;
    } catch (error) {
        console.error('Error formatting hours for calendar:', error);
        return '0 hr';
    }
}

// Format currency based on selected currency
function formatCurrency(amount) {
    // Get currency from app state
    const currency = appState.settings.currency;
    const symbol = currencySymbols[currency];
    
    // Format based on currency type
    if (currency === 'PLN') {
        return `${amount.toFixed(2)} ${symbol}`;
    } else {
        return `${symbol}${amount.toFixed(2)}`;
    }
}

// Calculate hours between start and end times
function calculateHours(startTime, endTime) {
    if (!startTime || !endTime) return '';
    
    try {
        // Parse times
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        // Calculate total minutes
        let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        
        // Handle overnight shifts
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }
        
        // Convert to hours and minutes format
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (error) {
        console.error('Error calculating hours:', error);
        return '';
    }
}

// Format hours display for the schedule table
function formatHoursForDisplay(timeStr) {
    if (!timeStr) return '';
    
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // If we have only hours without minutes
        if (minutes === 0) {
            return `${hours} hr`;
        }
        
        // Show hours and minutes properly formatted
        return `${hours} hr ${minutes} min`;
    } catch (error) {
        console.error('Error formatting hours for display:', error);
        return '';
    }
}

// Safe way to add event listeners
function safeBind(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(event, handler);
    } else {
        console.warn(`Element with ID "${elementId}" not found for binding event "${event}"`);
    }
}