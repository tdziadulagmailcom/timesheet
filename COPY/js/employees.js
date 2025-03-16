function renderEmployeesList() {
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '';
    
    const language = appState.settings.language;
    const currentYear = new Date().getFullYear();
    
    appState.employees.forEach(employee => {
        const item = document.createElement('div');
        item.className = 'employee-item';
        
        // Przygotuj obiekt holidayDaysByYear jeśli nie istnieje
        if (!employee.holidayDaysByYear) {
            employee.holidayDaysByYear = {};
        }
        
        // Pobierz wartość dla bieżącego roku lub wartość domyślną
        const holidayDaysForCurrentYear = employee.holidayDaysByYear[currentYear] || 
                                         employee.holidayDaysPerYear || 
                                         appState.settings.defaultHolidayDays || 
                                         26;
        
        // Dodaj informację o payroll i średniej godzin
        const payrollText = language === 'pl' ? 'Payroll' : 'Payroll';
        const avgHoursText = language === 'pl' ? 'Średnia godzin/tydzień' : 'Average hours/week';
        const avgDailyText = language === 'pl' ? 'Średnia godzin/dzień' : 'Average hours/day';
        const overrideText = 'Override';
        const holidayDaysText = language === 'pl' ? 'Dni urlopowe' : 'Holiday days';
        const yearText = language === 'pl' ? 'Rok' : 'Year';
        const payrollValue = employee.payroll ? formatCurrency(employee.payroll) : formatCurrency(0);
        const avgHours = employee.avgHoursPerWeek ? employee.avgHoursPerWeek.toFixed(1) : '0.0';
        const avgDailyHours = employee.avgHoursPerWeek ? (employee.avgHoursPerWeek / 5).toFixed(1) : '0.0';
        const targetHours = employee.targetHoursPerWeek || 0;
        const targetDailyHours = employee.targetHoursPerDay || 0;
        
        item.innerHTML = `
            <div>
                <strong>${employee.name}</strong><br>
                ${language === 'pl' ? 'Stawka' : 'Rate'}: ${formatCurrency(employee.rate)}/${language === 'pl' ? 'h' : 'hr'}<br>
                ${payrollText}: ${payrollValue}<br>
                ${avgHoursText}: ${avgHours} 
                <span style="margin-left: 20px;">${overrideText}: <input type="number" class="target-hours" data-id="${employee.id}" value="${targetHours}" min="0" max="168" step="0.5" style="width: 60px; padding: 2px 5px;"></span><br>
                ${avgDailyText}: ${avgDailyHours} 
                <span style="margin-left: 20px;">${overrideText}: <input type="number" class="target-daily-hours" data-id="${employee.id}" value="${targetDailyHours}" min="0" max="24" step="0.5" style="width: 60px; padding: 2px 5px;"></span>
                <br>${holidayDaysText} (${yearText}: ${currentYear}): <input type="number" class="holiday-days" data-id="${employee.id}" data-year="${currentYear}" value="${holidayDaysForCurrentYear}" min="0" max="365" style="width: 60px; padding: 2px 5px;">
            </div>
            <div>
                <button class="btn btn-secondary edit-employee" data-id="${employee.id}">${translations[language]['edit']}</button>
                <button class="btn btn-danger delete-employee" data-id="${employee.id}">${translations[language]['delete']}</button>
            </div>
        `;
        
        employeesList.appendChild(item);
    });
    
    // Dodaj obsługę zdarzeń dla pól docelowej liczby godzin
    document.querySelectorAll('.target-hours').forEach(input => {
        input.addEventListener('change', updateTargetHours);
    });
    
    // Dodaj obsługę zdarzeń dla pól docelowej dziennej liczby godzin
    document.querySelectorAll('.target-daily-hours').forEach(input => {
        input.addEventListener('change', updateTargetDailyHours);
    });
    
    // Zaktualizuj obsługę zdarzeń dla pól dni urlopowych
    document.querySelectorAll('.holiday-days').forEach(input => {
        input.addEventListener('change', updateHolidayDays);
    });
}

// Funkcja do aktualizacji docelowej dziennej liczby godzin
function updateTargetDailyHours(event) {
    const employeeId = Number(event.target.getAttribute('data-id'));
    const targetDailyHours = parseFloat(event.target.value);
    
    // Znajdź pracownika i zaktualizuj wartość
    const employee = appState.employees.find(emp => emp.id === employeeId);
    if (employee) {
        employee.targetHoursPerDay = targetDailyHours;
        saveAppData();
    }
}

// Funkcja do aktualizacji docelowej liczby godzin
function updateTargetHours(event) {
    const employeeId = Number(event.target.getAttribute('data-id'));
    const targetHours = parseFloat(event.target.value);
    
    // Znajdź pracownika i zaktualizuj wartość
    const employee = appState.employees.find(emp => emp.id === employeeId);
    if (employee) {
        employee.targetHoursPerWeek = targetHours;
        saveAppData();
    }
}

// Zaktualizuj funkcję updateHolidayDays
function updateHolidayDays(event) {
    const employeeId = Number(event.target.getAttribute('data-id'));
    const year = Number(event.target.getAttribute('data-year'));
    const holidayDays = parseInt(event.target.value);
    
    // Znajdź pracownika i zaktualizuj wartość
    const employee = appState.employees.find(emp => emp.id === employeeId);
    if (employee) {
        // Upewnij się, że obiekt holidayDaysByYear istnieje
        if (!employee.holidayDaysByYear) {
            employee.holidayDaysByYear = {};
        }
        
        // Zaktualizuj dni urlopowe dla konkretnego roku
        employee.holidayDaysByYear[year] = holidayDays;
        
        // Zachowaj kompatybilność z istniejącym kodem
        employee.holidayDaysPerYear = holidayDays;
        
        saveAppData();
    }
}

// Obliczanie średniej godzin z ostatnich 13 tygodni
function calculateAvgHoursPerWeek(employeeId) {
    const today = new Date();
    let totalHours = 0;
    let weeksCount = 0;
    
    // Cofamy się o 13 tygodni (91 dni)
    for (let i = 0; i < 13; i++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (7 * i) - today.getDay() + 1);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        let weekHours = 0;
        const currentDate = new Date(weekStart);
        
        // Liczymy godziny w każdym dniu tygodnia
        while (currentDate <= weekEnd) {
            const dateString = formatDate(currentDate);
            const scheduleKey = `${employeeId}_${dateString}`;
            const daySchedule = appState.schedule[scheduleKey];
            
            if (daySchedule && daySchedule.start && daySchedule.end) {
                const hoursStr = calculateHours(daySchedule.start, daySchedule.end);
                if (hoursStr) {
                    const [hours, minutes] = hoursStr.split(':').map(Number);
                    weekHours += hours + (minutes / 60);
                }
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        if (weekHours > 0) {
            totalHours += weekHours;
            weeksCount++;
        }
    }
    
    return weeksCount > 0 ? totalHours / weeksCount : 0;
}

// Add new employee
function addEmployee() {
    console.log('Adding new employee...');
    const nameInput = document.getElementById('employee-name');
    const rateInput = document.getElementById('employee-rate');
    const payrollInput = document.getElementById('employee-payroll');
    
    const name = nameInput.value.trim();
    const rate = parseFloat(rateInput.value);
    const payroll = parseFloat(payrollInput.value) || 0;
    
    const language = appState.settings.language;
    
    if (!name) {
        alert(translations[language]['invalid-name']);
        return;
    }
    
    if (isNaN(rate) || rate <= 0) {
        alert(translations[language]['invalid-rate']);
        return;
    }
    
    // Generate new ID
    const newId = appState.employees.length > 0 
        ? Math.max(...appState.employees.map(emp => emp.id)) + 1 
        : 1;
    
    console.log('New employee ID:', newId);
    
    // Dla nowego pracownika ustawiamy 0
    const avgHoursPerWeek = 0;
    
    // Add employee to the array
    appState.employees.push({
        id: newId,
        name: name,
        rate: rate,
        payroll: payroll,
        avgHoursPerWeek: avgHoursPerWeek,
        targetHoursPerWeek: 0,
        targetHoursPerDay: 0
    });
    
    console.log('Employee added:', { id: newId, name: name, rate: rate });
    
    // Save to localStorage
    saveAppData();
    
    // Clear inputs
    nameInput.value = '';
    rateInput.value = '';
    payrollInput.value = '';
    
    // Update UI
    renderEmployeesList();
    populateEmployeeSelectors();
    
    // If this is the first employee, set as current and update UI
    if (appState.employees.length === 1) {
        appState.currentEmployeeId = newId;
        updateScheduleUI();
        updateCalendarUI();
    }
    
    alert(translations[language]['employee-added']);
}

// Edit employee
function editEmployee(event) {
    const employeeId = Number(event.target.getAttribute('data-id'));
    const employee = appState.employees.find(emp => emp.id === employeeId);
    
    if (!employee) return;
    
    const language = appState.settings.language;
    
    const newName = prompt(language === 'pl' ? 'Podaj nowe imię i nazwisko:' : 'Enter new name:', employee.name);
    if (!newName || newName.trim() === '') return;
    
    const newRate = prompt(language === 'pl' ? 'Podaj nową stawkę godzinową:' : 'Enter new hourly rate:', employee.rate);
    const parsedRate = parseFloat(newRate);
    
    if (isNaN(parsedRate) || parsedRate <= 0) {
        alert(translations[language]['invalid-rate']);
        return;
    }
    
    const newPayroll = prompt(language === 'pl' ? 'Podaj nową kwotę payroll:' : 'Enter new payroll amount:', employee.payroll || 0);
    const parsedPayroll = parseFloat(newPayroll);
    
    if (isNaN(parsedPayroll) || parsedPayroll < 0) {
        alert(language === 'pl' ? 'Proszę podać prawidłową kwotę payroll.' : 'Please enter a valid payroll amount.');
        return;
    }
    
    // Oblicz średnią godzin
    const avgHoursPerWeek = calculateAvgHoursPerWeek(employeeId);
    
    // W funkcji editEmployee() dodaj:
    // Zachowaj istniejącą wartość targetHoursPerWeek lub ustaw 0
    employee.targetHoursPerWeek = employee.targetHoursPerWeek || 0;
    employee.targetHoursPerDay = employee.targetHoursPerDay || 0;

    // Aktualizacja danych pracownika
    employee.name = newName.trim();
    employee.rate = parsedRate;
    employee.payroll = parsedPayroll;
    employee.avgHoursPerWeek = avgHoursPerWeek;
    
    // Save to localStorage
    saveAppData();
    
    // Update UI
    renderEmployeesList();
    populateEmployeeSelectors();
    updateScheduleUI();
    updateCalendarUI();
    console.log('Zaktualizowany pracownik:', employee); // Do debugowania
    
    // Update summary if the current employee is being edited
    if (employeeId === Number(appState.currentEmployeeId)) {
        updateWeekSummary();
    }
    
    alert(translations[language]['employee-updated']);
}

// Delete employee
function deleteEmployee(event) {
    const employeeId = Number(event.target.getAttribute('data-id'));
    
    const language = appState.settings.language;
    
    // Confirm deletion
    if (!confirm(translations[language]['confirm-delete-employee'])) {
        return;
    }
    
    // Remove employee from array
    appState.employees = appState.employees.filter(emp => emp.id !== employeeId);
    
    // Remove all schedule entries for this employee
    Object.keys(appState.schedule).forEach(key => {
        if (key.startsWith(`${employeeId}_`)) {
            delete appState.schedule[key];
        }
    });
    
    // Save to localStorage
    saveAppData();
    
    // Update UI
    renderEmployeesList();
    populateEmployeeSelectors();
    
    // If the deleted employee was the current one, select the first available
    if (employeeId === Number(appState.currentEmployeeId)) {
        appState.currentEmployeeId = appState.employees.length > 0 ? appState.employees[0].id : 1;
        document.getElementById('employee-select').value = appState.currentEmployeeId;
        document.getElementById('calendar-employee-select').value = appState.currentEmployeeId;
        updateScheduleUI();
        updateCalendarUI();
    }
    
    alert(translations[language]['employee-deleted']);
}

// Handle employee change in schedule tab
function handleEmployeeChange(event) {
    appState.currentEmployeeId = Number(event.target.value);
    updateScheduleUI();
}

// Handle employee change in calendar tab
function handleCalendarEmployeeChange(event) {
    console.log('Employee change in calendar, this should not affect displayed data');
    // Changing employee in calendar no longer affects what is displayed,
    // because we always show schedules for all employees
    appState.currentEmployeeId = Number(event.target.value);
}