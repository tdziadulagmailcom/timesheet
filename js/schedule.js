// Schedule-related functions

// Update the schedule UI based on current state
function updateScheduleUI() {
    console.log('Updating schedule UI...');
    try {
        // Ładowanie zapisanych kategorii dla bieżącego tygodnia
        const weekStart = formatDate(appState.currentWeekStart);
        const weekKey = `${appState.currentEmployeeId}_week_${weekStart}`;
        const weekData = appState.schedule[weekKey];

        if (weekData) {
            // Ustawienie zapisanych wartości w formularzach
            if (weekData.category1) {
                document.getElementById('custom-category-1').value = weekData.category1.name || '';
                document.getElementById('custom-category-value-1').value = weekData.category1.value || 0;
            }

            if (weekData.category2) {
                document.getElementById('custom-category-2').value = weekData.category2.name || '';
                document.getElementById('custom-category-value-2').value = weekData.category2.value || 0;
            }
        } else {
            // Wyzeruj pola jeśli nie ma zapisanych danych
            document.getElementById('custom-category-1').value = '';
            document.getElementById('custom-category-value-1').value = 0;
            document.getElementById('custom-category-2').value = '';
            document.getElementById('custom-category-value-2').value = 0;
        }
    } catch (error) {
        console.error('Błąd ładowania dodatkowych kategorii:', error);
    }

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
            const daySchedule = appState.schedule[scheduleKey] || { start: '', end: '', type: '' };

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
                <td>
                    <select class="type-select" data-day="${i}">
                        <option value="" ${!daySchedule.type ? 'selected' : ''}></option>
                        <option value="Holiday" ${daySchedule.type === 'Holiday' ? 'selected' : ''}>Holiday</option>
                        <option value="Bank Holiday" ${daySchedule.type === 'Bank Holiday' ? 'selected' : ''}>Bank Holiday</option>
                        <option value="Sick" ${daySchedule.type === 'Sick' ? 'selected' : ''}>Sick</option>
                        <option value="Off" ${daySchedule.type === 'Off' ? 'selected' : ''}>Off</option>
                        <option value="Home" ${daySchedule.type === 'Home' ? 'selected' : ''}>Home</option>
                    </select>
                </td>
                <td><input type="time" class="start-time" data-day="${i}" value="${daySchedule.start}" step="900"></td>
                <td><input type="time" class="end-time" data-day="${i}" value="${daySchedule.end}" step="900"></td>
                <td class="hours-cell" data-day="${i}">${formattedHours}</td>
            `;

            tableBody.appendChild(row);
        }

        // Add event listeners to time inputs
        initScheduleInputs();

        // Sprawdź, czy harmonogram jest zablokowany
        const locked = isScheduleLocked();
        console.log('Status blokady harmonogramu:', locked);

        if (locked) {
            // Wyłącz wszystkie pola formularza
            document.querySelectorAll('.start-time, .end-time, .type-select, .custom-category-text, .custom-category-value').forEach(input => {
                input.disabled = true;
            });

            // Wyłącz niestandardowe selektory czasu
            document.querySelectorAll('.custom-time-select').forEach(select => {
                select.classList.add('disabled');
                select.querySelectorAll('select').forEach(s => s.disabled = true);
            });

        } else {
            // Odblokowuj pola formularza
            document.querySelectorAll('.start-time, .end-time, .type-select, .custom-category-text, .custom-category-value').forEach(input => {
                input.disabled = false;
            });

            // Włącz niestandardowe selektory czasu
            document.querySelectorAll('.custom-time-select').forEach(select => {
                select.classList.remove('disabled');
                select.querySelectorAll('select').forEach(s => s.disabled = false);
            });

        }

        // Pokaż lub ukryj przycisk "Odblokuj harmonogram" w zależności od stanu blokady
        const unlockButton = document.getElementById('unlock-schedule');
        if (unlockButton) {
            if (locked) {
                unlockButton.classList.remove('hidden');
            } else {
                unlockButton.classList.add('hidden');
            }
        }

        // Update summary
        updateWeekSummary();

        console.log('Schedule UI updated successfully');
    } catch (error) {
        console.error('Error updating schedule UI:', error);
    }
}

// Funkcja do sprawdzania, czy harmonogram jest zablokowany
function isScheduleLocked() {
    const weekStart = formatDate(appState.currentWeekStart);
    const weekKey = `${appState.currentEmployeeId}_week_${weekStart}`;
    const weekData = appState.schedule[weekKey];

    // Jawnie sprawdź, czy flaga locked jest dokładnie równa true
    return weekData && weekData.locked === true;
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
            
            // W funkcji initScheduleInputs, zmodyfikuj część obsługi zdarzeń selektorów:
            const updateTime = () => {
                const newTime = `${hourSelect.value}:${minuteSelect.value}`;
                timeInput.value = newTime;
    
                // Wyślij zdarzenie 'change' z flagą bubbles, aby zapewnić propagację
                const event = new Event('change', { bubbles: true });
                timeInput.dispatchEvent(event);
    
                // Bezpośrednio przelicz i zaktualizuj komórkę godzin
                const startInput = document.querySelector(`.start-time[data-day="${dayIndex}"]`);
                const endInput = document.querySelector(`.end-time[data-day="${dayIndex}"]`);
                const hoursCell = document.querySelector(`.hours-cell[data-day="${dayIndex}"]`);
    
                if (startInput && endInput && startInput.value && endInput.value && hoursCell) {
                    const hours = calculateHours(startInput.value, endInput.value);
                    hoursCell.textContent = formatHoursForDisplay(hours);
        
                    // Bezpośrednio aktualizuj podsumowanie tygodnia
                    updateWeekSummary();
                }
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
        
        // Add event listeners for type dropdowns
        const typeDropdowns = document.querySelectorAll('.type-select');
        typeDropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', updateTypeForDay);
        });
        
        console.log('Time fields initialized successfully');
    } catch (error) {
        console.error('Error initializing time fields:', error);
    }
}

// Modyfikacja funkcji pomocniczej do pobierania godzin bazowych dla pracownika (dziennych)
function getBaseHoursForEmployee(employeeId, isDaily = false) {
    const employee = appState.employees.find(emp => emp.id === Number(employeeId));
    if (!employee) return 0;
    
    if (isDaily) {
        // Jeśli jest wartość w override dla dziennych godzin inna niż 0, użyj jej
        if (employee.targetHoursPerDay && employee.targetHoursPerDay > 0) {
            return employee.targetHoursPerDay;
        }
        
        // W przeciwnym przypadku wylicz z średniej tygodniowej (zakładamy 5 dni roboczych)
        return employee.avgHoursPerWeek ? employee.avgHoursPerWeek / 5 : 0;
    } else {
        // Dla tygodniowych - istniejąca logika
        if (employee.targetHoursPerWeek && employee.targetHoursPerWeek > 0) {
            return employee.targetHoursPerWeek;
        }
        
        return employee.avgHoursPerWeek || 0;
    }
}

// Modyfikacja funkcji updateHoursForDay
function updateHoursForDay(event) {
    console.log('Updating hours for day...');
    
    
    try {
        const dayIndex = event.target.getAttribute('data-day');
        const startInput = document.querySelector(`.start-time[data-day="${dayIndex}"]`);
        const endInput = document.querySelector(`.end-time[data-day="${dayIndex}"]`);
        const hoursCell = document.querySelector(`.hours-cell[data-day="${dayIndex}"]`);
        const typeSelect = document.querySelector(`.type-select[data-day="${dayIndex}"]`);
        
        if (!startInput || !endInput || !hoursCell || !typeSelect) {
            console.error('Could not find elements for updating hours');
            return;
        }
        
        const selectedType = typeSelect.value;

        // Sprawdź, czy harmonogram jest zablokowany
        if (isScheduleLocked()) {
            console.log('Schedule is locked, cannot update hours');
            return;
        }
        

        if (isScheduleLocked()) {
            console.log('Schedule is locked, cannot update type');
            return;
        }
        
        // Jeśli typ to Holiday lub Bank Holiday, użyj wartości dziennych (nie tygodniowych)
        if (selectedType === 'Holiday' || selectedType === 'Bank Holiday') {
            const baseHours = getBaseHoursForEmployee(appState.currentEmployeeId, true);
            // Konwertuj decimalne godziny na format "X hr" lub "X hr Y min"
            const hours = Math.floor(baseHours);
            const minutes = Math.round((baseHours - hours) * 60);
            
            // Formatuj wyświetlanie
            if (minutes === 0) {
                hoursCell.textContent = `${hours} hr`;
            } else {
                hoursCell.textContent = `${hours} hr ${minutes} min`;
            }
        } else {
            // Standardowe obliczanie godzin, gdy typ nie jest Holiday ani Bank Holiday
            const hours = calculateHours(startInput.value, endInput.value);
            hoursCell.textContent = formatHoursForDisplay(hours);
        }
        
        // Update summary
        updateWeekSummary();
        
        console.log('Hours updated successfully');
    } catch (error) {
        console.error('Error updating hours for day:', error);
    }
}

// Modyfikacja funkcji calculateTotalHours
function calculateTotalHours() {
    let totalMinutes = 0;
    
    for (let i = 0; i < 7; i++) {
        const startInput = document.querySelector(`.start-time[data-day="${i}"]`);
        const endInput = document.querySelector(`.end-time[data-day="${i}"]`);
        const typeSelect = document.querySelector(`.type-select[data-day="${i}"]`);
        
        const selectedType = typeSelect ? typeSelect.value : '';
        
        // Dla typów Holiday/Bank Holiday nie dodajemy godzin
        if (selectedType === 'Holiday' || selectedType === 'Bank Holiday') {
            // Traktujemy jako 0 godzin - nie dodajemy nic do totalMinutes
        } else if (startInput && endInput && startInput.value && endInput.value) {
            // Standardowe wyliczanie
            const hours = calculateHours(startInput.value, endInput.value);
            if (hours) {
                const [h, m] = hours.split(':').map(Number);
                totalMinutes += h * 60 + m;
            }
        }
    }
    
    return totalMinutes;
}

// Funkcja do liczenia dni z określonym typem w bieżącym tygodniu
function countDaysWithType(type) {
    let count = 0;
    
    for (let i = 0; i < 7; i++) {
        const typeSelect = document.querySelector(`.type-select[data-day="${i}"]`);
        if (typeSelect && typeSelect.value === type) {
            count++;
        }
    }
    
    return count;
}

// Modyfikacja funkcji updateWeekSummary w js/schedule.js
function updateWeekSummary() {
    try {
        const totalMinutes = calculateTotalHours();
        const regularHoursLimit = appState.settings.regularHoursLimit * 60;
        
        const regularMinutes = Math.min(totalMinutes, regularHoursLimit);
        const overtimeMinutes = Math.max(0, totalMinutes - regularHoursLimit);
        
        // Funkcja pomocnicza do formatowania
        const formatHoursFromMinutes = (minutes) => {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
        };
        
        // Oblicz wartości dla Holiday i Bank Holiday
        let holidayDays = 0;
        let bankHolidayDays = 0;
        let holidayHoursTotal = 0;
        let bankHolidayHoursTotal = 0;
        
        // Sprawdź, czy dla bieżącego tygodnia mamy zapisane wartości stawki i payroll
        const weekStart = formatDate(appState.currentWeekStart);
        const weekKey = `${appState.currentEmployeeId}_week_${weekStart}`;
        const weekData = appState.schedule[weekKey];
        
        // Pobierz informację o pracowniku
        const employee = appState.employees.find(emp => emp.id === Number(appState.currentEmployeeId));
        
        // Użyj zapisanej stawki i payroll, jeśli harmonogram jest zablokowany, w przeciwnym razie użyj aktualnych
        let rate = employee ? employee.rate : 0;
        let payroll = employee ? (employee.payroll || 0) : 0;
        
        if (weekData && weekData.locked) {
            rate = weekData.savedRate || rate;
            payroll = weekData.savedPayroll || payroll;
        }

        // Przeszukaj harmonogram dla bieżącego tygodnia
        for (let i = 0; i < 7; i++) {
            const date = getDateForDay(i);
            const dateString = formatDate(date);
            const scheduleKey = `${appState.currentEmployeeId}_${dateString}`;
            
            if (appState.schedule[scheduleKey]) {
                // Sprawdź, czy mamy zapisaną stawkę dla tego dnia i czy jest zablokowany
                if (appState.schedule[scheduleKey].locked && appState.schedule[scheduleKey].savedRate) {
                    // Użyj zapisanej stawki dla tego konkretnego dnia
                    rate = appState.schedule[scheduleKey].savedRate;
                }
                
                if (appState.schedule[scheduleKey].type) {
                    if (appState.schedule[scheduleKey].type === 'Holiday') {
                        holidayDays++;
                        if (appState.schedule[scheduleKey].fixedHours) {
                            holidayHoursTotal += appState.schedule[scheduleKey].fixedHours;
                        } else {
                            // Jeśli nie ma zapisanej wartości fixedHours, obliczamy ją i zapisujemy
                            const baseHours = getBaseHoursForEmployee(appState.currentEmployeeId, true);
                            appState.schedule[scheduleKey].fixedHours = baseHours;
                            holidayHoursTotal += baseHours;
                            saveAppData(); // Zapisz zmiany
                        }
                    } else if (appState.schedule[scheduleKey].type === 'Bank Holiday') {
                        bankHolidayDays++;
                        if (appState.schedule[scheduleKey].fixedHours) {
                            bankHolidayHoursTotal += appState.schedule[scheduleKey].fixedHours;
                        } else {
                            // Jeśli nie ma zapisanej wartości fixedHours, obliczamy ją i zapisujemy
                            const baseHours = getBaseHoursForEmployee(appState.currentEmployeeId, true);
                            appState.schedule[scheduleKey].fixedHours = baseHours;
                            bankHolidayHoursTotal += baseHours;
                            saveAppData(); // Zapisz zmiany
                        }
                    }
                }
            }
        }
        
        // Reszta funkcji bez zmian...
        const holidayValue = holidayHoursTotal * rate;
        const bankHolidayValue = bankHolidayHoursTotal * rate;
        const regularValue = (regularMinutes / 60) * rate;
        const overtimeValue = (overtimeMinutes / 60) * rate * appState.settings.overtimeRateMultiplier;
        
        // Pobierz wartości dodatkowych kategorii
        const category1Value = parseFloat(document.getElementById('custom-category-value-1').value) || 0;
        const category2Value = parseFloat(document.getElementById('custom-category-value-2').value) || 0;
        
        // Oblicz wartość całkowitą
        const totalValue = regularValue + overtimeValue + holidayValue + bankHolidayValue + 
                        category1Value + category2Value;
        const paymentDueValue = totalValue - payroll;
        
        // Aktualizuj UI
        document.getElementById('regular-hours').textContent = formatHoursFromMinutes(regularMinutes);
        document.getElementById('overtime-hours').textContent = formatHoursFromMinutes(overtimeMinutes);
        document.getElementById('holiday-days').textContent = holidayDays;
        document.getElementById('bank-holiday-days').textContent = bankHolidayDays;
        document.getElementById('holiday-value').textContent = formatCurrency(holidayValue);
        document.getElementById('bank-holiday-value').textContent = formatCurrency(bankHolidayValue);
        document.getElementById('total-hours').textContent = formatHoursFromMinutes(totalMinutes);
        document.getElementById('regular-value').textContent = formatCurrency(regularValue);
        document.getElementById('overtime-value').textContent = formatCurrency(overtimeValue);
        document.getElementById('total-value').textContent = formatCurrency(totalValue);
        document.getElementById('payroll-value').textContent = formatCurrency(payroll);
        document.getElementById('payment-due-value').textContent = formatCurrency(paymentDueValue);
        
        // Zarządzanie klasami dla wartości ujemnych
        document.getElementById('total-value').classList.toggle('negative', totalValue < 0);
        document.getElementById('payment-due-value').classList.toggle('negative', paymentDueValue < 0);
        document.getElementById('regular-value').classList.toggle('negative', regularValue < 0);
        document.getElementById('overtime-value').classList.toggle('negative', overtimeValue < 0);
    } catch (error) {
        console.error('Error updating week summary:', error);
    }
}

// Funkcja do odblokowywania harmonogramu
function unlockSchedule() {
    const language = appState.settings.language;
    
    // Sprawdź, czy hasło do resetowania jest ustawione
    if (!appState.settings.resetPassword) {
        alert(language === 'pl' ? 'Hasło do resetowania nie zostało ustawione w opcjach.' : 'Reset password is not set in options.');
        return;
    }
    
    // Poproś o hasło
    const enteredPassword = prompt(translations[language]['enter-reset-password']);
    
    // Sprawdź, czy hasło jest poprawne
    if (enteredPassword !== appState.settings.resetPassword) {
        alert(translations[language]['invalid-reset-password']);
        return;
    }
    
    // Potwierdź odblokowanie
    if (!confirm(language === 'pl' ? 'Czy na pewno chcesz odblokować ten harmonogram? Aktualne stawki zostaną zastosowane.' : 
                'Are you sure you want to unlock this schedule? Current rates will be applied.')) {
        return;
    }
    
    // Odblokuj harmonogram na bieżący tydzień
    const weekStart = formatDate(appState.currentWeekStart);
    const weekKey = `${appState.currentEmployeeId}_week_${weekStart}`;
    
    if (appState.schedule[weekKey]) {
        appState.schedule[weekKey].locked = false;
    }
    
    // Odblokuj każdy dzień w tygodniu
    for (let i = 0; i < 7; i++) {
        const date = getDateForDay(i);
        const dateString = formatDate(date);
        const scheduleKey = `${appState.currentEmployeeId}_${dateString}`;
        
        if (appState.schedule[scheduleKey]) {
            appState.schedule[scheduleKey].locked = false;
        }
    }

    // Po odblokowaniu, włącz pola formularza
    document.querySelectorAll('.start-time, .end-time, .type-select, .custom-category-text, .custom-category-value').forEach(input => {
        input.disabled = false;
    });
    
    // Włącz niestandardowe selektory czasu
    document.querySelectorAll('.custom-time-select').forEach(select => {
        select.classList.remove('disabled');
        select.querySelectorAll('select').forEach(s => s.disabled = false);
    });
    
    // Zapisz zmiany
    saveAppData();
    
    // Aktualizuj UI
    updateScheduleUI();
    
    // Pokaż potwierdzenie
    alert(language === 'pl' ? 'Harmonogram został odblokowany.' : 'Schedule has been unlocked.');
}
// 2. Add event listeners for the custom category value fields

function initCustomCategoryFields() {
    const customValueInputs = document.querySelectorAll('.custom-category-value');
    customValueInputs.forEach(input => {
        input.addEventListener('input', updateWeekSummary);
    });
    
    // Add class for negative values
    document.querySelectorAll('.custom-category-value').forEach(input => {
        input.addEventListener('input', function() {
            if (parseFloat(this.value) < 0) {
                this.classList.add('negative');
            } else {
                this.classList.remove('negative');
            }
            // Make sure to update the summary
            updateWeekSummary();
        });
    });
}

function saveSchedule() {
    // For each day of the week, save start and end times
    for (let i = 0; i < 7; i++) {
        const date = getDateForDay(i);
        const dateString = formatDate(date);
        const startInput = document.querySelector(`.start-time[data-day="${i}"]`);
        const endInput = document.querySelector(`.end-time[data-day="${i}"]`);
        const typeSelect = document.querySelector(`.type-select[data-day="${i}"]`);
        
        const scheduleKey = `${appState.currentEmployeeId}_${dateString}`;
        
        // Get the selected type value
        const selectedType = typeSelect ? typeSelect.value : '';
        
        // Only save if both start and end times are set or if a type is selected
        if ((startInput && startInput.value && endInput && endInput.value) || selectedType) {
            // Znajdź bieżące dane pracownika
            const employee = appState.employees.find(emp => emp.id === Number(appState.currentEmployeeId));
            
            appState.schedule[scheduleKey] = {
                start: startInput && startInput.value ? startInput.value : '',
                end: endInput && endInput.value ? endInput.value : '',
                type: selectedType,
                // Zapisz stawkę i payroll z momentu utworzenia harmonogramu
                savedRate: employee ? employee.rate : 0,
                savedPayroll: employee ? (employee.payroll || 0) : 0,
                locked: true // Domyślnie zablokowany po zapisaniu
            };
        } else if (appState.schedule[scheduleKey]) {
            // Remove entry if times are cleared and no type is selected
            delete appState.schedule[scheduleKey];
        }
    }
    
    // Zapisz dodatkowe kategorie dla bieżącego tygodnia
    const category1Name = document.getElementById('custom-category-1').value.trim();
    const category1Value = parseFloat(document.getElementById('custom-category-value-1').value) || 0;
    const category2Name = document.getElementById('custom-category-2').value.trim();
    const category2Value = parseFloat(document.getElementById('custom-category-value-2').value) || 0;
    
    // Utwórz klucz dla bieżącego tygodnia i pracownika
    const weekStart = formatDate(appState.currentWeekStart);
    const weekKey = `${appState.currentEmployeeId}_week_${weekStart}`;
    
    // Znajdź bieżące dane pracownika
    const employee = appState.employees.find(emp => emp.id === Number(appState.currentEmployeeId));
    
    // Zapisz kategorie w appState wraz ze stawką i payroll
    appState.schedule[weekKey] = {
        category1: {
            name: category1Name,
            value: category1Value
        },
        category2: {
            name: category2Name,
            value: category2Value
        },
        savedRate: employee ? employee.rate : 0,
        savedPayroll: employee ? (employee.payroll || 0) : 0,
        locked: true // Domyślnie zablokowany po zapisaniu
    };
    
    // Save to localStorage
    saveAppData();
    
    // Aktualizuj średnią godzin dla wszystkich pracowników
    appState.employees.forEach(employee => {
        employee.avgHoursPerWeek = calculateAvgHoursPerWeek(employee.id);
    });
    
    // Odświeżanie listy pracowników
    renderEmployeesList();
    
    // Update calendar
    updateCalendarUI();
    
    // Zamiast bezpośrednio manipulować wskaźnikiem, zaktualizuj cały UI
    updateScheduleUI();

    // Wyłącz pola formularza
    document.querySelectorAll('.start-time, .end-time, .type-select, .custom-category-text, .custom-category-value').forEach(input => {
        input.disabled = true;
    });

    // Wyłącz niestandardowe selektory czasu
    document.querySelectorAll('.custom-time-select').forEach(select => {
        select.classList.add('disabled');
        select.querySelectorAll('select').forEach(s => s.disabled = true);
    });

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
            translations[language]['th-type'],
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
            daySchedule.type || '',
            daySchedule.start,
            daySchedule.end,
            calculateHours(daySchedule.start, daySchedule.end)
        ]);
    }
    
    // Add empty row before summary
    wsData.push(['', '', '', '', '']);
    
    // Policz dni Holiday i Bank Holiday
    const holidayDays = countDaysWithType('Holiday');
    const bankHolidayDays = countDaysWithType('Bank Holiday');

    // Oblicz wartość za dni Holiday i Bank Holiday
    const holidayHoursPerDay = 8; // standardowo 8h za dzień urlopu
    const holidayValue = holidayDays * holidayHoursPerDay * rate;
    const bankHolidayValue = bankHolidayDays * holidayHoursPerDay * rate;

    // Add summary section
    const regularHours = document.getElementById('regular-hours').textContent;
    const overtimeHours = document.getElementById('overtime-hours').textContent;
    const totalHours = document.getElementById('total-hours').textContent;

    const regularValue = document.getElementById('regular-value').textContent;
    const overtimeValue = document.getElementById('overtime-value').textContent;
    const payrollValue = document.getElementById('payroll-value').textContent;
    const paymentDueValue = document.getElementById('payment-due-value').textContent;

    // Get custom category values
    const category1Name = document.getElementById('custom-category-1').value || (language === 'pl' ? 'Dodatkowa kategoria 1' : 'Additional category 1');
    const category2Name = document.getElementById('custom-category-2').value || (language === 'pl' ? 'Dodatkowa kategoria 2' : 'Additional category 2');
    const category1Value = parseFloat(document.getElementById('custom-category-value-1').value) || 0;
    const category2Value = parseFloat(document.getElementById('custom-category-value-2').value) || 0;

    // Format currency for Excel
    const category1Currency = formatCurrency(category1Value);
    const category2Currency = formatCurrency(category2Value);

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
wsData.push([translations[language]['label-holiday-hours'] || 'Holiday', '', holidayDays, '', formatCurrency(holidayValue)]);
wsData.push([translations[language]['label-bank-holiday-hours'] || 'Bank Holiday', '', bankHolidayDays, '', formatCurrency(bankHolidayValue)]);

// Add custom categories
wsData.push([category1Name, '', '-', '', category1Currency]);
wsData.push([category2Name, '', '-', '', category2Currency]);

// Add total row
wsData.push([translations[language]['label-total'], '', totalHours, '', totalValue]);

// Add payroll row
wsData.push([translations[language]['label-payroll'], '', '-', '', payrollValue]);

// Add payment due row
const paymentDueLabel = language === 'pl' ? 'Do wypłaty' : 'Payment due';
wsData.push([paymentDueLabel, '', '-', '', paymentDueValue]);
    
    // Rest of the function...
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

function updateTypeForDay(event) {
    console.log('Updating type for day...');
    
    try {
        const selectedType = event.target.value;
        const dayIndex = event.target.getAttribute('data-day');
        const date = getDateForDay(dayIndex);
        const dateString = formatDate(date);
        const scheduleKey = `${appState.currentEmployeeId}_${dateString}`;
        
        // Znajdź elementy wiersza
        const row = event.target.closest('tr');
        const hoursCell = row.querySelector(`.hours-cell`);
        const startInput = row.querySelector(`.start-time`);
        const endInput = row.querySelector(`.end-time`);
        
        // Znajdź selektory niestandardowe
        const timeSelects = row.querySelectorAll('.custom-time-select');
        
        // Usuń klasę bank-holiday
        row.classList.remove('bank-holiday');
        
        // Przygotuj obiekt harmonogramu
        if (!appState.schedule[scheduleKey]) {
            appState.schedule[scheduleKey] = {};
        }
        
        // Zapisz typ
        appState.schedule[scheduleKey].type = selectedType;
        
        if (selectedType === 'Holiday' || selectedType === 'Bank Holiday') {
            // Dodaj klasę dla Bank Holiday
            if (selectedType === 'Bank Holiday') {
                row.classList.add('bank-holiday');
            }
            
            // Zapisz stałą wartość godzin
            const baseHours = getBaseHoursForEmployee(appState.currentEmployeeId, true);
            appState.schedule[scheduleKey].fixedHours = baseHours;
            
            // Ustaw pola czasu na 00:00
            startInput.value = '00:00';
            endInput.value = '00:00';
            appState.schedule[scheduleKey].start = '00:00';
            appState.schedule[scheduleKey].end = '00:00';
            
            // Aktualizuj selektory niestandardowe
            timeSelects.forEach(select => {
                const hourSelect = select.querySelector('.hour-select');
                const minuteSelect = select.querySelector('.minute-select');
                if (hourSelect) hourSelect.value = '00';
                if (minuteSelect) minuteSelect.value = '00';
            });
            
            // Wyświetl "- -" w komórce godzin
            hoursCell.textContent = "- -";
        } else {
            // Dla innych typów
            if (startInput.value && endInput.value) {
                // Oblicz godziny jak zwykle
                const hours = calculateHours(startInput.value, endInput.value);
                hoursCell.textContent = formatHoursForDisplay(hours);
                
                // Zapisz wartości
                appState.schedule[scheduleKey].start = startInput.value;
                appState.schedule[scheduleKey].end = endInput.value;
                delete appState.schedule[scheduleKey].fixedHours;
            } else {
                hoursCell.textContent = '';
                appState.schedule[scheduleKey].start = '';
                appState.schedule[scheduleKey].end = '';
                delete appState.schedule[scheduleKey].fixedHours;
            }
        }
        
        // Zapisz zmiany do localStorage
        saveAppData();

        // Aktualizuj podsumowanie
        updateWeekSummary();

        // Dodaj wymuszenie natychmiastowej aktualizacji interfejsu
        const holidayDays = countDaysWithType('Holiday');
        const bankHolidayDays = countDaysWithType('Bank Holiday');
        document.getElementById('holiday-days').textContent = holidayDays;
        document.getElementById('bank-holiday-days').textContent = bankHolidayDays;

        // Oblicz i zaktualizuj wartości
        const employee = appState.employees.find(emp => emp.id === Number(appState.currentEmployeeId));
        if (employee) {
            const rate = employee.rate;
            const baseHours = getBaseHoursForEmployee(appState.currentEmployeeId, true);
            const holidayValue = holidayDays * baseHours * rate;
            const bankHolidayValue = bankHolidayDays * baseHours * rate;

            document.getElementById('holiday-value').textContent = formatCurrency(holidayValue);
            document.getElementById('bank-holiday-value').textContent = formatCurrency(bankHolidayValue);
        }
        
    } catch (error) {
        console.error('Error updating type for day:', error);
    }
}

// Update hours display for a specific day when time inputs change
function updateHoursForDay(event) {
    console.log('Updating hours for day...');
}

// Add this function to schedule.js
function resetWeek() {
    console.log('Attempting to reset week schedule...');
    const language = appState.settings.language;
    
    // Check if reset password is set
    if (!appState.settings.resetPassword) {
        alert(language === 'pl' ? 'Hasło do resetowania nie zostało ustawione w opcjach.' : 'Reset password is not set in options.');
        return;
    }
    
    // Ask for password
    const enteredPassword = prompt(translations[language]['enter-reset-password']);
    
    // Check if password is correct
    if (enteredPassword !== appState.settings.resetPassword) {
        alert(translations[language]['invalid-reset-password']);
        return;
    }
    
    // Confirm reset
    if (!confirm(translations[language]['confirm-reset-week'])) {
        return;
    }
    
    // Get current employee ID and week dates
    const employeeId = appState.currentEmployeeId;
    
    // Remove all schedule entries for this employee for this week
    for (let i = 0; i < 7; i++) {
        const date = getDateForDay(i);
        const dateString = formatDate(date);
        const scheduleKey = `${employeeId}_${dateString}`;
        
        // Remove entry if it exists
        if (appState.schedule[scheduleKey]) {
            delete appState.schedule[scheduleKey];
        }
    }
    
    // Save to localStorage
    saveAppData();
    
    // Update UI
    updateScheduleUI();
    updateCalendarUI();
    
    // Show confirmation
    alert(translations[language]['week-reset']);
}