// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const monthSelect = document.getElementById('month-select');
const yearSelect = document.getElementById('year-select');
const scheduleTable = document.getElementById('schedule-table');
const generateScheduleBtn = document.getElementById('generate-schedule');
const saveScheduleBtn = document.getElementById('save-schedule');
const staffTable = document.getElementById('staff-table');
const addStaffBtn = document.getElementById('add-staff');
const saveStaffBtn = document.getElementById('save-staff');
const absencesTable = document.getElementById('absences-table');
const addAbsenceBtn = document.getElementById('add-absence');
const saveAbsenceBtn = document.getElementById('save-absence');
const wishesTable = document.getElementById('wishes-table');
const addWishBtn = document.getElementById('add-wish');
const saveWishBtn = document.getElementById('save-wish');
const uploadWishesBtn = document.getElementById('upload-wishes');
const downloadTemplateBtn = document.getElementById('download-template');
const submitUploadBtn = document.getElementById('submit-upload');
const staffPaletteContainer = document.getElementById('staff-palette-container');
const exportCsvBtn = document.getElementById('export-csv');
const exportExcelBtn = document.getElementById('export-excel');
const exportPdfBtn = document.getElementById('export-pdf');
const importScheduleBtn = document.getElementById('import-schedule');
const submitImportBtn = document.getElementById('submit-import');

// Statistics Elements
const statsMonthSelect = document.getElementById('stats-month-select');
const statsYearSelect = document.getElementById('stats-year-select');
const loadStatisticsBtn = document.getElementById('load-statistics');
const staffStatsTable = document.getElementById('staff-stats-table');
const shiftStatsTable = document.getElementById('shift-stats-table');
const forecastTable = document.getElementById('forecast-table');

// Calendar Elements
const calendarStaffSelect = document.getElementById('calendar-staff-select');
const calendarMonthSelect = document.getElementById('calendar-month-select');
const calendarYearSelect = document.getElementById('calendar-year-select');
const loadCalendarBtn = document.getElementById('load-calendar');
const staffCalendar = document.getElementById('staff-calendar');
const calendarShiftsSummary = document.getElementById('calendar-shifts-summary');
const calendarAbsencesSummary = document.getElementById('calendar-absences-summary');

// Initialize Bootstrap modals
const staffModal = new bootstrap.Modal(document.getElementById('staffModal'));
const absenceModal = new bootstrap.Modal(document.getElementById('absenceModal'));
const wishModal = new bootstrap.Modal(document.getElementById('wishModal'));
const uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));

// API Endpoints - Use window.location to build the base URL
const API_BASE_URL = `${window.location.protocol}//${window.location.host}/api`;
console.log('Using API base URL:', API_BASE_URL);

const ENDPOINTS = {
    debug: `${API_BASE_URL}/debug`,
    shifts: `${API_BASE_URL}/shifts`,
    staff: `${API_BASE_URL}/staff`,
    absences: `${API_BASE_URL}/absences`,
    wishes: `${API_BASE_URL}/wishes`,
    schedule: `${API_BASE_URL}/schedule`,
    generateSchedule: `${API_BASE_URL}/generate-schedule`,
    uploadWishes: `${API_BASE_URL}/upload/wishes`
};

// App State
let currentPage = 'schedule';
let shifts = {};
let staff = [];
let absences = [];
let wishes = [];
let currentSchedule = [];

// Initialize the application
async function init() {
    // Check if all DOM elements exist
    if (!yearSelect || !monthSelect) {
        console.error("Required DOM elements not found!");
        return;
    }

    // First check if API is available
    try {
        console.log("Checking API availability...");
        const debugInfo = await fetchAPI(ENDPOINTS.debug);
        console.log("API debug info:", debugInfo);
        
        if (debugInfo && debugInfo.status === "ok") {
            console.log("API is available, proceeding with initialization");
        } else {
            console.error("API returned unexpected response:", debugInfo);
            alert("API is not responding correctly. Please check the server.");
            return;
        }
    } catch (error) {
        console.error("API is not available:", error);
        alert("Cannot connect to the server API. Please make sure the server is running and accessible.");
        return;
    }

    // Populate year select
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 1; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
    
    // Set current month
    monthSelect.value = new Date().getMonth() + 1;
    
    // Add event listeners
    addEventListeners();
    
    // Load initial data with error handling
    try {
        await loadShifts();
        
        // Load these in parallel
        await Promise.all([
            loadStaff(),
            loadAbsences(),
            loadWishes()
        ]);
        
        await loadSchedule();
        console.log("Application initialized successfully");
    } catch (error) {
        console.error("Error initializing application:", error);
        alert("Error loading application data. Please check the console for more information.");
    }
}

// Event Listeners
function addEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            changePage(page);
        });
    });
    
    // Schedule page
    monthSelect.addEventListener('change', loadSchedule);
    yearSelect.addEventListener('change', loadSchedule);
    generateScheduleBtn.addEventListener('click', generateSchedule);
    saveScheduleBtn.addEventListener('click', saveSchedule);
    exportCsvBtn?.addEventListener('click', () => exportSchedule('csv'));
    exportExcelBtn?.addEventListener('click', () => exportSchedule('excel'));
    exportPdfBtn?.addEventListener('click', () => exportSchedule('pdf'));
    submitImportBtn?.addEventListener('click', importSchedule);
    
    // Staff page
    addStaffBtn.addEventListener('click', () => openStaffModal());
    saveStaffBtn.addEventListener('click', saveStaffMember);
    
    // Absences page
    addAbsenceBtn.addEventListener('click', () => openAbsenceModal());
    saveAbsenceBtn.addEventListener('click', saveAbsence);
    
    // Wishes page
    addWishBtn.addEventListener('click', () => openWishModal());
    saveWishBtn.addEventListener('click', saveWish);
    uploadWishesBtn.addEventListener('click', () => uploadModal.show());
    downloadTemplateBtn.addEventListener('click', downloadWishTemplate);
    submitUploadBtn.addEventListener('click', uploadWishesFile);
}

// Navigation
function changePage(page) {
    currentPage = page;
    
    // Update navigation
    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Show selected page
    pages.forEach(p => {
        if (p.id === `${page}-page`) {
            p.classList.remove('d-none');
        } else {
            p.classList.add('d-none');
        }
    });
}

// API Requests
async function fetchAPI(endpoint, method = 'GET', data = null) {
    console.log(`Fetching ${method} ${endpoint}...`);
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(endpoint, options);
        console.log(`Response from ${endpoint}:`, response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log(`Data from ${endpoint}:`, responseData);
        return responseData;
    } catch (error) {
        console.error(`API request to ${endpoint} failed:`, error);
        // Don't show an alert for every failed request as it can be annoying
        // Just log to console and let the calling function handle errors
        throw error;
    }
}

// Load Shifts
async function loadShifts() {
    try {
        const data = await fetchAPI(ENDPOINTS.shifts);
        if (data) {
            shifts = data;
            updateShiftColumns();
            console.log('Shifts loaded successfully:', shifts);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to load shifts:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

// Load Staff
async function loadStaff() {
    try {
        const data = await fetchAPI(ENDPOINTS.staff);
        if (data) {
            staff = data;
            renderStaffTable();
            updateStaffDropdowns();
            console.log('Staff loaded successfully:', staff);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to load staff:', error);
        throw error;
    }
}

// Load Absences
async function loadAbsences() {
    try {
        const data = await fetchAPI(ENDPOINTS.absences);
        if (data) {
            absences = data;
            renderAbsencesTable();
            console.log('Absences loaded successfully:', absences);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to load absences:', error);
        throw error;
    }
}

// Load Wishes
async function loadWishes() {
    try {
        const data = await fetchAPI(ENDPOINTS.wishes);
        if (data) {
            wishes = data;
            renderWishesTable();
            console.log('Wishes loaded successfully:', wishes);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to load wishes:', error);
        throw error;
    }
}

// Load Schedule
async function loadSchedule() {
    try {
        const month = monthSelect.value;
        const year = yearSelect.value;
        
        console.log(`Loading schedule for ${year}-${month}...`);
        const data = await fetchAPI(`${ENDPOINTS.schedule}?month=${month}&year=${year}`);
        currentSchedule = data || [];
        renderScheduleTable();
        console.log('Schedule loaded successfully:', currentSchedule);
        return true;
    } catch (error) {
        console.error('Failed to load schedule:', error);
        // Don't throw here as this is not critical
        currentSchedule = [];
        renderScheduleTable();
        return false;
    }
}

// Generate Schedule
async function generateSchedule() {
    const month = monthSelect.value;
    const year = yearSelect.value;
    
    if (confirm('Generate a new schedule? This will overwrite any existing schedule for the selected month.')) {
        const result = await fetchAPI(ENDPOINTS.generateSchedule, 'POST', { month, year });
        if (result && result.status === 'success') {
            currentSchedule = result.schedule;
            renderScheduleTable();
            alert('Schedule generated successfully!');
        }
    }
}

// Save Schedule
async function saveSchedule() {
    const month = monthSelect.value;
    const year = yearSelect.value;
    
    // Show loading indicator
    const saveBtn = saveScheduleBtn;
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="loading"></span> Saving...';
    saveBtn.disabled = true;
    
    try {
        // Collect updated schedule data from the table
        const tableRows = scheduleTable.querySelectorAll('tbody tr');
        const updatedSchedule = [];
        
        tableRows.forEach(row => {
            const date = row.getAttribute('data-date');
            const day = parseInt(row.getAttribute('data-day'));
            const weekday = row.getAttribute('data-weekday');
            
            const shiftCells = row.querySelectorAll('[data-shift]');
            const shifts = {};
            
            shiftCells.forEach(cell => {
                const shiftName = cell.getAttribute('data-shift');
                const staffId = cell.getAttribute('data-staff-id') || null;
                const notes = cell.getAttribute('data-notes') || '';
                
                shifts[shiftName] = {
                    assigned: staffId,
                    notes: notes
                };
            });
            
            updatedSchedule.push({
                date,
                day,
                weekday,
                shifts
            });
        });
        
        const result = await fetchAPI(ENDPOINTS.schedule, 'POST', {
            month,
            year,
            schedule: updatedSchedule
        });
        
        if (result && result.status === 'success') {
            saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Saved!';
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }, 1500);
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        console.error('Error saving schedule:', error);
        saveBtn.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Error';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }, 1500);
        alert('Error saving schedule. Please try again.');
    }
}

// Initialize drag-and-drop functionality
function initDragAndDrop() {
    // Create staff palette items
    staffPaletteContainer.innerHTML = '';
    
    staff.forEach(staffMember => {
        const staffItem = document.createElement('div');
        staffItem.classList.add('shift-cell');
        
        // Determine staff role color
        let roleColor = '';
        switch (staffMember.role) {
            case 'doctor':
                roleColor = 'bg-info bg-opacity-25';
                break;
            case 'nurse':
                roleColor = 'bg-success bg-opacity-25';
                break;
            case 'resident':
                roleColor = 'bg-warning bg-opacity-25';
                break;
            case 'consultant':
                roleColor = 'bg-primary bg-opacity-25';
                break;
            default:
                roleColor = 'bg-secondary bg-opacity-25';
        }
        
        staffItem.classList.add(roleColor);
        staffItem.textContent = staffMember.name;
        staffItem.setAttribute('draggable', 'true');
        staffItem.setAttribute('data-staff-id', staffMember.id);
        
        // Add capabilities as tooltip
        if (staffMember.capabilities && staffMember.capabilities.length > 0) {
            const tooltipContainer = document.createElement('div');
            tooltipContainer.classList.add('tooltip-container');
            
            const tooltipText = document.createElement('span');
            tooltipText.classList.add('tooltip-text');
            tooltipText.innerHTML = `<strong>Capabilities:</strong><br>${staffMember.capabilities.join('<br>')}`;
            
            tooltipContainer.appendChild(staffItem);
            tooltipContainer.appendChild(tooltipText);
            staffPaletteContainer.appendChild(tooltipContainer);
        } else {
            staffPaletteContainer.appendChild(staffItem);
        }
        
        // Add drag event listeners
        staffItem.addEventListener('dragstart', handleDragStart);
        staffItem.addEventListener('dragend', handleDragEnd);
    });
    
    // Add event listeners to shift cells
    const shiftContainers = document.querySelectorAll('.shift-cell-container');
    shiftContainers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    });
}

// Drag and drop event handlers
function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.getAttribute('data-staff-id'));
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    return false;
}

function handleDragEnter(e) {
    this.classList.add('dragover');
}

function handleDragLeave(e) {
    this.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    
    const staffId = e.dataTransfer.getData('text/plain');
    const shiftCell = this;
    const shiftName = shiftCell.getAttribute('data-shift');
    const row = shiftCell.closest('tr');
    const date = row.getAttribute('data-date');
    const weekday = row.getAttribute('data-weekday');
    
    // Check if staff has capability for this shift
    const staffMember = staff.find(s => s.id === staffId);
    if (staffMember && staffMember.capabilities && !staffMember.capabilities.includes(shiftName)) {
        alert(`${staffMember.name} does not have capability for ${shiftName} shifts.`);
        return;
    }
    
    // Check if ICU_midday on weekend
    if (shiftName === 'ICU_midday' && (weekday === 'Saturday' || weekday === 'Sunday')) {
        alert('ICU Midday shifts are not scheduled on weekends.');
        return;
    }
    
    // Set the shift assignment
    updateShiftAssignment(shiftCell, staffId, 'Assigned via drag & drop');
    
    return false;
}

// Update shift assignment in the UI
function updateShiftAssignment(shiftCell, staffId, notes = '') {
    // Remove any existing assignment
    const existingAssignment = shiftCell.querySelector('.staff-assignment');
    if (existingAssignment) {
        shiftCell.removeChild(existingAssignment);
    }
    
    // Create new assignment if staffId is provided
    if (staffId) {
        const staffMember = staff.find(s => s.id === staffId);
        if (!staffMember) return;
        
        const assignmentDiv = document.createElement('div');
        assignmentDiv.classList.add('staff-assignment');
        
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('staff-assignment-name');
        nameSpan.textContent = staffMember.name;
        
        const removeBtn = document.createElement('span');
        removeBtn.classList.add('staff-assignment-remove');
        removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            shiftCell.setAttribute('data-staff-id', '');
            shiftCell.setAttribute('data-notes', '');
            shiftCell.removeChild(assignmentDiv);
        });
        
        assignmentDiv.appendChild(nameSpan);
        assignmentDiv.appendChild(removeBtn);
        shiftCell.appendChild(assignmentDiv);
    }
    
    // Update data attributes
    shiftCell.setAttribute('data-staff-id', staffId || '');
    shiftCell.setAttribute('data-notes', notes || '');
    
    // Check if this is a wish
    const date = shiftCell.closest('tr').getAttribute('data-date');
    const shiftName = shiftCell.getAttribute('data-shift');
    
    const isWishGranted = wishes.some(w => 
        w.staff_id === staffId && 
        w.date === date && 
        w.shift === shiftName
    );
    
    if (isWishGranted) {
        shiftCell.classList.add('wish-granted');
    } else {
        shiftCell.classList.remove('wish-granted');
    }
}

// Staff Management
function openStaffModal(staffId = null) {
    const staffIdInput = document.getElementById('staff-id');
    const staffNameInput = document.getElementById('staff-name');
    const staffRoleSelect = document.getElementById('staff-role');
    const staffContactInput = document.getElementById('staff-contact');
    const staffRequiredShiftsInput = document.getElementById('staff-required-shifts');
    
    // Reset form
    document.getElementById('staff-form').reset();
    
    // Initialize capabilities checkboxes
    loadShifts().then(() => {
        updateStaffCapabilitiesCheckboxes([]);
    });
    
    if (staffId) {
        // Edit existing staff
        const staffMember = staff.find(s => s.id === staffId);
        if (staffMember) {
            staffIdInput.value = staffMember.id;
            staffNameInput.value = staffMember.name;
            staffRoleSelect.value = staffMember.role;
            staffContactInput.value = staffMember.contact || '';
            staffRequiredShiftsInput.value = staffMember.required_shifts || 0;
            
            // Set capabilities checkboxes
            updateStaffCapabilitiesCheckboxes(staffMember.capabilities || []);
        }
    } else {
        // Add new staff
        staffIdInput.value = '';
        staffRequiredShiftsInput.value = 0;
    }
    
    staffModal.show();
}

async function saveStaffMember() {
    const staffId = document.getElementById('staff-id').value;
    const name = document.getElementById('staff-name').value;
    const role = document.getElementById('staff-role').value;
    const contact = document.getElementById('staff-contact').value;
    const required_shifts = parseInt(document.getElementById('staff-required-shifts').value) || 0;
    const capabilities = getSelectedCapabilities();
    
    if (!name) {
        alert('Name is required!');
        return;
    }
    
    let updatedStaff = [...staff];
    
    if (staffId) {
        // Update existing staff
        updatedStaff = updatedStaff.map(s => 
            s.id === staffId ? { ...s, name, role, contact, capabilities, required_shifts } : s
        );
    } else {
        // Add new staff
        const newId = crypto.randomUUID();
        updatedStaff.push({ id: newId, name, role, contact, capabilities, required_shifts });
    }
    
    const result = await fetchAPI(ENDPOINTS.staff, 'POST', updatedStaff);
    if (result && result.status === 'success') {
        staff = updatedStaff;
        renderStaffTable();
        updateStaffDropdowns();
        staffModal.hide();
    }
}

function deleteStaffMember(staffId) {
    if (confirm('Are you sure you want to delete this staff member?')) {
        const updatedStaff = staff.filter(s => s.id !== staffId);
        
        fetchAPI(ENDPOINTS.staff, 'POST', updatedStaff).then(result => {
            if (result && result.status === 'success') {
                staff = updatedStaff;
                renderStaffTable();
                updateStaffDropdowns();
            }
        });
    }
}

// Absences Management
function openAbsenceModal(absenceId = null) {
    const absenceIdInput = document.getElementById('absence-id');
    const absenceStaffSelect = document.getElementById('absence-staff');
    const absenceTypeSelect = document.getElementById('absence-type');
    const absenceStartInput = document.getElementById('absence-start');
    const absenceEndInput = document.getElementById('absence-end');
    const absenceStatusSelect = document.getElementById('absence-status');
    
    // Reset form
    document.getElementById('absence-form').reset();
    
    // Populate staff dropdown
    absenceStaffSelect.innerHTML = '';
    staff.forEach(staffMember => {
        const option = document.createElement('option');
        option.value = staffMember.id;
        option.textContent = staffMember.name;
        absenceStaffSelect.appendChild(option);
    });
    
    if (absenceId) {
        // Edit existing absence
        const absence = absences.find(a => a.id === absenceId);
        if (absence) {
            absenceIdInput.value = absence.id;
            absenceStaffSelect.value = absence.staff_id;
            absenceTypeSelect.value = absence.type;
            absenceStartInput.value = absence.start_date;
            absenceEndInput.value = absence.end_date;
            absenceStatusSelect.value = absence.status;
        }
    } else {
        // Add new absence
        absenceIdInput.value = '';
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        absenceStartInput.value = today;
        absenceEndInput.value = today;
    }
    
    absenceModal.show();
}

async function saveAbsence() {
    const absenceId = document.getElementById('absence-id').value;
    const staff_id = document.getElementById('absence-staff').value;
    const type = document.getElementById('absence-type').value;
    const start_date = document.getElementById('absence-start').value;
    const end_date = document.getElementById('absence-end').value;
    const status = document.getElementById('absence-status').value;
    
    if (!staff_id || !start_date || !end_date) {
        alert('Staff, start date, and end date are required!');
        return;
    }
    
    let updatedAbsences = [...absences];
    
    if (absenceId) {
        // Update existing absence
        updatedAbsences = updatedAbsences.map(a => 
            a.id === absenceId ? { ...a, staff_id, type, start_date, end_date, status } : a
        );
    } else {
        // Add new absence
        const newId = crypto.randomUUID();
        updatedAbsences.push({ id: newId, staff_id, type, start_date, end_date, status });
    }
    
    const result = await fetchAPI(ENDPOINTS.absences, 'POST', updatedAbsences);
    if (result && result.status === 'success') {
        absences = updatedAbsences;
        renderAbsencesTable();
        absenceModal.hide();
    }
}

function deleteAbsence(absenceId) {
    if (confirm('Are you sure you want to delete this absence?')) {
        const updatedAbsences = absences.filter(a => a.id !== absenceId);
        
        fetchAPI(ENDPOINTS.absences, 'POST', updatedAbsences).then(result => {
            if (result && result.status === 'success') {
                absences = updatedAbsences;
                renderAbsencesTable();
            }
        });
    }
}

// Wishes Management
function openWishModal(wishId = null) {
    const wishIdInput = document.getElementById('wish-id');
    const wishStaffSelect = document.getElementById('wish-staff');
    const wishDateInput = document.getElementById('wish-date');
    const wishShiftSelect = document.getElementById('wish-shift');
    const wishPrioritySelect = document.getElementById('wish-priority');
    const wishNotesInput = document.getElementById('wish-notes');
    
    // Reset form
    document.getElementById('wish-form').reset();
    
    // Populate staff dropdown
    wishStaffSelect.innerHTML = '';
    staff.forEach(staffMember => {
        const option = document.createElement('option');
        option.value = staffMember.id;
        option.textContent = staffMember.name;
        wishStaffSelect.appendChild(option);
    });
    
    // Populate shift dropdown
    wishShiftSelect.innerHTML = '';
    for (const [shiftKey, shiftInfo] of Object.entries(shifts)) {
        const option = document.createElement('option');
        option.value = shiftKey;
        option.textContent = shiftInfo.name || shiftKey;
        wishShiftSelect.appendChild(option);
    }
    
    if (wishId) {
        // Edit existing wish
        const wish = wishes.find(w => w.id === wishId);
        if (wish) {
            wishIdInput.value = wish.id;
            wishStaffSelect.value = wish.staff_id;
            wishDateInput.value = wish.date;
            wishShiftSelect.value = wish.shift;
            wishPrioritySelect.value = wish.priority;
            wishNotesInput.value = wish.notes || '';
        }
    } else {
        // Add new wish
        wishIdInput.value = '';
        // Set default date to today
        wishDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    wishModal.show();
}

async function saveWish() {
    const wishId = document.getElementById('wish-id').value;
    const staff_id = document.getElementById('wish-staff').value;
    const date = document.getElementById('wish-date').value;
    const shift = document.getElementById('wish-shift').value;
    const priority = document.getElementById('wish-priority').value;
    const notes = document.getElementById('wish-notes').value;
    
    if (!staff_id || !date || !shift) {
        alert('Staff, date, and shift are required!');
        return;
    }
    
    let updatedWishes = [...wishes];
    
    if (wishId) {
        // Update existing wish
        updatedWishes = updatedWishes.map(w => 
            w.id === wishId ? { ...w, staff_id, date, shift, priority, notes } : w
        );
    } else {
        // Add new wish
        const newId = crypto.randomUUID();
        updatedWishes.push({ id: newId, staff_id, date, shift, priority, notes });
    }
    
    const result = await fetchAPI(ENDPOINTS.wishes, 'POST', updatedWishes);
    if (result && result.status === 'success') {
        wishes = updatedWishes;
        renderWishesTable();
        wishModal.hide();
    }
}

function deleteWish(wishId) {
    if (confirm('Are you sure you want to delete this wish?')) {
        const updatedWishes = wishes.filter(w => w.id !== wishId);
        
        fetchAPI(ENDPOINTS.wishes, 'POST', updatedWishes).then(result => {
            if (result && result.status === 'success') {
                wishes = updatedWishes;
                renderWishesTable();
            }
        });
    }
}

// Excel Upload for Wishes
function downloadWishTemplate() {
    // In a real app, this would download a template Excel file
    // For this demo, we'll create a simple CSV template
    const headers = 'Staff ID,Date,Shift,Priority,Notes\n';
    const exampleRow = 'staff-id-1,2023-01-01,HD,high,Example note';
    const csvContent = `data:text/csv;charset=utf-8,${headers}${exampleRow}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'wishes_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function uploadWishesFile() {
    const fileInput = document.getElementById('excel-file');
    if (!fileInput.files.length) {
        alert('Please select a file to upload.');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch(ENDPOINTS.uploadWishes, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('Wishes uploaded successfully!');
            loadWishes();
            uploadModal.hide();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Upload failed:', error);
        alert(`Upload failed: ${error.message}`);
    }
}

// Rendering Functions
function updateShiftColumns() {
    // Update the schedule table headers
    const headerRow = scheduleTable.querySelector('thead tr');
    
    // Clear existing shift columns
    const baseColumns = headerRow.querySelectorAll('th').length;
    while (headerRow.children.length > baseColumns) {
        headerRow.removeChild(headerRow.lastChild);
    }
    
    // Add shift columns
    for (const [shiftKey, shiftInfo] of Object.entries(shifts)) {
        const th = document.createElement('th');
        th.textContent = shiftInfo.name || shiftKey;
        th.title = shiftInfo.description || '';
        headerRow.appendChild(th);
    }
}

function renderScheduleTable() {
    const tbody = scheduleTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Update column headers to show shifts in the correct order
    const headerRow = scheduleTable.querySelector('thead tr');
    
    // Keep only the date and day columns
    while (headerRow.children.length > 2) {
        headerRow.removeChild(headerRow.lastChild);
    }
    
    // Get all shift keys
    const shiftKeys = Object.keys(shifts);
    
    // Sort ICU shifts in the specified order (morning, midday, night)
    const orderedShiftKeys = [...shiftKeys].sort((a, b) => {
        // Check if both are ICU shifts
        const aIsICU = a.startsWith('ICU_');
        const bIsICU = b.startsWith('ICU_');
        
        if (aIsICU && bIsICU) {
            // Sort by display_order if available
            const aOrder = shifts[a].display_order || 0;
            const bOrder = shifts[b].display_order || 0;
            return aOrder - bOrder;
        }
        
        // Put ICU shifts first
        if (aIsICU) return -1;
        if (bIsICU) return 1;
        
        // Otherwise alphabetical
        return a.localeCompare(b);
    });
    
    // Add headers in the correct order
    orderedShiftKeys.forEach(shiftKey => {
        const shiftName = shifts[shiftKey].name || shiftKey;
        const th = document.createElement('th');
        th.textContent = shiftName;
        headerRow.appendChild(th);
    });
    
    if (!currentSchedule || !currentSchedule.length) {
        const month = monthSelect.value;
        const year = yearSelect.value;
        
        // Generate empty schedule for the month
        const daysInMonth = new Date(year, month, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = date.toISOString().split('T')[0];
            const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
            
            const tr = document.createElement('tr');
            tr.setAttribute('data-date', dateStr);
            tr.setAttribute('data-day', day);
            tr.setAttribute('data-weekday', weekday);
            
            if (weekday === 'Saturday' || weekday === 'Sunday') {
                tr.classList.add('weekend');
            }
            
            // Date column
            const dateCell = document.createElement('td');
            dateCell.textContent = dateStr;
            tr.appendChild(dateCell);
            
            // Day column
            const dayCell = document.createElement('td');
            dayCell.textContent = `${day} (${weekday.substring(0, 3)})`;
            tr.appendChild(dayCell);
            
            // Shift columns in the ordered sequence
            for (const shiftKey of orderedShiftKeys) {
                const td = document.createElement('td');
                td.setAttribute('data-shift', shiftKey);
                td.setAttribute('data-staff-id', '');
                td.setAttribute('data-notes', '');
                
                // For ICU_midday, check if it's a weekend
                if (shiftKey === 'ICU_midday' && (weekday === 'Saturday' || weekday === 'Sunday')) {
                    // Display "Not scheduled on weekends" message
                    const notAvailableMessage = document.createElement('div');
                    notAvailableMessage.classList.add('text-muted', 'small');
                    notAvailableMessage.textContent = 'Not on weekends';
                    td.appendChild(notAvailableMessage);
                } else {
                    // Create drop target container
                    const shiftContainer = document.createElement('div');
                    shiftContainer.classList.add('shift-cell-container', `shift-${shiftKey}`);
                    shiftContainer.setAttribute('data-shift', shiftKey);
                    
                    // Copy data attributes to container
                    shiftContainer.setAttribute('data-staff-id', td.getAttribute('data-staff-id'));
                    shiftContainer.setAttribute('data-notes', td.getAttribute('data-notes'));
                    
                    td.appendChild(shiftContainer);
                }
                
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        }
    } else {
        // Render the loaded schedule
        currentSchedule.forEach(day => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-date', day.date);
            tr.setAttribute('data-day', day.day);
            tr.setAttribute('data-weekday', day.weekday);
            
            if (day.weekday === 'Saturday' || day.weekday === 'Sunday') {
                tr.classList.add('weekend');
            }
            
            // Date column
            const dateCell = document.createElement('td');
            dateCell.textContent = day.date;
            tr.appendChild(dateCell);
            
            // Day column
            const dayCell = document.createElement('td');
            dayCell.textContent = `${day.day} (${day.weekday.substring(0, 3)})`;
            tr.appendChild(dayCell);
            
            // Shift columns in the ordered sequence
            for (const shiftKey of orderedShiftKeys) {
                const td = document.createElement('td');
                td.setAttribute('data-shift', shiftKey);
                
                // Get the assignment for this shift
                const assignment = day.shifts[shiftKey] || { assigned: null, notes: '' };
                td.setAttribute('data-staff-id', assignment.assigned || '');
                td.setAttribute('data-notes', assignment.notes || '');
                
                // For ICU_midday, check if it's a weekend or has a "Not scheduled" note
                if (shiftKey === 'ICU_midday' && 
                   ((day.weekday === 'Saturday' || day.weekday === 'Sunday') || 
                    assignment.notes.includes("Not scheduled"))) {
                    // Display "Not scheduled on weekends" message
                    const notAvailableMessage = document.createElement('div');
                    notAvailableMessage.classList.add('text-muted', 'small');
                    notAvailableMessage.textContent = 'Not on weekends';
                    td.appendChild(notAvailableMessage);
                } else {
                    // Create drop target container
                    const shiftContainer = document.createElement('div');
                    shiftContainer.classList.add('shift-cell-container', `shift-${shiftKey}`);
                    shiftContainer.setAttribute('data-shift', shiftKey);
                    
                    // Copy data attributes to container
                    shiftContainer.setAttribute('data-staff-id', td.getAttribute('data-staff-id'));
                    shiftContainer.setAttribute('data-notes', td.getAttribute('data-notes'));
                    
                    // Add assignment if any
                    if (assignment.assigned) {
                        const staffMember = staff.find(s => s.id === assignment.assigned);
                        if (staffMember) {
                            const assignmentDiv = document.createElement('div');
                            assignmentDiv.classList.add('staff-assignment');
                            
                            const nameSpan = document.createElement('span');
                            nameSpan.classList.add('staff-assignment-name');
                            nameSpan.textContent = staffMember.name;
                            
                            const removeBtn = document.createElement('span');
                            removeBtn.classList.add('staff-assignment-remove');
                            removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
                            removeBtn.addEventListener('click', function(e) {
                                e.stopPropagation();
                                shiftContainer.setAttribute('data-staff-id', '');
                                shiftContainer.setAttribute('data-notes', '');
                                td.setAttribute('data-staff-id', '');
                                td.setAttribute('data-notes', '');
                                shiftContainer.removeChild(assignmentDiv);
                            });
                            
                            assignmentDiv.appendChild(nameSpan);
                            assignmentDiv.appendChild(removeBtn);
                            shiftContainer.appendChild(assignmentDiv);
                            
                            // Check if this was a granted wish
                            const isWishGranted = wishes.some(w => 
                                w.staff_id === assignment.assigned && 
                                w.date === day.date && 
                                w.shift === shiftKey
                            );
                            
                            if (isWishGranted) {
                                shiftContainer.classList.add('wish-granted');
                            }
                            
                            // Add note about the assignment type
                            if (assignment.notes) {
                                if (assignment.notes.includes("Weekly assignment")) {
                                    shiftContainer.classList.add('weekly-assignment');
                                } else if (assignment.notes.includes("Block assignment")) {
                                    shiftContainer.classList.add('block-assignment');
                                } else if (assignment.notes.includes("Weekend pair") || 
                                        assignment.notes.includes("Weekend block")) {
                                    shiftContainer.classList.add('weekend-assignment');
                                }
                            }
                            
                            // Check if next day is off for this shift
                            if (shifts[shiftKey] && shifts[shiftKey].next_day_off) {
                                shiftContainer.classList.add('next-day-off');
                            }
                        }
                    }
                    
                    td.appendChild(shiftContainer);
                }
                
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        });
    }
    
    // Initialize drag and drop
    initDragAndDrop();
}

function renderStaffTable() {
    const tbody = staffTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    staff.forEach(staffMember => {
        const tr = document.createElement('tr');
        
        // ID column
        const idCell = document.createElement('td');
        idCell.textContent = staffMember.id;
        tr.appendChild(idCell);
        
        // Name column
        const nameCell = document.createElement('td');
        nameCell.textContent = staffMember.name;
        tr.appendChild(nameCell);
        
        // Role column
        const roleCell = document.createElement('td');
        roleCell.textContent = staffMember.role;
        tr.appendChild(roleCell);
        
        // Contact column
        const contactCell = document.createElement('td');
        contactCell.textContent = staffMember.contact || '';
        tr.appendChild(contactCell);
        
        // Required Shifts column
        const requiredShiftsCell = document.createElement('td');
        requiredShiftsCell.textContent = staffMember.required_shifts || 0;
        tr.appendChild(requiredShiftsCell);
        
        // Capabilities column
        const capabilitiesCell = document.createElement('td');
        if (staffMember.capabilities && staffMember.capabilities.length > 0) {
            const capList = document.createElement('div');
            capList.classList.add('d-flex', 'flex-wrap', 'gap-1');
            
            staffMember.capabilities.forEach(cap => {
                const badge = document.createElement('span');
                badge.classList.add('badge', 'bg-info', 'text-dark', 'me-1');
                badge.textContent = cap;
                capList.appendChild(badge);
            });
            
            capabilitiesCell.appendChild(capList);
        } else {
            capabilitiesCell.textContent = 'None';
        }
        tr.appendChild(capabilitiesCell);
        
        // Actions column
        const actionsCell = document.createElement('td');
        
        const editBtn = document.createElement('button');
        editBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'me-2');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => openStaffModal(staffMember.id));
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteStaffMember(staffMember.id));
        actionsCell.appendChild(deleteBtn);
        
        tr.appendChild(actionsCell);
        
        tbody.appendChild(tr);
    });
}

function renderAbsencesTable() {
    const tbody = absencesTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    absences.forEach(absence => {
        const tr = document.createElement('tr');
        
        // Staff column
        const staffCell = document.createElement('td');
        const staffMember = staff.find(s => s.id === absence.staff_id);
        staffCell.textContent = staffMember ? staffMember.name : 'Unknown';
        tr.appendChild(staffCell);
        
        // Type column
        const typeCell = document.createElement('td');
        typeCell.textContent = absence.type;
        tr.appendChild(typeCell);
        
        // Start Date column
        const startDateCell = document.createElement('td');
        startDateCell.textContent = absence.start_date;
        tr.appendChild(startDateCell);
        
        // End Date column
        const endDateCell = document.createElement('td');
        endDateCell.textContent = absence.end_date;
        tr.appendChild(endDateCell);
        
        // Status column
        const statusCell = document.createElement('td');
        statusCell.textContent = absence.status;
        statusCell.classList.add(`status-${absence.status}`);
        tr.appendChild(statusCell);
        
        // Actions column
        const actionsCell = document.createElement('td');
        
        const editBtn = document.createElement('button');
        editBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'me-2');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => openAbsenceModal(absence.id));
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteAbsence(absence.id));
        actionsCell.appendChild(deleteBtn);
        
        tr.appendChild(actionsCell);
        
        tbody.appendChild(tr);
    });
}

function renderWishesTable() {
    const tbody = wishesTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    wishes.forEach(wish => {
        const tr = document.createElement('tr');
        
        // Staff column
        const staffCell = document.createElement('td');
        const staffMember = staff.find(s => s.id === wish.staff_id);
        staffCell.textContent = staffMember ? staffMember.name : 'Unknown';
        tr.appendChild(staffCell);
        
        // Date column
        const dateCell = document.createElement('td');
        dateCell.textContent = wish.date;
        tr.appendChild(dateCell);
        
        // Shift column
        const shiftCell = document.createElement('td');
        const shiftInfo = shifts[wish.shift];
        shiftCell.textContent = shiftInfo ? (shiftInfo.name || wish.shift) : wish.shift;
        tr.appendChild(shiftCell);
        
        // Priority column
        const priorityCell = document.createElement('td');
        priorityCell.textContent = wish.priority;
        priorityCell.classList.add(`priority-${wish.priority}`);
        tr.appendChild(priorityCell);
        
        // Notes column
        const notesCell = document.createElement('td');
        notesCell.textContent = wish.notes || '';
        tr.appendChild(notesCell);
        
        // Actions column
        const actionsCell = document.createElement('td');
        
        const editBtn = document.createElement('button');
        editBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'me-2');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => openWishModal(wish.id));
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteWish(wish.id));
        actionsCell.appendChild(deleteBtn);
        
        tr.appendChild(actionsCell);
        
        tbody.appendChild(tr);
    });
}

// Helper Functions
function updateStaffDropdowns() {
    // Update staff dropdowns in absences and wishes modals
    const absenceStaffSelect = document.getElementById('absence-staff');
    const wishStaffSelect = document.getElementById('wish-staff');
    const calendarStaffDropdown = document.getElementById('calendar-staff-select');
    
    if (absenceStaffSelect) {
        absenceStaffSelect.innerHTML = '';
        staff.forEach(staffMember => {
            const option = document.createElement('option');
            option.value = staffMember.id;
            option.textContent = staffMember.name;
            absenceStaffSelect.appendChild(option);
        });
    }
    
    if (wishStaffSelect) {
        wishStaffSelect.innerHTML = '';
        staff.forEach(staffMember => {
            const option = document.createElement('option');
            option.value = staffMember.id;
            option.textContent = staffMember.name;
            wishStaffSelect.appendChild(option);
        });
    }
    
    // Update Calendar Staff Dropdown
    if (calendarStaffDropdown) {
        calendarStaffDropdown.innerHTML = '';
        staff.forEach(staffMember => {
            const option = document.createElement('option');
            option.value = staffMember.id;
            option.textContent = staffMember.name;
            calendarStaffDropdown.appendChild(option);
        });
    }
}

// Update the staff capabilities checkboxes in the staff modal
function updateStaffCapabilitiesCheckboxes(selectedCapabilities = []) {
    const capabilitiesContainer = document.getElementById('staff-capabilities');
    if (!capabilitiesContainer) return;
    
    capabilitiesContainer.innerHTML = '';
    
    // Get all shift types
    for (const [shiftKey, shiftInfo] of Object.entries(shifts)) {
        const label = document.createElement('label');
        label.classList.add('capability-item');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('capability-checkbox');
        checkbox.value = shiftKey;
        checkbox.id = `capability-${shiftKey}`;
        checkbox.checked = selectedCapabilities.includes(shiftKey);
        
        const span = document.createElement('span');
        span.textContent = shiftInfo.name || shiftKey;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        capabilitiesContainer.appendChild(label);
    }
}

// Get selected capabilities from checkboxes
function getSelectedCapabilities() {
    const capabilities = [];
    const checkboxes = document.querySelectorAll('#staff-capabilities input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        capabilities.push(checkbox.value);
    });
    
    return capabilities;
}

// Statistics Functions
async function loadStatistics() {
    const month = statsMonthSelect.value === '0' ? null : statsMonthSelect.value;
    const year = statsYearSelect.value;
    
    try {
        let endpoint = `${ENDPOINTS.debug.replace('/debug', '/statistics')}?year=${year}`;
        if (month) {
            endpoint += `&month=${month}`;
        }
        
        const data = await fetchAPI(endpoint);
        
        if (data && data.statistics) {
            renderStatistics(data.statistics, data.forecast);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Failed to load statistics:', error);
        alert('Failed to load statistics. Please try again.');
        return false;
    }
}

function renderStatistics(statistics, forecast) {
    // Render the summary charts
    renderSummaryCharts(statistics);
    
    // Render staff details table
    renderStaffStatsTable(statistics.staff);
    
    // Render shift distribution table
    renderShiftStatsTable(statistics.staff);
    
    // Render forecast
    renderForecast(forecast);
}

function renderSummaryCharts(statistics) {
    // Prepare data for shift distribution chart
    const shiftCounts = {};
    const staffNames = [];
    const staffTotals = [];
    const absenceData = [];
    const wishesData = [];
    
    for (const staffId in statistics.staff) {
        const staffStats = statistics.staff[staffId];
        staffNames.push(staffStats.name);
        staffTotals.push(staffStats.total_shifts);
        absenceData.push(staffStats.absences);
        wishesData.push(staffStats.wishes_granted);
        
        // Accumulate shift counts
        for (const shiftType in staffStats.shifts_by_type) {
            if (!shiftCounts[shiftType]) {
                shiftCounts[shiftType] = 0;
            }
            shiftCounts[shiftType] += staffStats.shifts_by_type[shiftType];
        }
    }
    
    // Shift Distribution Chart
    const shiftDistributionCtx = document.getElementById('shift-distribution-chart').getContext('2d');
    new Chart(shiftDistributionCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(shiftCounts),
            datasets: [{
                data: Object.values(shiftCounts),
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                    '#858796', '#5a5c69', '#2c9faf', '#3c9fdd', '#1e7e34'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Shift Type Distribution'
                }
            }
        }
    });
    
    // Staff Workload Chart
    const staffWorkloadCtx = document.getElementById('staff-workload-chart').getContext('2d');
    new Chart(staffWorkloadCtx, {
        type: 'bar',
        data: {
            labels: staffNames,
            datasets: [{
                label: 'Total Shifts',
                data: staffTotals,
                backgroundColor: '#4e73df'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Staff Workload'
                }
            }
        }
    });
    
    // Absences Chart
    const absencesCtx = document.getElementById('absences-chart').getContext('2d');
    new Chart(absencesCtx, {
        type: 'bar',
        data: {
            labels: staffNames,
            datasets: [{
                label: 'Absence Days',
                data: absenceData,
                backgroundColor: '#e74a3b'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Staff Absences'
                }
            }
        }
    });
    
    // Wishes Granted Chart
    const wishesCtx = document.getElementById('wishes-chart').getContext('2d');
    new Chart(wishesCtx, {
        type: 'bar',
        data: {
            labels: staffNames,
            datasets: [{
                label: 'Wishes Granted',
                data: wishesData,
                backgroundColor: '#1cc88a'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Wishes Granted'
                }
            }
        }
    });
}

function renderStaffStatsTable(staffStats) {
    const tbody = staffStatsTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    for (const staffId in staffStats) {
        const stats = staffStats[staffId];
        const tr = document.createElement('tr');
        
        // Staff name
        const nameCell = document.createElement('td');
        nameCell.textContent = stats.name;
        tr.appendChild(nameCell);
        
        // Total shifts
        const totalShiftsCell = document.createElement('td');
        totalShiftsCell.textContent = stats.total_shifts;
        tr.appendChild(totalShiftsCell);
        
        // Required shifts
        const requiredShiftsCell = document.createElement('td');
        requiredShiftsCell.textContent = stats.required_shifts;
        tr.appendChild(requiredShiftsCell);
        
        // Remaining shifts
        const remainingShiftsCell = document.createElement('td');
        remainingShiftsCell.textContent = stats.remaining_shifts;
        tr.appendChild(remainingShiftsCell);
        
        // Weekends worked
        const weekendsCell = document.createElement('td');
        weekendsCell.textContent = stats.weekends_worked;
        tr.appendChild(weekendsCell);
        
        // Sick days
        const sickDaysCell = document.createElement('td');
        sickDaysCell.textContent = stats.sick_days;
        tr.appendChild(sickDaysCell);
        
        // Vacation days
        const vacationDaysCell = document.createElement('td');
        vacationDaysCell.textContent = stats.vacation_days;
        tr.appendChild(vacationDaysCell);
        
        // Wishes granted
        const wishesCell = document.createElement('td');
        wishesCell.textContent = stats.wishes_granted;
        tr.appendChild(wishesCell);
        
        tbody.appendChild(tr);
    }
}

function renderShiftStatsTable(staffStats) {
    const table = shiftStatsTable;
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    
    // Clear previous content, keeping the first "Staff" column
    while (thead.children.length > 1) {
        thead.removeChild(thead.lastChild);
    }
    tbody.innerHTML = '';
    
    // Get all shift types from the first staff member
    const firstStaffId = Object.keys(staffStats)[0];
    if (!firstStaffId) return;
    
    const shiftTypes = Object.keys(staffStats[firstStaffId].shifts_by_type);
    
    // Sort ICU shifts in the requested order (morning, midday, night)
    const orderedShiftTypes = [...shiftTypes].sort((a, b) => {
        // Check if both shifts are ICU shifts
        const aIsICU = a.startsWith('ICU_');
        const bIsICU = b.startsWith('ICU_');
        
        if (aIsICU && bIsICU) {
            // Use the display order
            if (a === 'ICU_morning') return -1;
            if (a === 'ICU_midday' && b !== 'ICU_morning') return -1;
            if (a === 'ICU_night') return 1;
            return 1;
        }
        
        // If only one is ICU, sort ICU first
        if (aIsICU) return -1;
        if (bIsICU) return 1;
        
        // Otherwise use alphabetical order
        return a.localeCompare(b);
    });
    
    // Add shift columns
    orderedShiftTypes.forEach(shiftType => {
        const th = document.createElement('th');
        th.textContent = shiftType;
        thead.appendChild(th);
    });
    
    // Add rows for each staff member
    for (const staffId in staffStats) {
        const stats = staffStats[staffId];
        const tr = document.createElement('tr');
        
        // Staff name
        const nameCell = document.createElement('td');
        nameCell.textContent = stats.name;
        tr.appendChild(nameCell);
        
        // Add shift counts
        orderedShiftTypes.forEach(shiftType => {
            const td = document.createElement('td');
            td.textContent = stats.shifts_by_type[shiftType] || 0;
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    }
}

function renderForecast(forecast) {
    // Prepare data for the chart
    const staffNames = [];
    const remainingShifts = [];
    
    // Forecast chart
    for (const staffId in forecast) {
        const staffData = forecast[staffId];
        staffNames.push(staffData.name);
        remainingShifts.push(staffData.remaining_shifts);
    }
    
    const forecastCtx = document.getElementById('forecast-chart').getContext('2d');
    new Chart(forecastCtx, {
        type: 'bar',
        data: {
            labels: staffNames,
            datasets: [{
                label: 'Remaining Shifts',
                data: remainingShifts,
                backgroundColor: '#f6c23e'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Remaining Shifts Forecast'
                }
            }
        }
    });
    
    // Forecast table
    const forecastTableBody = forecastTable.querySelector('tbody');
    forecastTableBody.innerHTML = '';
    
    for (const staffId in forecast) {
        const staffData = forecast[staffId];
        const tr = document.createElement('tr');
        
        // Staff name
        const nameCell = document.createElement('td');
        nameCell.textContent = staffData.name;
        tr.appendChild(nameCell);
        
        // Remaining shifts
        const remainingCell = document.createElement('td');
        remainingCell.textContent = staffData.remaining_shifts;
        tr.appendChild(remainingCell);
        
        // Recommended shifts
        const recommendedCell = document.createElement('td');
        
        if (staffData.recommended_shifts && Object.keys(staffData.recommended_shifts).length > 0) {
            const recContainer = document.createElement('div');
            recContainer.classList.add('d-flex', 'flex-wrap');
            
            for (const [shift, count] of Object.entries(staffData.recommended_shifts)) {
                if (count > 0) {
                    const badge = document.createElement('span');
                    badge.classList.add('forecast-shifts');
                    badge.textContent = `${shift}: ${count}`;
                    recContainer.appendChild(badge);
                }
            }
            
            recommendedCell.appendChild(recContainer);
        } else {
            recommendedCell.textContent = 'None';
        }
        
        tr.appendChild(recommendedCell);
        
        forecastTableBody.appendChild(tr);
    }
}

// Calendar View Functions
async function loadCalendar() {
    const staffId = calendarStaffSelect.value;
    const month = calendarMonthSelect.value;
    const year = calendarYearSelect.value;
    
    if (!staffId) {
        alert('Please select a staff member');
        return;
    }
    
    try {
        const endpoint = `${ENDPOINTS.debug.replace('/debug', '/calendar')}/${staffId}?year=${year}&month=${month}`;
        const data = await fetchAPI(endpoint);
        
        if (data) {
            renderCalendar(data.shifts, data.absences, month, year);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Failed to load calendar:', error);
        alert('Failed to load calendar. Please try again.');
        return false;
    }
}

function renderCalendar(shifts, absences, month, year) {
    const selectedMonth = parseInt(month);
    const selectedYear = parseInt(year);
    
    // Get the staff member name
    const staffId = calendarStaffSelect.value;
    const staffMember = staff.find(s => s.id === staffId);
    const staffName = staffMember ? staffMember.name : 'Unknown';
    
    // Create a calendar grid
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);
    const daysInMonth = lastDay.getDate();
    
    // Map shifts by date for easy lookup
    const shiftsByDate = {};
    shifts.forEach(shift => {
        const date = shift.date.split('T')[0];
        if (!shiftsByDate[date]) {
            shiftsByDate[date] = [];
        }
        shiftsByDate[date].push(shift);
    });
    
    // Map absences by date
    const absencesByDate = {};
    absences.forEach(absence => {
        const start = new Date(absence.start_date);
        const end = new Date(absence.end_date);
        
        // Generate all dates within the absence period
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (!absencesByDate[dateStr]) {
                absencesByDate[dateStr] = [];
            }
            absencesByDate[dateStr].push(absence);
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    
    // Create calendar table
    const calendar = document.createElement('table');
    calendar.classList.add('calendar-table');
    
    // Create header (days of week)
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    calendar.appendChild(thead);
    
    // Create body with week rows
    const tbody = document.createElement('tbody');
    
    // Calculate the starting day of week (0 = Sunday, 6 = Saturday)
    const startingDayOfWeek = firstDay.getDay();
    
    let date = 1;
    for (let weekIndex = 0; date <= daysInMonth; weekIndex++) {
        const weekRow = document.createElement('tr');
        
        // Create 7 cells for each day of the week
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const dayCell = document.createElement('td');
            
            // Only add content if we're within the month
            if ((weekIndex === 0 && dayIndex < startingDayOfWeek) || date > daysInMonth) {
                // Empty cell
                dayCell.classList.add('empty-day');
            } else {
                // Format date as YYYY-MM-DD
                const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                
                // Add date indicator
                const dateDiv = document.createElement('div');
                dateDiv.classList.add('calendar-date');
                dateDiv.textContent = date;
                dayCell.appendChild(dateDiv);
                
                // Check if weekend
                if (dayIndex === 0 || dayIndex === 6) {
                    dayCell.classList.add('calendar-weekend');
                }
                
                // Check if today
                const today = new Date();
                if (date === today.getDate() && selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()) {
                    dayCell.classList.add('calendar-today');
                }
                
                // Add shifts for this day
                if (shiftsByDate[dateStr]) {
                    shiftsByDate[dateStr].forEach(shiftDay => {
                        shiftDay.shifts.forEach(shift => {
                            const shiftDiv = document.createElement('div');
                            shiftDiv.classList.add('calendar-shift', `shift-${shift.shift}`);
                            shiftDiv.textContent = `${shift.shift} (${shift.start}-${shift.end})`;
                            dayCell.appendChild(shiftDiv);
                        });
                    });
                }
                
                // Add absences for this day
                if (absencesByDate[dateStr]) {
                    absencesByDate[dateStr].forEach(absence => {
                        const absenceDiv = document.createElement('div');
                        absenceDiv.classList.add('calendar-absence');
                        absenceDiv.textContent = absence.type;
                        dayCell.appendChild(absenceDiv);
                    });
                }
                
                date++;
            }
            
            weekRow.appendChild(dayCell);
        }
        
        tbody.appendChild(weekRow);
    }
    
    calendar.appendChild(tbody);
    
    // Update the calendar container
    staffCalendar.innerHTML = '';
    staffCalendar.appendChild(calendar);
    
    // Render shifts summary
    renderCalendarShiftsSummary(shifts, staffName);
    
    // Render absences summary
    renderCalendarAbsencesSummary(absences, staffName);
}

function renderCalendarShiftsSummary(shifts, staffName) {
    // Count shifts by type
    const shiftCounts = {};
    
    shifts.forEach(shift => {
        shift.shifts.forEach(s => {
            if (!shiftCounts[s.shift]) {
                shiftCounts[s.shift] = 0;
            }
            shiftCounts[s.shift]++;
        });
    });
    
    // Create summary content
    const summaryDiv = document.createElement('div');
    
    // Title
    const title = document.createElement('h6');
    title.textContent = `${staffName}'s Shifts`;
    summaryDiv.appendChild(title);
    
    // Shift counts
    if (Object.keys(shiftCounts).length === 0) {
        const noShifts = document.createElement('p');
        noShifts.classList.add('text-muted');
        noShifts.textContent = 'No shifts scheduled for this month.';
        summaryDiv.appendChild(noShifts);
    } else {
        const list = document.createElement('ul');
        
        for (const [shift, count] of Object.entries(shiftCounts)) {
            const item = document.createElement('li');
            item.textContent = `${shift}: ${count} shifts`;
            list.appendChild(item);
        }
        
        // Total
        const total = document.createElement('li');
        total.classList.add('fw-bold');
        
        const totalCount = Object.values(shiftCounts).reduce((sum, count) => sum + count, 0);
        total.textContent = `Total: ${totalCount} shifts`;
        
        list.appendChild(total);
        summaryDiv.appendChild(list);
    }
    
    calendarShiftsSummary.innerHTML = '';
    calendarShiftsSummary.appendChild(summaryDiv);
}

function renderCalendarAbsencesSummary(absences, staffName) {
    // Create summary content
    const summaryDiv = document.createElement('div');
    
    // Title
    const title = document.createElement('h6');
    title.textContent = `${staffName}'s Absences`;
    summaryDiv.appendChild(title);
    
    // Absence list
    if (absences.length === 0) {
        const noAbsences = document.createElement('p');
        noAbsences.classList.add('text-muted');
        noAbsences.textContent = 'No absences recorded for this month.';
        summaryDiv.appendChild(noAbsences);
    } else {
        const list = document.createElement('ul');
        
        absences.forEach(absence => {
            const item = document.createElement('li');
            item.textContent = `${absence.type}: ${absence.start_date} to ${absence.end_date} (${absence.status})`;
            
            // Add color based on status
            if (absence.status === 'approved') {
                item.classList.add('text-success');
            } else if (absence.status === 'pending') {
                item.classList.add('text-warning');
            } else if (absence.status === 'rejected') {
                item.classList.add('text-danger');
            }
            
            list.appendChild(item);
        });
        
        summaryDiv.appendChild(list);
    }
    
    calendarAbsencesSummary.innerHTML = '';
    calendarAbsencesSummary.appendChild(summaryDiv);
}

// Add event listeners for new features
function addAdditionalEventListeners() {
    // Add event listeners for statistics page
    if (loadStatisticsBtn) {
        loadStatisticsBtn.addEventListener('click', loadStatistics);
    }
    
    // Add event listeners for calendar view
    if (loadCalendarBtn) {
        loadCalendarBtn.addEventListener('click', loadCalendar);
    }
    
    // Populate year select dropdowns
    const currentYear = new Date().getFullYear();
    [statsYearSelect, calendarYearSelect].forEach(yearSelect => {
        if (yearSelect) {
            yearSelect.innerHTML = '';
            for (let year = currentYear - 1; year <= currentYear + 2; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
            yearSelect.value = currentYear;
        }
    });
    
    // Set current month
    const currentMonth = new Date().getMonth() + 1;
    if (statsMonthSelect) statsMonthSelect.value = currentMonth;
    if (calendarMonthSelect) calendarMonthSelect.value = currentMonth;
}

// Export schedule in different formats
function exportSchedule(format) {
    const month = monthSelect.value;
    const year = yearSelect.value;
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
    const filename = `schedule_${monthName}_${year}`;
    
    // Prepare data for export
    const exportData = [];
    
    // Get all shift keys in order
    const shiftKeys = Object.keys(shifts);
    const orderedShiftKeys = [...shiftKeys].sort((a, b) => {
        // Order ICU shifts first
        const aIsICU = a.startsWith('ICU_');
        const bIsICU = b.startsWith('ICU_');
        
        if (aIsICU && bIsICU) {
            // Sort by display_order
            const aOrder = shifts[a].display_order || 0;
            const bOrder = shifts[b].display_order || 0;
            return aOrder - bOrder;
        }
        
        if (aIsICU) return -1;
        if (bIsICU) return 1;
        
        return a.localeCompare(b);
    });
    
    // Create headers for CSV
    const headers = ['Date', 'Day', 'Weekday'];
    orderedShiftKeys.forEach(shiftKey => {
        headers.push(shifts[shiftKey].name || shiftKey);
    });
    
    // Add each day's data
    currentSchedule.forEach(day => {
        const rowData = {
            Date: day.date,
            Day: day.day,
            Weekday: day.weekday
        };
        
        // Add each shift assignment
        orderedShiftKeys.forEach(shiftKey => {
            const assignment = day.shifts[shiftKey] || { assigned: null, notes: '' };
            const staffId = assignment.assigned;
            let staffName = 'None';
            
            if (staffId) {
                const staffMember = staff.find(s => s.id === staffId);
                if (staffMember) {
                    staffName = staffMember.name;
                }
            }
            
            const shiftName = shifts[shiftKey].name || shiftKey;
            rowData[shiftName] = staffName;
        });
        
        exportData.push(rowData);
    });
    
    switch (format) {
        case 'csv':
            exportToCsv(exportData, headers, `${filename}.csv`);
            break;
        case 'excel':
            alert('Excel export feature will be implemented in a future update.');
            break;
        case 'pdf':
            exportToPdf(exportData, headers, filename);
            break;
        default:
            console.error('Unknown export format:', format);
    }
}

// Export to CSV
function exportToCsv(data, headers, filename) {
    if (!data.length) {
        alert('No data to export.');
        return;
    }
    
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            // Format values to handle commas
            const value = row[header] || '';
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        });
        
        csvContent += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export to PDF
function exportToPdf(data, headers, filename) {
    alert('PDF export will be implemented in a future update. For now, you can print the schedule using your browser\'s print function.');
    
    // In a real implementation, would use a library like jsPDF to generate PDF
    // For now, just print the current page
    window.print();
}

// Import schedule
async function importSchedule() {
    const fileInput = document.getElementById('import-file');
    const overwriteCheckbox = document.getElementById('import-overwrite');
    
    if (!fileInput.files.length) {
        alert('Please select a file to import.');
        return;
    }
    
    const file = fileInput.files[0];
    const month = monthSelect.value;
    const year = yearSelect.value;
    
    if (file.name.endsWith('.csv')) {
        importFromCsv(file, month, year, overwriteCheckbox.checked);
    } else if (file.name.endsWith('.json')) {
        importFromJson(file, month, year, overwriteCheckbox.checked);
    } else {
        alert('Unsupported file format. Please upload a CSV or JSON file.');
    }
}

// Import from CSV
function importFromCsv(file, month, year, overwrite) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const csvData = e.target.result;
        const lines = csvData.split('\n');
        
        if (lines.length < 2) {
            alert('CSV file is empty or invalid.');
            return;
        }
        
        // Parse headers
        const headers = lines[0].split(',');
        
        // Check if required headers exist
        if (!headers.includes('Date') || !headers.includes('Day') || !headers.includes('Weekday')) {
            alert('CSV file must include Date, Day, and Weekday columns.');
            return;
        }
        
        try {
            const newSchedule = [];
            
            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue; // Skip empty lines
                
                const values = parseCSVLine(lines[i]);
                const dayData = {
                    date: getValue(values, headers, 'Date'),
                    day: parseInt(getValue(values, headers, 'Day')),
                    weekday: getValue(values, headers, 'Weekday'),
                    shifts: {}
                };
                
                // Get shift assignments
                Object.keys(shifts).forEach(shiftKey => {
                    const shiftName = shifts[shiftKey].name || shiftKey;
                    const staffName = getValue(values, headers, shiftName);
                    
                    if (staffName && staffName !== 'None') {
                        // Find staff ID by name
                        const staffMember = staff.find(s => s.name === staffName);
                        if (staffMember) {
                            dayData.shifts[shiftKey] = {
                                assigned: staffMember.id,
                                notes: 'Imported from CSV'
                            };
                        }
                    } else {
                        dayData.shifts[shiftKey] = {
                            assigned: null,
                            notes: ''
                        };
                    }
                });
                
                newSchedule.push(dayData);
            }
            
            if (overwrite) {
                currentSchedule = newSchedule;
                saveImportedSchedule(month, year, newSchedule);
            } else {
                // Merge with existing schedule
                mergeSchedules(month, year, newSchedule);
            }
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
            modal.hide();
            
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file. Please check the format.');
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file.');
    };
    
    reader.readAsText(file);
}

// Helper to parse CSV line (handles quoted values)
function parseCSVLine(line) {
    const values = [];
    let inQuote = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    // Add the last value
    values.push(currentValue);
    
    return values;
}

// Helper to get value from CSV row by header
function getValue(values, headers, header) {
    const index = headers.indexOf(header);
    if (index !== -1 && index < values.length) {
        // Remove quotes if present
        let value = values[index];
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }
        return value;
    }
    return '';
}

// Import from JSON
function importFromJson(file, month, year, overwrite) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            
            if (!Array.isArray(jsonData)) {
                alert('Invalid JSON format. Expected an array of schedule days.');
                return;
            }
            
            // Validate JSON structure
            for (const day of jsonData) {
                if (!day.date || !day.day || !day.weekday || !day.shifts) {
                    alert('Invalid JSON format. Each day must have date, day, weekday, and shifts properties.');
                    return;
                }
            }
            
            if (overwrite) {
                currentSchedule = jsonData;
                saveImportedSchedule(month, year, jsonData);
            } else {
                // Merge with existing schedule
                mergeSchedules(month, year, jsonData);
            }
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
            modal.hide();
            
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Error parsing JSON file. Please check the format.');
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file.');
    };
    
    reader.readAsText(file);
}

// Save imported schedule
async function saveImportedSchedule(month, year, schedule) {
    try {
        const result = await fetchAPI(ENDPOINTS.schedule, 'POST', {
            month,
            year,
            schedule: schedule
        });
        
        if (result && result.status === 'success') {
            alert('Schedule imported and saved successfully!');
            loadSchedule();
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        console.error('Error saving imported schedule:', error);
        alert('Error saving imported schedule. Please try again.');
    }
}

// Merge imported schedule with existing
function mergeSchedules(month, year, importedSchedule) {
    // If no current schedule, just use the imported one
    if (!currentSchedule || !currentSchedule.length) {
        currentSchedule = importedSchedule;
        saveImportedSchedule(month, year, importedSchedule);
        return;
    }
    
    // Create a map of existing schedule by date
    const scheduleMap = {};
    currentSchedule.forEach(day => {
        scheduleMap[day.date] = day;
    });
    
    // Merge imported data
    importedSchedule.forEach(importedDay => {
        if (scheduleMap[importedDay.date]) {
            // Update shifts for existing day
            const existingDay = scheduleMap[importedDay.date];
            
            // Merge shifts
            for (const [shiftKey, shiftData] of Object.entries(importedDay.shifts)) {
                if (shiftData.assigned) {
                    existingDay.shifts[shiftKey] = {
                        assigned: shiftData.assigned,
                        notes: 'Imported from file'
                    };
                }
            }
        } else {
            // Add new day
            currentSchedule.push(importedDay);
        }
    });
    
    // Sort by day
    currentSchedule.sort((a, b) => a.day - b.day);
    
    // Save the merged schedule
    saveImportedSchedule(month, year, currentSchedule);
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    init();
    addAdditionalEventListeners();
});