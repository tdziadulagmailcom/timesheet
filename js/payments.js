// Funkcje związane z płatnościami

// Stan płatności
let paymentsState = {
    payments: [], // Lista płatności
    paidStatuses: {}, // Status opłacenia dla każdej płatności
    unpaidTotal: 0 // Suma niezapłaconych kwot
};

// Inicjalizacja zakładki płatności
// Inicjalizacja zakładki płatności
function initPaymentsTab() {
    // Wypełnij selektor roku
    populateYearSelector();
    
    // Wypełnij selektor pracownika
    populateEmployeeSelector();
    
    // Ustaw domyślne daty
    setDefaultDateRange();
    
    // Dodaj panel podsumowania, jeśli nie istnieje
    createPaymentsSummaryPanel();
    
    // Dodaj nasłuchiwanie zdarzeń
    document.getElementById('calculate-payments').addEventListener('click', calculatePayments);
}

// Tworzenie panelu podsumowania płatności
function createPaymentsSummaryPanel() {
    // Sprawdź czy panel już istnieje
    if (document.querySelector('.payments-summary')) {
        return;
    }
    
    const paymentsContainer = document.querySelector('.payments-container');
    if (!paymentsContainer) return;
    
    // Utwórz panel podsumowania
    const summaryPanel = document.createElement('div');
    summaryPanel.className = 'payments-summary';
    
    // Utwórz kontener dla sumy
    const totalContainer = document.createElement('div');
    totalContainer.className = 'payments-total-container';
    
    const language = appState.settings.language || 'pl';
    const totalLabel = document.createElement('div');
    totalLabel.textContent = language === 'pl' ? 'Suma niezapłaconych:' : 'Total unpaid:';
    
    const totalValue = document.createElement('div');
    totalValue.id = 'payments-total-value';
    totalValue.textContent = formatCurrency(0);
    
    // Złóż panel
    totalContainer.appendChild(totalLabel);
    totalContainer.appendChild(totalValue);
    summaryPanel.appendChild(totalContainer);
    
    // Dodaj panel po nagłówku, a przed listą płatności
    const paymentsList = document.getElementById('payments-list');
    if (paymentsList) {
        paymentsContainer.insertBefore(summaryPanel, paymentsList);
    } else {
        paymentsContainer.appendChild(summaryPanel);
    }
}

// Wypełnij selektor roku
function populateYearSelector() {
    const yearSelect = document.getElementById('payment-year-select');
    const currentYear = new Date().getFullYear();
    
    // Dodaj opcje od 2020 do bieżącego roku + 5 lat
    for (let year = 2020; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    // Ustaw bieżący rok
    yearSelect.value = currentYear;
}

// Wypełnij selektor pracownika
function populateEmployeeSelector() {
    const employeeSelect = document.getElementById('payment-employee-select');
    if (!employeeSelect) return;
    
    // Wyczyść obecną zawartość, ale zachowaj opcję "Wszyscy pracownicy"
    while (employeeSelect.options.length > 1) {
        employeeSelect.remove(1);
    }
    
    // Dodaj opcję dla każdego pracownika
    appState.employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
}

// Ustaw domyślny zakres dat (bieżący miesiąc)
function setDefaultDateRange() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('payment-start-date').value = formatDate(firstDayOfMonth);
    document.getElementById('payment-end-date').value = formatDate(lastDayOfMonth);
}

// Oblicz płatności dla wybranego okresu
// Oblicz płatności dla wybranego okresu
function calculatePayments() {
    try {
        const startDate = new Date(document.getElementById('payment-start-date').value);
        const endDate = new Date(document.getElementById('payment-end-date').value);
        const selectedYear = parseInt(document.getElementById('payment-year-select').value);
        
        if (isNaN(startDate) || isNaN(endDate)) {
            const language = appState.settings.language;
            alert(language === 'pl' ? 'Proszę wybrać prawidłowy zakres dat.' : 'Please select a valid date range.');
            return;
        }
        
        if (endDate < startDate) {
            const language = appState.settings.language;
            alert(language === 'pl' ? 'Data końcowa nie może być wcześniejsza niż data początkowa.' : 'End date cannot be earlier than start date.');
            return;
        }
        
        // Upewnij się, że panel podsumowania istnieje
        createPaymentsSummaryPanel();
        
        // Zbierz wszystkie płatności w podanym zakresie dat
        const payments = collectPaymentsForDateRange(startDate, endDate);
        
        // Zapisz do stanu
        paymentsState.payments = payments;
        
        // Załaduj zapisane statusy płatności
        loadPaymentStatuses();
        
        // Wyświetl płatności
        renderPaymentsList();
        
        // Oblicz i wyświetl sumę niezapłaconych
        updateUnpaidTotal();
    } catch (error) {
        console.error('Błąd obliczania płatności:', error);
    }
}

// Zbierz płatności dla wszystkich pracowników w podanym zakresie dat
function collectPaymentsForDateRange(startDate, endDate) {
    const payments = [];
    const processedWeeks = new Set(); // Zbiór do śledzenia już przetworzonych tygodni
    const selectedEmployeeId = document.getElementById('payment-employee-select').value;
    
    // Określ, których pracowników uwzględnić
    const employeesToProcess = selectedEmployeeId === 'all' 
        ? appState.employees 
        : appState.employees.filter(emp => emp.id.toString() === selectedEmployeeId);
    
    // Iteruj przez każdy dzień w zakresie dat
    const currDate = new Date(startDate);
    while (currDate <= endDate) {
        // Dla każdego pracownika
        employeesToProcess.forEach(employee => {
            // Znajdź poniedziałek bieżącego tygodnia
            const dayOfWeek = currDate.getDay() || 7; // Konwertuj niedzielę (0) na 7
            const mondayOffset = 1 - dayOfWeek; // Oblicz offset do poniedziałku
            
            const weekStart = new Date(currDate);
            weekStart.setDate(currDate.getDate() + mondayOffset);
            weekStart.setHours(0, 0, 0, 0);
            
            const weekKey = `${employee.id}_${formatDate(weekStart)}`;
            
            // Pomiń, jeśli już przetworzono ten tydzień dla tego pracownika
            if (processedWeeks.has(weekKey)) {
                return;
            }
            
            // Oznacz ten tydzień jako przetworzony
            processedWeeks.add(weekKey);
            
            // Oblicz sumę do wypłaty dla tego pracownika w tym tygodniu
            const paymentDue = calculatePaymentDueForWeek(employee.id, weekStart);
            
            // Jeśli jest coś do zapłaty, dodaj do listy
            if (paymentDue !== 0) {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                payments.push({
                    id: weekKey,
                    employeeId: employee.id,
                    employeeName: employee.name,
                    weekStart: formatDate(weekStart),
                    weekEnd: formatDate(weekEnd),
                    amount: paymentDue,
                    weekRange: `${formatDateForDisplay(weekStart)} - ${formatDateForDisplay(weekEnd)}`
                });
            }
        });
        
        // Przejdź do następnego dnia
        currDate.setDate(currDate.getDate() + 1);
    }
    
    return payments;
}

// Oblicz sumę do wypłaty dla danego pracownika w danym tygodniu
function calculatePaymentDueForWeek(employeeId, weekStart) {
    try {
        const weekStartStr = formatDate(weekStart);
        const weekKey = `${employeeId}_week_${weekStartStr}`;
        
        // Sprawdź, czy mamy zapisaną wartość dla tego tygodnia
        if (appState.schedule[weekKey] && appState.schedule[weekKey].paymentDue !== undefined) {
            return appState.schedule[weekKey].paymentDue;
        }
        
        // Oblicz wartość na podstawie harmonogramu
        let totalRegularValue = 0;
        let totalOvertimeValue = 0;
        let totalHolidayValue = 0;
        let totalBankHolidayValue = 0;
        let customCategory1Value = 0;
        let customCategory2Value = 0;
        
        // Pobierz stawkę pracownika
        const employee = appState.employees.find(emp => emp.id === employeeId);
        if (!employee) return 0;
        
        const rate = employee.rate;
        const payroll = employee.payroll || 0;
        
        // Dla każdego dnia w tygodniu
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = formatDate(date);
            
            const scheduleKey = `${employeeId}_${dateStr}`;
            const daySchedule = appState.schedule[scheduleKey];
            
            if (daySchedule) {
                // Sprawdź typ dnia
                if (daySchedule.type === 'Holiday') {
                    const baseHours = daySchedule.fixedHours || getBaseHoursForEmployee(employeeId, true);
                    totalHolidayValue += baseHours * rate;
                } else if (daySchedule.type === 'Bank Holiday') {
                    const baseHours = daySchedule.fixedHours || getBaseHoursForEmployee(employeeId, true);
                    totalBankHolidayValue += baseHours * rate;
                } else if (daySchedule.start && daySchedule.end) {
                    // Standardowy dzień pracy
                    const hoursStr = calculateHours(daySchedule.start, daySchedule.end);
                    if (hoursStr) {
                        const [hours, minutes] = hoursStr.split(':').map(Number);
                        const decimalHours = hours + (minutes / 60);
                        
                        // Dodaj do standardowych lub nadgodzin
                        const regularHoursLimit = appState.settings.regularHoursLimit;
                        const regularHoursSoFar = totalRegularValue / rate;
                        
                        if (regularHoursSoFar + decimalHours <= regularHoursLimit) {
                            totalRegularValue += decimalHours * rate;
                        } else {
                            const remainingRegularHours = Math.max(0, regularHoursLimit - regularHoursSoFar);
                            const overtimeHours = decimalHours - remainingRegularHours;
                            
                            totalRegularValue += remainingRegularHours * rate;
                            totalOvertimeValue += overtimeHours * rate * appState.settings.overtimeRateMultiplier;
                        }
                    }
                }
            }
        }
        
        // Sprawdź dodatkowe kategorie
        if (appState.schedule[weekKey]) {
            if (appState.schedule[weekKey].category1 && appState.schedule[weekKey].category1.value) {
                customCategory1Value = appState.schedule[weekKey].category1.value;
            }
            
            if (appState.schedule[weekKey].category2 && appState.schedule[weekKey].category2.value) {
                customCategory2Value = appState.schedule[weekKey].category2.value;
            }
        }
        
        // Oblicz całkowitą wartość
        const totalValue = totalRegularValue + totalOvertimeValue + totalHolidayValue + 
                          totalBankHolidayValue + customCategory1Value + customCategory2Value;
        
        // Odejmij payroll
        const paymentDue = totalValue - payroll;
        
        return paymentDue;
    } catch (error) {
        console.error('Błąd obliczania płatności dla tygodnia:', error);
        return 0;
    }
}

// Wczytaj zapisane statusy płatności
function loadPaymentStatuses() {
    try {
        const savedStatuses = localStorage.getItem('harmonogramApp_paidStatuses');
        if (savedStatuses) {
            paymentsState.paidStatuses = JSON.parse(savedStatuses);
        }
    } catch (error) {
        console.error('Błąd wczytywania statusów płatności:', error);
        paymentsState.paidStatuses = {};
    }
}

// Zapisz statusy płatności
function savePaymentStatuses() {
    try {
        localStorage.setItem('harmonogramApp_paidStatuses', JSON.stringify(paymentsState.paidStatuses));
    } catch (error) {
        console.error('Błąd zapisywania statusów płatności:', error);
    }
}

// Przełącz status płatności
function togglePaymentStatus(paymentId) {
    paymentsState.paidStatuses[paymentId] = !paymentsState.paidStatuses[paymentId];
    savePaymentStatuses();
    renderPaymentsList();
    updateUnpaidTotal();
}

// Wyświetl listę płatności
function renderPaymentsList() {
    const listContainer = document.getElementById('payments-list');
    listContainer.innerHTML = '';
    
    const language = appState.settings.language;
    
    // Nagłówek listy
    const headerRow = document.createElement('div');
    headerRow.className = 'payment-header-row';
    headerRow.innerHTML = `
        <div class="payment-col employee-col">${language === 'pl' ? 'Pracownik' : 'Employee'}</div>
        <div class="payment-col week-col">${language === 'pl' ? 'Tydzień' : 'Week'}</div>
        <div class="payment-col amount-col">${language === 'pl' ? 'Kwota' : 'Amount'}</div>
        <div class="payment-col status-col">${language === 'pl' ? 'Status' : 'Status'}</div>
    `;
    listContainer.appendChild(headerRow);
    
    // Sortuj płatności według pracownika i daty
    const sortedPayments = [...paymentsState.payments].sort((a, b) => {
        if (a.employeeName !== b.employeeName) {
            return a.employeeName.localeCompare(b.employeeName);
        }
        return a.weekStart.localeCompare(b.weekStart);
    });
    
    // Twórz wiersze dla każdej płatności
    sortedPayments.forEach(payment => {
        const isPaid = paymentsState.paidStatuses[payment.id] || false;
        
        const row = document.createElement('div');
        row.className = `payment-row ${isPaid ? 'paid' : ''}`;
        row.innerHTML = `
            <div class="payment-col employee-col">${payment.employeeName}</div>
            <div class="payment-col week-col">${payment.weekRange}</div>
            <div class="payment-col amount-col ${payment.amount < 0 ? 'negative' : ''}">${formatCurrency(payment.amount)}</div>
            <div class="payment-col status-col">
                <label class="payment-status-label">
                    <input type="checkbox" class="payment-status-checkbox" data-payment-id="${payment.id}" ${isPaid ? 'checked' : ''}>
                    <span class="payment-status-text">${isPaid ? (language === 'pl' ? 'Zapłacone' : 'Paid') : (language === 'pl' ? 'Niezapłacone' : 'Unpaid')}</span>
                </label>
            </div>
        `;
        listContainer.appendChild(row);
    });
    
    // Dodaj obsługę zdarzeń dla checkboxów
    document.querySelectorAll('.payment-status-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const paymentId = this.getAttribute('data-payment-id');
            togglePaymentStatus(paymentId);
        });
    });
    
    // Jeśli nie ma płatności, pokaż informację
    if (sortedPayments.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'payments-empty-message';
        emptyMessage.textContent = language === 'pl' ? 'Brak płatności w wybranym okresie.' : 'No payments in the selected period.';
        listContainer.appendChild(emptyMessage);
    }
}

// Aktualizuj sumę niezapłaconych
function updateUnpaidTotal() {
    let unpaidTotal = 0;
    
    paymentsState.payments.forEach(payment => {
        if (!paymentsState.paidStatuses[payment.id]) {
            unpaidTotal += payment.amount;
        }
    });
    
    // Zapisz do stanu
    paymentsState.unpaidTotal = unpaidTotal;
    
    // Aktualizuj wyświetlanie
    const totalElement = document.getElementById('payments-total-value');
    if (totalElement) {
        totalElement.textContent = formatCurrency(unpaidTotal);
        totalElement.className = unpaidTotal < 0 ? 'negative' : '';
    }
}

// Aktualizacja tłumaczeń dla zakładki płatności
function updatePaymentsTranslations() {
    const language = appState.settings.language;
    
    // Zaktualizuj etykietę "Wszyscy pracownicy"
    const employeeSelect = document.getElementById('payment-employee-select');
    if (employeeSelect && employeeSelect.options[0]) {
        employeeSelect.options[0].textContent = language === 'pl' ? 'Wszyscy pracownicy' : 'All employees';
    }
    
    // Zaktualizuj przycisk "Oblicz płatności"
    const calculateButton = document.getElementById('calculate-payments');
    if (calculateButton) {
        calculateButton.textContent = language === 'pl' ? 'Oblicz płatności' : 'Calculate payments';
    }
}