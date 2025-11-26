// ==================== STATE MANAGEMENT ====================
let currentFilter = 'all';
let currentEditingTask = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Load initial data
    await loadTasks();
    await loadCalendar();
    await loadUpcoming();

    // Setup event listeners
    setupEventListeners();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            loadTasks();
        });
    });

    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        openTaskModal();
    });

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeTaskModal);
    document.getElementById('cancelBtn').addEventListener('click', closeTaskModal);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        loadCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        loadCalendar();
    });

    // Close modal on outside click
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') {
            closeTaskModal();
        }
    });
}

// ==================== TASK MANAGEMENT ====================
async function loadTasks() {
    try {
        let url = '/api/tasks';
        if (currentFilter !== 'all') {
            url += `?category=${currentFilter}`;
        }

        const response = await fetch(url);
        const tasks = await response.json();

        renderTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');

    if (tasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No tasks found. Add your first task!</p>';
        return;
    }

    taskList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id}, ${task.completed})"></div>
            <div class="task-content" onclick="editTask(${task.id})">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="task-date">📅 ${formatDate(task.date)}</span>
                    <span class="task-category">🏷️ ${task.category}</span>
                    <span class="task-priority priority-${task.priority.toLowerCase()}">⚡ ${task.priority}</span>
                </div>
            </div>
            <button class="task-delete-btn" onclick="event.stopPropagation(); deleteTask(${task.id})" title="Delete task">🗑️</button>
        </div>
    `).join('');
}

async function toggleTask(taskId, currentCompleted) {
    try {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const taskData = await fetch(`/api/tasks?category=all`).then(r => r.json());
        const task = taskData.find(t => t.id === taskId);

        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...task,
                completed: !currentCompleted
            })
        });

        if (response.ok) {
            await loadTasks();

            // If task was just completed, reload galaxy
            if (!currentCompleted) {
                if (window.loadGalaxy) {
                    await window.loadGalaxy();
                }
                showNotification('🌟 Task completed! A new star added to your galaxy!');
            }
        }
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

async function editTask(taskId) {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            currentEditingTask = task;
            openTaskModal(task);
        }
    } catch (error) {
        console.error('Error loading task:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadTasks();
            closeTaskModal();
            showNotification('Task deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// ==================== MODAL MANAGEMENT ====================
function openTaskModal(task = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');

    if (task) {
        modalTitle.textContent = 'Edit Task';
        document.getElementById('taskTitleInput').value = task.title;
        document.getElementById('taskDescInput').value = task.description || '';
        document.getElementById('taskDateInput').value = task.date;
        document.getElementById('taskPriorityInput').value = task.priority;
        document.getElementById('taskCategoryInput').value = task.category;

        // Add delete button if editing
        if (!document.getElementById('deleteTaskBtn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'deleteTaskBtn';
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn-secondary';
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.marginRight = 'auto';
            deleteBtn.onclick = () => deleteTask(task.id);
            document.querySelector('.modal-actions').prepend(deleteBtn);
        }
    } else {
        modalTitle.textContent = 'Add New Task';
        form.reset();
        // Set default date to today
        document.getElementById('taskDateInput').value = new Date().toISOString().split('T')[0];

        // Remove delete button if exists
        const deleteBtn = document.getElementById('deleteTaskBtn');
        if (deleteBtn) deleteBtn.remove();
    }

    modal.classList.add('active');
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
    currentEditingTask = null;
    document.getElementById('taskForm').reset();
}

async function handleTaskSubmit(e) {
    e.preventDefault();

    const taskData = {
        title: document.getElementById('taskTitleInput').value,
        description: document.getElementById('taskDescInput').value,
        date: document.getElementById('taskDateInput').value,
        priority: document.getElementById('taskPriorityInput').value,
        category: document.getElementById('taskCategoryInput').value,
        completed: currentEditingTask ? currentEditingTask.completed : false
    };

    try {
        let response;
        if (currentEditingTask) {
            response = await fetch(`/api/tasks/${currentEditingTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }

        if (response.ok) {
            await loadTasks();
            closeTaskModal();
            showNotification(currentEditingTask ? 'Task updated!' : 'Task created!');
        }
    } catch (error) {
        console.error('Error saving task:', error);
    }
}

// ==================== CALENDAR ====================
async function loadCalendar() {
    try {
        const response = await fetch(`/api/calendar?month=${currentMonth + 1}&year=${currentYear}`);
        const events = await response.json();

        renderCalendar(events);
    } catch (error) {
        console.error('Error loading calendar:', error);
    }
}

function renderCalendar(events) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    let html = '';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day" style="font-weight: 600; color: var(--text-secondary);">${day}</div>`;
    });

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEvent = events.some(e => e.date === dateStr);
        const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">${day}</div>`;
    }

    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    calendarGrid.innerHTML = html;
}

// ==================== UPCOMING EVENTS ====================
async function loadUpcoming() {
    try {
        const [tasksResponse, eventsResponse] = await Promise.all([
            fetch('/api/tasks'),
            fetch('/api/calendar')
        ]);

        const tasks = await tasksResponse.json();
        const events = await eventsResponse.json();

        // Combine and sort by date
        const upcoming = [
            ...tasks.filter(t => !t.completed).map(t => ({
                id: t.id,
                title: t.title,
                date: t.date,
                time: null,
                type: 'task',
                category: t.category
            })),
            ...events.map(e => ({
                id: e.id,
                title: e.title,
                date: e.date,
                time: e.time,
                type: 'event',
                category: e.category
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 10);

        renderUpcoming(upcoming);
    } catch (error) {
        console.error('Error loading upcoming:', error);
    }
}

function renderUpcoming(items) {
    const upcomingList = document.getElementById('upcomingList');

    if (items.length === 0) {
        upcomingList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No upcoming items</p>';
        return;
    }

    upcomingList.innerHTML = items.map(item => `
        <div class="upcoming-item">
            <div class="upcoming-content">
                <div class="upcoming-title">${item.type === 'task' ? '✓' : '📅'} ${escapeHtml(item.title)}</div>
                <div class="upcoming-time">${formatDate(item.date)}${item.time ? ` at ${item.time}` : ''}</div>
            </div>
            <button class="upcoming-delete-btn" onclick="event.stopPropagation(); ${item.type === 'task' ? `deleteTask(${item.id})` : `deleteEvent(${item.id})`}" title="Delete">🗑️</button>
        </div>
    `).join('');
}

// ==================== UTILITY FUNCTIONS ====================
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    // Simple notification (can be enhanced with a toast library)
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-gradient);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
