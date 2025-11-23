// ==========================================
// STORAGE FUNCTIONS
// ==========================================

// Get all sessions from localStorage
function getSessions() {
    const sessions = localStorage.getItem('codegalaxy-sessions');
    return sessions ? JSON.parse(sessions) : [];
}

// Save a new session to localStorage
function saveSession(session) {
    const sessions = getSessions();
    sessions.push(session);
    localStorage.setItem('codegalaxy-sessions', JSON.stringify(sessions));
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
        localStorage.removeItem('codegalaxy-sessions');
        location.reload();
    }
}

// ==========================================
// STATS CALCULATIONS
// ==========================================

function calculateStats() {
    const sessions = getSessions();
    
    // Total sessions
    const totalSessions = sessions.length;
    
    // Total focus time in minutes
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Calculate streak
    let streak = 0;
    if (sessions.length > 0) {
        // Get unique dates with sessions
        const sessionDates = sessions.map(session => {
            const date = new Date(session.startTime);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        });
        
        const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a);
        
        // Start from the most recent session date
        if (uniqueDates.length > 0) {
            let currentDate = new Date(uniqueDates[0]);
            streak = 1; // Count the most recent day
            
            // Count consecutive days going backward
            for (let i = 1; i < uniqueDates.length; i++) {
                const previousDay = new Date(currentDate);
                previousDay.setDate(previousDay.getDate() - 1);
                
                if (uniqueDates[i] === previousDay.getTime()) {
                    streak++;
                    currentDate = previousDay;
                } else {
                    break;
                }
            }
        }
    }
    
    return {
        totalSessions,
        totalTime: `${hours}h ${minutes}m`,
        streak
    };
}

// ==========================================
// INDEX.HTML - MOOD SELECTION
// ==========================================

if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', function() {
        const moodCards = document.querySelectorAll('.mood-card');
        
        moodCards.forEach(card => {
            card.addEventListener('click', function() {
                const mood = this.getAttribute('data-mood');
                // Save selected mood to sessionStorage
                sessionStorage.setItem('selectedMood', mood);
                // Redirect to timer page
                window.location.href = 'timer.html';
            });
        });
    });
}

// ==========================================
// TIMER.HTML - FOCUS TIMER
// ==========================================

if (window.location.pathname.endsWith('timer.html')) {
    let timerInterval = null;
    let isPaused = false;
    let totalSeconds = 25 * 60; // 25 minutes
    let remainingSeconds = totalSeconds;
    let sessionStartTime = null;
    let todoItems = []; // Store to-do items for this session
    
    document.addEventListener('DOMContentLoaded', function() {
        // Get selected mood
        const mood = sessionStorage.getItem('selectedMood') || 'focused';
        const moodDisplay = document.getElementById('mood-display');
        
        const moodEmojis = {
            calm: '🌙 Calm',
            energetic: '⚡ Energetic',
            focused: '🎯 Focused'
        };
        
        moodDisplay.textContent = moodEmojis[mood] + ' Focus Session';
        
        // Get DOM elements
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        const minutesDisplay = document.getElementById('minutes');
        const secondsDisplay = document.getElementById('seconds');
        const progressFill = document.getElementById('progress-fill');
        
        // To-do list elements
        const todoInput = document.getElementById('todo-input');
        const addTodoBtn = document.getElementById('add-todo-btn');
        const todoList = document.getElementById('todo-list');
        
        // Draw galaxy animation
        drawGalaxy();
        
        // To-do list functionality
        function addTodo() {
            const todoText = todoInput.value.trim();
            if (todoText === '') {
                alert('Please enter a task!');
                return;
            }
            
            todoItems.push(todoText);
            todoInput.value = '';
            renderTodoList();
        }
        
        function removeTodo(index) {
            todoItems.splice(index, 1);
            renderTodoList();
        }
        
        function renderTodoList() {
            todoList.innerHTML = '';
            
            if (todoItems.length === 0) {
                const emptyState = document.createElement('p');
                emptyState.className = 'empty-state';
                emptyState.textContent = "No tasks added yet. Add what you'll focus on!";
                todoList.appendChild(emptyState);
            } else {
                todoItems.forEach((item, index) => {
                    const todoItem = document.createElement('div');
                    todoItem.className = 'todo-item';
                    todoItem.setAttribute('data-testid', `item-todo-${index}`);
                    
                    const todoText = document.createElement('span');
                    todoText.className = 'todo-text';
                    todoText.textContent = item; // Safe text insertion
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'todo-remove';
                    removeBtn.textContent = 'Remove';
                    removeBtn.setAttribute('data-testid', `button-remove-todo-${index}`);
                    removeBtn.addEventListener('click', () => removeTodo(index));
                    
                    todoItem.appendChild(todoText);
                    todoItem.appendChild(removeBtn);
                    todoList.appendChild(todoItem);
                });
            }
        }
        
        // Make removeTodo accessible globally for onclick
        window.removeTodoItem = removeTodo;
        
        // Add todo on button click
        addTodoBtn.addEventListener('click', addTodo);
        
        // Add todo on Enter key
        todoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
        
        // Start button
        startBtn.addEventListener('click', function() {
            if (!sessionStartTime) {
                sessionStartTime = new Date();
            }
            
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            stopBtn.style.display = 'inline-block';
            
            isPaused = false;
            startTimer();
        });
        
        // Pause button
        pauseBtn.addEventListener('click', function() {
            isPaused = true;
            clearInterval(timerInterval);
            
            pauseBtn.style.display = 'none';
            startBtn.style.display = 'inline-block';
            startBtn.textContent = 'Resume';
        });
        
        // Stop button
        stopBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to stop this session?')) {
                stopTimer();
            }
        });
        
        function startTimer() {
            timerInterval = setInterval(function() {
                if (remainingSeconds > 0) {
                    remainingSeconds--;
                    updateDisplay();
                    updateProgress();
                } else {
                    // Timer completed
                    completeSession(true);
                }
            }, 1000);
        }
        
        function updateDisplay() {
            const mins = Math.floor(remainingSeconds / 60);
            const secs = remainingSeconds % 60;
            
            minutesDisplay.textContent = mins.toString().padStart(2, '0');
            secondsDisplay.textContent = secs.toString().padStart(2, '0');
        }
        
        function updateProgress() {
            const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
            progressFill.style.width = progress + '%';
        }
        
        function stopTimer() {
            clearInterval(timerInterval);
            completeSession(false);
        }
        
        function completeSession(completed) {
            const endTime = new Date();
            const durationMinutes = Math.floor((totalSeconds - remainingSeconds) / 60);
            
            // Save session with to-do items
            const session = {
                mood: mood,
                duration: durationMinutes,
                targetDuration: 25,
                completed: completed,
                startTime: sessionStartTime.toISOString(),
                endTime: endTime.toISOString(),
                todos: todoItems // Save the to-do list with the session
            };
            
            saveSession(session);
            
            // Show completion message
            if (completed) {
                alert('🎉 Great job! You completed your focus session!');
            }
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    });
    
    // Galaxy animation
    function drawGalaxy() {
        const canvas = document.getElementById('galaxy-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Get total sessions for galaxy size
        const sessions = getSessions();
        const sessionCount = sessions.length;
        
        // Draw stars
        const starCount = Math.min(100 + sessionCount * 10, 500);
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            const brightness = Math.random();
            
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw central glow
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const glowSize = 50 + sessionCount * 5;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
        gradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.3)');
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// ==========================================
// DASHBOARD.HTML - STATS DISPLAY
// ==========================================

if (window.location.pathname.endsWith('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        // Calculate and display stats
        const stats = calculateStats();
        
        document.getElementById('total-sessions').textContent = stats.totalSessions;
        document.getElementById('total-time').textContent = stats.totalTime;
        document.getElementById('streak').textContent = stats.streak;
        
        // Display recent sessions
        displayRecentSessions();
        
        // Clear data button
        const clearBtn = document.getElementById('clear-data-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllData);
        }
    });
    
    function displayRecentSessions() {
        const sessionsList = document.getElementById('sessions-list');
        const sessions = getSessions();
        
        if (sessions.length === 0) {
            sessionsList.innerHTML = '<p class="empty-state">No sessions yet. Start your first focus session!</p>';
            return;
        }
        
        // Show last 10 sessions
        const recentSessions = sessions.slice(-10).reverse();
        
        const moodEmojis = {
            calm: '🌙',
            energetic: '⚡',
            focused: '🎯'
        };
        
        sessionsList.innerHTML = '';
        
        recentSessions.forEach((session) => {
            const date = new Date(session.startTime);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const timestamp = new Date(session.startTime).getTime();
            
            // Create session item
            const sessionItem = document.createElement('div');
            sessionItem.className = 'session-item';
            sessionItem.setAttribute('data-testid', `item-session-${timestamp}`);
            
            // Session info
            const sessionInfo = document.createElement('div');
            sessionInfo.className = 'session-info';
            
            const moodSpan = document.createElement('span');
            moodSpan.className = 'session-mood';
            moodSpan.textContent = moodEmojis[session.mood] || '🎯';
            
            const moodName = document.createElement('span');
            moodName.textContent = session.mood.charAt(0).toUpperCase() + session.mood.slice(1);
            
            sessionInfo.appendChild(moodSpan);
            sessionInfo.appendChild(moodName);
            
            // Session details
            const sessionDetails = document.createElement('div');
            sessionDetails.className = 'session-details';
            
            const details = [
                `📅 ${dateStr}`,
                `⏰ ${timeStr}`,
                `⏱️ ${session.duration} min`,
                session.completed ? '✅ Completed' : '⏹️ Stopped'
            ];
            
            details.forEach(detail => {
                const span = document.createElement('span');
                span.className = 'session-detail';
                span.textContent = detail;
                sessionDetails.appendChild(span);
            });
            
            sessionItem.appendChild(sessionInfo);
            sessionItem.appendChild(sessionDetails);
            
            // Add todos if they exist
            if (session.todos && session.todos.length > 0) {
                const todosDiv = document.createElement('div');
                todosDiv.className = 'session-todos';
                todosDiv.setAttribute('data-testid', `session-todos-${timestamp}`);
                
                const todosTitle = document.createElement('strong');
                todosTitle.textContent = '📝 Tasks:';
                
                const todosList = document.createElement('ul');
                session.todos.forEach(todo => {
                    const li = document.createElement('li');
                    li.textContent = todo; // Safe text insertion
                    todosList.appendChild(li);
                });
                
                todosDiv.appendChild(todosTitle);
                todosDiv.appendChild(todosList);
                sessionItem.appendChild(todosDiv);
            }
            
            sessionsList.appendChild(sessionItem);
        });
    }
}