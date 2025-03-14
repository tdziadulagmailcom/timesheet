// Employees-related functions

// Render employees list
function renderEmployeesList() {
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '';
    
    const language = appState.settings.language;
    
    appState.employees.forEach(employee => {
        const item = document.createElement('div');
        item.className = 'employee-item';
        
        // Dodaj informację o payroll
        const payrollText = language === 'pl' ? 'Payroll' : 'Payroll';
        const payrollValue = employee.payroll ? formatCurrency(employee.payroll) : formatCurrency(0);
        
        item.innerHTML = `
            <div>
                <strong>${employee.name}</strong><br>
                ${language === 'pl' ? 'Stawka' : 'Rate'}: ${formatCurrency(employee.rate)}/${language === 'pl' ? 'h' : 'hr'}<br>
                ${payrollText}: ${payrollValue}
            </div>
            <div>
                <button class="btn btn-secondary edit-employee" data-id="${employee.id}">${translations[language]['edit']}</button>
                <button class="btn btn-danger delete-employee" data-id="${employee.id}">${translations[language]['delete']}</button>
            </div>
        `;
        
        employeesList.appendChild(item);
    });
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
    
    // Add employee to the array
    appState.employees.push({
        id: newId,
        name: name,
        rate: rate,
        payroll: payroll
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
    
    // Aktualizacja danych pracownika
    employee.name = newName.trim();
    employee.rate = parsedRate;
    employee.payroll = parsedPayroll;
    
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