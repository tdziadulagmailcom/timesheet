// Firebase interface for the application

// Firebase config - zastąp wartościami z Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let db;
let app;
let initialized = false;

// Initialize Firebase connection
async function initFirebase() {
    console.log('Inicjalizacja połączenia Firebase...');
    try {
        // Dynamiczne importowanie Firebase - będzie działać tylko po wdrożeniu
        // Lokalnie możesz potrzebować dodać skrypty Firebase do index.html
        if (typeof firebase === 'undefined') {
            console.log('Firebase nie jest dostępny, ładowanie przy użyciu importu dynamicznego');
            try {
                const firebaseApp = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
                const firebaseFirestore = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

                window.firebase = {
                    initializeApp: firebaseApp.initializeApp,
                    firestore: firebaseFirestore.getFirestore,
                    collection: firebaseFirestore.collection,
                    doc: firebaseFirestore.doc,
                    getDoc: firebaseFirestore.getDoc,
                    getDocs: firebaseFirestore.getDocs,
                    setDoc: firebaseFirestore.setDoc,
                    updateDoc: firebaseFirestore.updateDoc,
                    deleteDoc: firebaseFirestore.deleteDoc,
                    query: firebaseFirestore.query,
                    where: firebaseFirestore.where
                };
            } catch (importError) {
                console.error('Błąd podczas importowania Firebase:', importError);
                return false;
            }
        }

        // Inicjalizacja Firebase
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();

        // Test połączenia przez próbę odczytu ustawień
        try {
            const settingsDoc = await firebase.getDoc(firebase.doc(db, 'settings', 'app_settings'));
            console.log('Połączenie z Firebase nawiązane pomyślnie');
            initialized = true;
            return true;
        } catch (error) {
            console.warn('Nie znaleziono ustawień w Firebase, ale połączenie działa');
            initialized = true;
            return true;
        }
    } catch (error) {
        console.error('Błąd połączenia z Firebase:', error);
        alert('Nie udało się połączyć z bazą danych Firebase. Używanie localStorage jako zapasowego rozwiązania.');
        return false;
    }
}

// CRUD operations for employees
const employeesDB = {
    async getAll() {
        if (!initialized) return [];

        try {
            const employeesSnapshot = await firebase.getDocs(firebase.collection(db, 'employees'));
            const employees = [];

            employeesSnapshot.forEach(doc => {
                employees.push(doc.data());
            });

            return employees;
        } catch (error) {
            console.error('Błąd podczas pobierania pracowników:', error);
            throw error;
        }
    },

    async getById(id) {
        if (!initialized) return null;

        try {
            const employeeDoc = await firebase.getDoc(firebase.doc(db, 'employees', id.toString()));

            if (employeeDoc.exists()) {
                return employeeDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Błąd podczas pobierania pracownika o ID ${id}:`, error);
            throw error;
        }
    },

    async save(employees) {
        if (!initialized) return false;

        try {
            // Batch zapis
            const batch = db.batch();

            employees.forEach(employee => {
                const empRef = firebase.doc(db, 'employees', employee.id.toString());
                batch.set(empRef, employee);
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Błąd podczas zapisywania pracowników:', error);
            throw error;
        }
    },

    async update(id, employee) {
        if (!initialized) return false;

        try {
            await firebase.updateDoc(firebase.doc(db, 'employees', id.toString()), employee);
            return true;
        } catch (error) {
            console.error(`Błąd podczas aktualizacji pracownika o ID ${id}:`, error);
            throw error;
        }
    },

    async delete(id) {
        if (!initialized) return false;

        try {
            await firebase.deleteDoc(firebase.doc(db, 'employees', id.toString()));
            return true;
        } catch (error) {
            console.error(`Błąd podczas usuwania pracownika o ID ${id}:`, error);
            throw error;
        }
    }
};

// CRUD operations for schedule
const scheduleDB = {
    async getAll() {
        if (!initialized) return {};

        try {
            const scheduleSnapshot = await firebase.getDocs(firebase.collection(db, 'schedule'));
            const schedule = {};

            scheduleSnapshot.forEach(doc => {
                schedule[doc.id] = doc.data();
            });

            return schedule;
        } catch (error) {
            console.error('Błąd podczas pobierania harmonogramu:', error);
            throw error;
        }
    },

    async save(scheduleData) {
        if (!initialized) return false;

        try {
            // Zapisujemy każdy wpis harmonogramu oddzielnie
            // Firebase ma limit 500 operacji na batch, więc rozbijamy na mniejsze partie
            const entries = Object.entries(scheduleData);
            const batchSize = 450; // Mniej niż limit, dla bezpieczeństwa

            for (let i = 0; i < entries.length; i += batchSize) {
                const batch = db.batch();
                const batchEntries = entries.slice(i, i + batchSize);

                batchEntries.forEach(([key, value]) => {
                    const docRef = firebase.doc(db, 'schedule', key);
                    batch.set(docRef, value);
                });

                await batch.commit();
            }

            return true;
        } catch (error) {
            console.error('Błąd podczas zapisywania harmonogramu:', error);
            throw error;
        }
    }
};

// CRUD operations for settings
const settingsDB = {
    async get() {
        if (!initialized) return null;

        try {
            const settingsDoc = await firebase.getDoc(firebase.doc(db, 'settings', 'app_settings'));

            if (settingsDoc.exists()) {
                return settingsDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Błąd podczas pobierania ustawień:', error);
            throw error;
        }
    },

    async save(settings) {
        if (!initialized) return false;

        try {
            await firebase.setDoc(firebase.doc(db, 'settings', 'app_settings'), settings);
            return true;
        } catch (error) {
            console.error('Błąd podczas zapisywania ustawień:', error);
            throw error;
        }
    }
};

// CRUD operations for bank holidays
const bankHolidaysDB = {
    async getAll() {
        if (!initialized) return [];

        try {
            const holidaysSnapshot = await firebase.getDocs(firebase.collection(db, 'bankHolidays'));
            const holidays = [];

            holidaysSnapshot.forEach(doc => {
                holidays.push(doc.data());
            });

            return holidays;
        } catch (error) {
            console.error('Błąd podczas pobierania dni świątecznych:', error);
            throw error;
        }
    },

    async save(holidays) {
        if (!initialized) return false;

        try {
            const batch = db.batch();

            // Najpierw usuń wszystkie istniejące dni świąteczne
            const existingHolidays = await firebase.getDocs(firebase.collection(db, 'bankHolidays'));
            existingHolidays.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Dodaj nowe dni świąteczne
            holidays.forEach(holiday => {
                const holidayRef = firebase.doc(db, 'bankHolidays', holiday.id.toString());
                batch.set(holidayRef, holiday);
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Błąd podczas zapisywania dni świątecznych:', error);
            throw error;
        }
    }
};

// CRUD operations for payments
const paymentsDB = {
    async getStatuses() {
        if (!initialized) return {};

        try {
            const statusesDoc = await firebase.getDoc(firebase.doc(db, 'payments', 'statuses'));

            if (statusesDoc.exists()) {
                return statusesDoc.data();
            } else {
                return {};
            }
        } catch (error) {
            console.error('Błąd podczas pobierania statusów płatności:', error);
            throw error;
        }
    },

    async saveStatuses(statuses) {
        if (!initialized) return false;

        try {
            await firebase.setDoc(firebase.doc(db, 'payments', 'statuses'), statuses);
            return true;
        } catch (error) {
            console.error('Błąd podczas zapisywania statusów płatności:', error);
            throw error;
        }
    }
};

// Używaj localStorage jako zapasowego rozwiązania, jeśli Firebase nie jest dostępne
let useDatabase = false;

// Export database interface
const databaseInterface = {
    init: async function () {
        useDatabase = await initFirebase();
        return useDatabase;
    },
    useDatabase: () => useDatabase,
    employees: employeesDB,
    schedule: scheduleDB,
    settings: settingsDB,
    bankHolidays: bankHolidaysDB,
    payments: paymentsDB
};