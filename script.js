document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // INITIALIZATION & SETUP
    // ----------------------------------------------------
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoDatetime = document.getElementById('todo-datetime');
    const todoList = document.getElementById('todo-list');
    const itemsLeftEl = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const clearAllBtn = document.getElementById('clear-all');
    const notificationSound = document.getElementById('notification-sound');

    const dateDisplay = document.getElementById('date-display');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const statTotal = document.getElementById('stat-total');
    const statCompleted = document.getElementById('stat-completed');
    const statPending = document.getElementById('stat-pending');

    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeMenu = document.getElementById('theme-menu');
    const themeOptions = document.querySelectorAll('.theme-option');

    // ----------------------------------------------------
    // THEMES & DATE
    // ----------------------------------------------------
    const savedTheme = localStorage.getItem('app-theme') || 'theme-midnight-blue';
    document.body.className = savedTheme;

    themeToggleBtn.addEventListener('click', () => { themeMenu.classList.toggle('show'); });
    document.addEventListener('click', (e) => {
        if (!themeToggleBtn.contains(e.target) && !themeMenu.contains(e.target)) {
            themeMenu.classList.remove('show');
        }
    });

    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const newTheme = option.getAttribute('data-theme');
            document.body.className = newTheme;
            localStorage.setItem('app-theme', newTheme);
            themeMenu.classList.remove('show');
        });
    });

    const today = new Date();
    dateDisplay.textContent = today.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    // ----------------------------------------------------
    // VITALITY MODULE
    // ----------------------------------------------------
    const resetDayBtn = document.getElementById('reset-day-btn');
    const historyList = document.getElementById('history-list');
    const toggleHistoryBtn = document.getElementById('toggle-history');
    const historyChevron = document.getElementById('history-chevron');

    function updateVitality() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;

        const mcPercentEl = document.getElementById('mc-percent');
        const mcBarEl = document.getElementById('mc-bar');
        const badgeEl = document.getElementById('vitality-badge');
        const msgEl = document.getElementById('vitality-msg');
        const scoreTextEl = document.getElementById('vitality-score-text');
        const vitalityCard = document.getElementById('vitality-card');

        let score = null;
        if (total > 0) {
            score = Math.round((completed / total) * 100);
        }

        let color, badge, msg, pulsingSpeed, actualScoreText, displayPercent;

        if (score === null) {
            actualScoreText = '---';
            displayPercent = '0%';
            color = 'var(--color-neutral)';
            badge = 'Resting';
            msg = 'Add tasks to energize your day!';
            pulsingSpeed = '0s'; 
            vitalityCard.classList.remove('pulsing');
        } else if (score >= 90) {
            actualScoreText = score + '%';
            displayPercent = score + '%';
            color = 'var(--color-green)';
            badge = 'Peak Performance';
            msg = 'Your mind is clear and energized!';
            pulsingSpeed = '1s';
            vitalityCard.classList.add('pulsing');
        } else if (score >= 50) {
            actualScoreText = score + '%';
            displayPercent = score + '%';
            color = 'var(--color-blue)';
            badge = 'Gaining Momentum';
            msg = 'You are in the flow.';
            pulsingSpeed = '2.5s';
            vitalityCard.classList.add('pulsing');
        } else if (score > 0) {
            actualScoreText = score + '%';
            displayPercent = score + '%';
            color = 'var(--color-amber)';
            badge = 'Building Energy';
            msg = 'Small steps lead to big health.';
            pulsingSpeed = '4s';
            vitalityCard.classList.add('pulsing');
        } else {
            actualScoreText = '0%';
            displayPercent = '0%';
            color = 'var(--color-gray)';
            badge = 'Stagnant';
            msg = 'Time for a quick mental reset.';
            pulsingSpeed = '6s';
            vitalityCard.classList.add('pulsing');
        }

        // Apply dynamically
        document.documentElement.style.setProperty('--vitality-color', color);
        if (pulsingSpeed !== '0s') {
            vitalityCard.style.animationDuration = pulsingSpeed;
        } else {
            vitalityCard.style.animationDuration = '';
        }

        scoreTextEl.textContent = actualScoreText;
        badgeEl.textContent = badge;
        msgEl.textContent = msg;

        // Mental Clarity Bar
        mcPercentEl.textContent = displayPercent;
        mcBarEl.style.width = displayPercent;
    }

    // Weekly History toggle
    toggleHistoryBtn.addEventListener('click', () => {
        historyList.classList.toggle('open');
        if (historyList.classList.contains('open')) {
            historyChevron.classList.remove('fa-chevron-down');
            historyChevron.classList.add('fa-chevron-up');
        } else {
            historyChevron.classList.remove('fa-chevron-up');
            historyChevron.classList.add('fa-chevron-down');
        }
    });

    function renderHistory() {
        let history = JSON.parse(localStorage.getItem('vitalityHistory')) || [];
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li class="history-empty">No history yet. End a day to view archives!</li>';
            return;
        }

        history.slice().reverse().forEach(entry => {
            let color = 'var(--color-neutral)';
            if (entry.score >= 90) color = 'var(--color-green)';
            else if (entry.score >= 50) color = 'var(--color-blue)';
            else if (entry.score > 0) color = 'var(--color-amber)';
            else color = 'var(--color-gray)';

            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <span class="hist-date">${entry.date}</span>
                <span class="hist-stats">${entry.completed}/${entry.total} Tasks</span>
                <span class="hist-score" style="background:${color}">${entry.score}%</span>
            `;
            historyList.appendChild(li);
        });
    }

    resetDayBtn.addEventListener('click', () => {
        if (tasks.length === 0) {
            alert('No tasks to archive! Add some tasks to compute a Vitality score.');
            return;
        }
        if (confirm("End your day? This clears current tasks and archives your Vitality Score.")) {
            let completed = tasks.filter(t => t.completed).length;
            let total = tasks.length;
            let score = Math.round((completed / total) * 100);
            
            let historyEntry = {
                date: new Date().toLocaleDateString(),
                score: score,
                completed,
                total
            };
            
            let history = JSON.parse(localStorage.getItem('vitalityHistory')) || [];
            history.push(historyEntry);
            localStorage.setItem('vitalityHistory', JSON.stringify(history));
            
            tasks = [];
            saveAndRender();
            renderHistory();
        }
    });

    renderHistory(); // Init history

    // ----------------------------------------------------
    // TASKS MODULE
    // ----------------------------------------------------
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    renderTasks();

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        const reminderTime = todoDatetime.value;

        if (text) {
            addTask(text, reminderTime);
            todoInput.value = '';
            todoDatetime.value = '';
        }
    });

    clearCompletedBtn.addEventListener('click', () => {
        const completedTasks = tasks.filter(t => t.completed);
        if(completedTasks.length === 0) return;
        
        const items = document.querySelectorAll('.todo-item.completed');
        items.forEach(item => item.classList.add('fadeOut'));

        setTimeout(() => {
            tasks = tasks.filter(task => !task.completed);
            saveAndRender();
        }, 300);
    });

    clearAllBtn.addEventListener('click', () => {
        if (tasks.length === 0) return;
        if (confirm("Are you sure you want to clear all tasks without archiving?")) {
            const items = document.querySelectorAll('.todo-item');
            items.forEach(item => item.classList.add('fadeOut'));

            setTimeout(() => {
                tasks = [];
                saveAndRender();
            }, 300);
        }
    });

    function addTask(text, reminderTime) {
        const newTask = {
            id: Date.now().toString(),
            text,
            completed: false,
            reminderTime: reminderTime || null,
            notified: false
        };
        tasks.push(newTask);
        saveTasks();
        const li = createTaskElement(newTask);
        todoList.appendChild(li);
        updateDashboardAndStats();
    }

    function toggleTask(id, element) {
        tasks = tasks.map(task => {
            if (task.id === id) return { ...task, completed: !task.completed };
            return task;
        });
        const task = tasks.find(t => t.id === id);
        if (task.completed) element.classList.add('completed');
        else element.classList.remove('completed');
        
        saveTasks();
        updateDashboardAndStats();
        renderTasks();
    }

    function deleteTask(id, element) {
        element.classList.add('fadeOut');
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveAndRender();
        }, 300);
    }

    function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

    function updateDashboardAndStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;

        statTotal.textContent = total;
        statCompleted.textContent = completed;
        statPending.textContent = pending;

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}% Done`;
        itemsLeftEl.textContent = `${pending} item${pending !== 1 ? 's' : ''} left`;

        // UPDATE NEW VITALITY SCORE
        updateVitality();
    }

    function saveAndRender() { saveTasks(); renderTasks(); }

    function createTaskElement(task) {
        const li = document.createElement('li');
        let isOverdue = false;
        
        if (task.reminderTime && !task.completed) {
            if (new Date() >= new Date(task.reminderTime)) isOverdue = true;
        }

        li.className = `todo-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
        li.dataset.id = task.id;

        let reminderHTML = '';
        if (task.reminderTime) {
            reminderHTML = `
                <div class="reminder-info ${isOverdue && !task.completed ? 'text-overdue' : ''}">
                    <i class="fas ${isOverdue ? 'fa-exclamation-circle' : 'fa-bell'}"></i> 
                    ${formatTime(task.reminderTime)}
                </div>`;
        }

        li.innerHTML = `
            <div class="checkbox"></div>
            <div class="task-content">
                <span class="todo-text">${escapeHTML(task.text)}</span>
                ${reminderHTML}
            </div>
            <button class="delete-btn" aria-label="Delete"><i class="fas fa-trash"></i></button>`;

        const checkbox = li.querySelector('.checkbox');
        const contentEl = li.querySelector('.task-content');
        checkbox.addEventListener('click', () => toggleTask(task.id, li));
        contentEl.addEventListener('click', () => toggleTask(task.id, li));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id, li);
        });
        return li;
    }

    function renderTasks() {
        todoList.innerHTML = '';
        tasks.forEach(task => todoList.appendChild(createTaskElement(task)));
        updateDashboardAndStats();
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatTime(dateTimeStr) {
        const date = new Date(dateTimeStr);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        if (isToday) return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    setInterval(checkReminders, 5000);

    function checkReminders() {
        const now = new Date();
        let needsRender = false;

        tasks.forEach(task => {
            if (task.reminderTime && !task.completed && !task.notified) {
                const reminderDate = new Date(task.reminderTime);
                if (now >= reminderDate) {
                    task.notified = true;
                    needsRender = true;
                    showNotification(task.text);
                }
            }
        });

        if (needsRender) saveAndRender();
    }

    function showNotification(taskText) {
        if (notificationSound) notificationSound.play().catch(e => console.log('Audio blocked:', e));
        const title = "Task Reminder!";
        const options = { body: taskText, icon: "https://cdn-icons-png.flaticon.com/512/2097/2097743.png" };
        if ("Notification" in window && Notification.permission === "granted") new Notification(title, options);
        else alert(`⏰ Reminder: ${taskText}`);
    }
});
