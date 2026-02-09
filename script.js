const DB = {
    subjects: [],
    tasks: [],
    schedule: [],
    settings: { theme: 'dark', notifyDeadline: true, notifySchedule: true },
    activity: []
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    updateDashboard();
    setScheduleDate();
});

function saveData() {
    localStorage.setItem('studyflow', JSON.stringify(DB));
}

function loadData() {
    const stored = localStorage.getItem('studyflow');
    if (stored) Object.assign(DB, JSON.parse(stored));
    applyTheme(DB.settings.theme);
    document.getElementById('notifyDeadline').checked = DB.settings.notifyDeadline;
    document.getElementById('notifySchedule').checked = DB.settings.notifySchedule;
}

function toggleTheme() {
    const newTheme = DB.settings.theme === 'dark' ? 'light' : 'dark';
    DB.settings.theme = newTheme;
    applyTheme(newTheme);
    saveData();
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const section = item.dataset.section;
            showSection(section);
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    document.getElementById('taskFilter').addEventListener('change', updateTasksList);
    document.getElementById('scheduleDate').addEventListener('change', updateScheduleView);
    document.getElementById('notifyDeadline').addEventListener('change', e => {
        DB.settings.notifyDeadline = e.target.checked;
        saveData();
    });
    document.getElementById('notifySchedule').addEventListener('change', e => {
        DB.settings.notifySchedule = e.target.checked;
        saveData();
    });
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    if (section === 'subjects') updateSubjectsList();
    if (section === 'tasks') updateTasksList();
    if (section === 'schedule') updateScheduleView();
    if (section === 'analytics') updateAnalytics();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    populateSelects();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function populateSelects() {
    const html = DB.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    document.getElementById('taskSubject').innerHTML = '<option>Select subject...</option>' + html;
    document.getElementById('scheduleSubject').innerHTML = '<option>Select subject...</option>' + html;
}

function handleSubjectSubmit(e) {
    e.preventDefault();
    const id = Date.now();
    DB.subjects.push({
        id,
        name: document.getElementById('subjectName').value,
        code: document.getElementById('subjectCode').value,
        priority: document.getElementById('subjectPriority').value,
        color: document.getElementById('subjectColor').value,
        teacher: document.getElementById('subjectTeacher').value,
        description: document.getElementById('subjectDescription').value
    });
    saveData();
    logActivity(`Added subject: ${document.getElementById('subjectName').value}`);
    closeModal('subjectModal');
    e.target.reset();
    updateSubjectsList();
    updateDashboard();
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const id = Date.now();
    DB.tasks.push({
        id,
        title: document.getElementById('taskTitle').value,
        subjectId: parseInt(document.getElementById('taskSubject').value),
        type: document.getElementById('taskType').value,
        deadline: new Date(document.getElementById('taskDeadline').value),
        priority: document.getElementById('taskPriority').value,
        description: document.getElementById('taskDescription').value,
        completed: false
    });
    saveData();
    logActivity(`Added task: ${document.getElementById('taskTitle').value}`);
    closeModal('taskModal');
    e.target.reset();
    updateTasksList();
    updateDashboard();
}

function handleScheduleSubmit(e) {
    e.preventDefault();
    const id = Date.now();
    DB.schedule.push({
        id,
        subjectId: parseInt(document.getElementById('scheduleSubject').value),
        date: new Date(document.getElementById('scheduleDate').value),
        startTime: document.getElementById('scheduleStartTime').value,
        endTime: document.getElementById('scheduleEndTime').value,
        type: document.getElementById('scheduleType').value,
        notes: document.getElementById('scheduleNotes').value
    });
    saveData();
    logActivity('Added study session');
    closeModal('scheduleModal');
    e.target.reset();
    updateScheduleView();
    updateDashboard();
}

function deleteSubject(id) {
    if (confirm('Delete this subject?')) {
        DB.subjects = DB.subjects.filter(s => s.id !== id);
        DB.tasks = DB.tasks.filter(t => t.subjectId !== id);
        DB.schedule = DB.schedule.filter(s => s.subjectId !== id);
        saveData();
        logActivity('Deleted subject');
        updateSubjectsList();
        updateDashboard();
    }
}

function deleteTask(id) {
    DB.tasks = DB.tasks.filter(t => t.id !== id);
    saveData();
    updateTasksList();
    updateDashboard();
}

function toggleTask(id) {
    const task = DB.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData();
        logActivity(task.completed ? 'Completed task' : 'Uncompleted task');
        updateTasksList();
        updateDashboard();
    }
}

function deleteSchedule(id) {
    DB.schedule = DB.schedule.filter(s => s.id !== id);
    saveData();
    updateScheduleView();
    updateDashboard();
}

function updateDashboard() {
    document.getElementById('totalSubjects').textContent = DB.subjects.length;
    
    const active = DB.tasks.filter(t => !t.completed).length;
    document.getElementById('activeTasks').textContent = active;
    
    const completed = DB.tasks.filter(t => t.completed).length;
    document.getElementById('completedTasks').textContent = completed;
    
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    let hours = 0;
    DB.schedule.forEach(s => {
        const sDate = new Date(s.date);
        if (sDate >= weekStart) {
            const start = parseInt(s.startTime.split(':')[0]);
            const end = parseInt(s.endTime.split(':')[0]);
            hours += (end - start);
        }
    });
    document.getElementById('totalHours').textContent = hours;
    
    updateUpcomingDeadlines();
    updateRecentActivity();
}

function updateUpcomingDeadlines() {
    const now = new Date();
    const upcoming = DB.tasks
        .filter(t => !t.completed && new Date(t.deadline) > now)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

    let html = upcoming.length ? '<h3 style="margin-bottom: 1rem;">Upcoming Deadlines</h3>' : 
        '<div class="empty-state"><div class="empty-icon">📅</div>No upcoming deadlines</div>';
    
    if (upcoming.length) {
        html += upcoming.map(task => {
            const subject = DB.subjects.find(s => s.id === task.subjectId);
            const days = Math.ceil((new Date(task.deadline) - now) / (1000*60*60*24));
            const urgency = days <= 1 ? 'badge-danger' : days <= 3 ? 'badge-warning' : 'badge-primary';
            return `
                <div class="card" style="margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 600;">${task.title}</div>
                            <div style="color: var(--text-sec); font-size: 0.85rem;">${subject?.name}</div>
                        </div>
                        <span class="badge ${urgency}">${days}d left</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('upcomingDeadlines').innerHTML = html;
}

function updateRecentActivity() {
    const html = DB.activity.length ? 
        `<h3>Recent Activity</h3><div style="color: var(--text-sec); font-size: 0.9rem;">
            ${DB.activity.slice(0, 5).map(a => `<div>• ${a.msg} (${timeAgo(a.time)})</div>`).join('')}
        </div>` :
        '<div class="empty-state">No activity yet</div>';
    document.getElementById('recentActivity').innerHTML = html;
}

function logActivity(msg) {
    DB.activity.unshift({ msg, time: Date.now() });
    if (DB.activity.length > 50) DB.activity.pop();
    saveData();
}

function updateSubjectsList() {
    if (!DB.subjects.length) {
        document.getElementById('subjectsList').innerHTML = 
            '<div class="empty-state"><div class="empty-icon">📚</div>No subjects yet</div>';
        return;
    }

    const grouped = { high: [], medium: [], low: [] };
    DB.subjects.forEach(s => grouped[s.priority].push(s));

    let html = '';
    Object.entries(grouped).forEach(([priority, subjects]) => {
        if (subjects.length) {
            html += `<h3 style="text-transform: capitalize; margin-top: 1.5rem;">${priority} Priority</h3>`;
            html += '<div class="grid">';
            subjects.forEach(s => {
                const tasks = DB.tasks.filter(t => t.subjectId === s.id && !t.completed).length;
                html += `
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <div style="font-weight: 600; color: ${s.color}; font-size: 1.1rem;">${s.name}</div>
                                ${s.code ? `<div style="font-size: 0.85rem; color: var(--text-sec);">${s.code}</div>` : ''}
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-small" onclick="deleteSubject(${s.id})" style="width: auto;">🗑️</button>
                            </div>
                        </div>
                        ${s.description ? `<p style="color: var(--text-sec); margin: 0.5rem 0; font-size: 0.9rem;">${s.description}</p>` : ''}
                        <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-sec);">
                            ${s.teacher ? `👨‍🏫 ${s.teacher} | ` : ''}${tasks} pending tasks
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
    });
    document.getElementById('subjectsList').innerHTML = html;
}

function updateTasksList() {
    const filter = document.getElementById('taskFilter').value;
    const now = new Date();
    let tasks = [...DB.tasks];

    if (filter === 'pending') tasks = tasks.filter(t => !t.completed && new Date(t.deadline) > now);
    else if (filter === 'completed') tasks = tasks.filter(t => t.completed);
    else if (filter === 'overdue') tasks = tasks.filter(t => !t.completed && new Date(t.deadline) <= now);

    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    if (!tasks.length) {
        document.getElementById('tasksList').innerHTML = 
            '<div class="empty-state"><div class="empty-icon">✓</div>No tasks</div>';
        return;
    }

    const html = `
        <table>
            <thead>
                <tr>
                    <th style="width: 50px;"></th>
                    <th>Task</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Deadline</th>
                    <th>Priority</th>
                    <th style="width: 80px;"></th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(t => {
                    const subject = DB.subjects.find(s => s.id === t.subjectId);
                    const isOverdue = !t.completed && new Date(t.deadline) < now;
                    const badgeClass = isOverdue ? 'badge-danger' : 
                                      t.priority === 'high' ? 'badge-warning' : 'badge-primary';
                    return `
                        <tr>
                            <td><input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})"></td>
                            <td style="text-decoration: ${t.completed ? 'line-through' : 'none'};">${t.title}</td>
                            <td>${subject?.name || 'Unknown'}</td>
                            <td><span class="badge badge-primary">${t.type}</span></td>
                            <td>${formatDate(new Date(t.deadline))}</td>
                            <td><span class="badge ${badgeClass}">${t.priority}</span></td>
                            <td><button class="btn btn-small" onclick="deleteTask(${t.id})" style="width: auto;">🗑️</button></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('tasksList').innerHTML = html;
}

function setScheduleDate() {
    const input = document.getElementById('scheduleDate');
    if (input) input.valueAsDate = new Date();
}

function updateScheduleView() {
    const dateStr = document.getElementById('scheduleDate').value;
    const scheduleDate = new Date(dateStr);
    const weekStart = new Date(scheduleDate);
    weekStart.setDate(scheduleDate.getDate() - scheduleDate.getDay());

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let html = '<div class="grid">';

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);
        const daySessions = DB.schedule.filter(s => {
            const sDate = new Date(s.date);
            return sDate.toDateString() === dayDate.toDateString();
        });

        html += `
            <div class="card">
                <h3>${days[i]}</h3>
                <div style="font-size: 0.85rem; color: var(--text-sec); margin-bottom: 1rem;">${formatDate(dayDate)}</div>
                ${daySessions.length ? daySessions.map(s => {
                    const subject = DB.subjects.find(sub => sub.id === s.subjectId);
                    return `
                        <div style="background: rgba(99, 102, 241, 0.1); padding: 0.75rem; border-left: 3px solid ${subject?.color}; margin-bottom: 0.5rem; border-radius: 0.25rem;">
                            <div style="font-weight: 600;">${subject?.name}</div>
                            <div style="font-size: 0.85rem; color: var(--text-sec); margin: 0.25rem 0;">🕐 ${s.startTime} - ${s.endTime}</div>
                            <div style="font-size: 0.8rem; color: var(--text-sec);">${s.type}</div>
                            <button class="btn btn-small" onclick="deleteSchedule(${s.id})" style="margin-top: 0.5rem; width: auto;">Delete</button>
                        </div>
                    `;
                }).join('') : '<div style="color: var(--text-sec); text-align: center; padding: 1rem;">No sessions</div>'}
            </div>
        `;
    }
    html += '</div>';
    document.getElementById('scheduleView').innerHTML = html;
}

function updateAnalytics() {
    let html = '<div class="grid">';
    
    // Subject Progress
    html += '<div class="card"><h3>Subject Progress</h3>';
    if (DB.subjects.length) {
        html += DB.subjects.map(s => {
            const tasks = DB.tasks.filter(t => t.subjectId === s.id);
            const completed = tasks.filter(t => t.completed).length;
            const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
            return `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>${s.name}</span>
                        <span style="color: var(--primary);">${completed}/${tasks.length}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%; background: ${s.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        html += '<div style="color: var(--text-sec);">No subjects yet</div>';
    }
    html += '</div>';

    // Time Distribution
    html += '<div class="card"><h3>Study Hours</h3>';
    const subjectHours = {};
    DB.schedule.forEach(s => {
        const subject = DB.subjects.find(sub => sub.id === s.subjectId);
        if (subject) {
            const start = parseInt(s.startTime.split(':')[0]);
            const end = parseInt(s.endTime.split(':')[0]);
            subjectHours[subject.name] = (subjectHours[subject.name] || 0) + (end - start);
        }
    });
    if (Object.keys(subjectHours).length) {
        html += Object.entries(subjectHours).map(([name, hours]) => `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>${name}</span>
                    <span style="color: #14b8a6; font-weight: 600;">${hours}h</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(hours * 10, 100)}%; background: #14b8a6;"></div>
                </div>
            </div>
        `).join('');
    } else {
        html += '<div style="color: var(--text-sec);">No schedule data</div>';
    }
    html += '</div></div>';

    document.getElementById('subjectProgress').parentElement.innerHTML = html;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    return mins < 60 ? `${mins}m` : hours < 24 ? `${hours}h` : `${days}d`;
}

function exportData() {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow-${Date.now()}.json`;
    a.click();
    logActivity('Exported data');
}

function resetData() {
    if (confirm('Delete ALL data? This cannot be undone!')) {
        localStorage.clear();
        location.reload();
    }
}