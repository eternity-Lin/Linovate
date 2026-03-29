const TimePlanner = {
    currentIdentity: 'worker',
    currentMode: 'work',
    currentView: 'dashboard',
    currentGoalType: 'work',
    currentPeriod: 'day',
    timer: null,
    timerDuration: 25 * 60,
    timerRemaining: 25 * 60,
    timerRunning: false,
    timerPaused: false,
    selectedFocusDuration: 25,
    
    identityConfig: {
        worker: {
            name: '上班族',
            icon: '💼',
            workLabel: '工作',
            lifeLabel: '生活',
            workMode: 'work',
            goalTypes: { work: '工作目标', growth: '成长目标', life: '生活目标' },
            cardTitle: { work: '今日待办', life: '今日计划' },
            statLabel: { work: '今日任务', life: '今日计划' }
        },
        entrepreneur: {
            name: '创业者',
            icon: '🚀',
            workLabel: '创业',
            lifeLabel: '生活',
            workMode: 'work',
            goalTypes: { work: '创业目标', growth: '成长目标', life: '生活目标' },
            cardTitle: { work: '今日待办', life: '今日计划' },
            statLabel: { work: '今日任务', life: '今日计划' }
        },
        student: {
            name: '学生党',
            icon: '📚',
            workLabel: '学习',
            lifeLabel: '生活',
            workMode: 'study',
            goalTypes: { work: '学习目标', growth: '成长目标', life: '生活目标' },
            cardTitle: { work: '今日学习', life: '今日计划' },
            statLabel: { work: '今日学习', life: '今日计划' }
        }
    },
    
    data: {
        tasks: [],
        goals: [],
        focusRecords: [],
        achievements: [],
        settings: {
            autoWorkTime: '09:00',
            autoLifeTime: '18:00',
            autoSwitchMode: false,
            enableNotify: true,
            notifyAdvance: 15,
            workdays: [1, 2, 3, 4, 5],
            identity: 'worker'
        },
        stats: {
            totalExp: 0,
            level: 1,
            streakDays: 0,
            lastActiveDate: null
        }
    },

    achievements: [
        { id: 'first_task', name: '初来乍到', desc: '完成第一个任务', icon: '🎯', condition: (d) => d.tasks.filter(t => t.status === 'completed').length >= 1 },
        { id: 'task_10', name: '任务达人', desc: '完成10个任务', icon: '📋', condition: (d) => d.tasks.filter(t => t.status === 'completed').length >= 10 },
        { id: 'task_50', name: '效率专家', desc: '完成50个任务', icon: '⚡', condition: (d) => d.tasks.filter(t => t.status === 'completed').length >= 50 },
        { id: 'first_goal', name: '目标启航', desc: '创建第一个目标', icon: '🚀', condition: (d) => d.goals.length >= 1 },
        { id: 'goal_complete', name: '目标达成', desc: '完成一个目标', icon: '🏆', condition: (d) => d.goals.filter(g => g.progress >= 100).length >= 1 },
        { id: 'focus_1h', name: '专注新手', desc: '累计专注1小时', icon: '⏰', condition: (d) => d.focusRecords.reduce((sum, r) => sum + r.duration, 0) >= 60 },
        { id: 'focus_10h', name: '专注达人', desc: '累计专注10小时', icon: '🔥', condition: (d) => d.focusRecords.reduce((sum, r) => sum + r.duration, 0) >= 600 },
        { id: 'streak_7', name: '坚持一周', desc: '连续使用7天', icon: '📅', condition: (d) => d.stats.streakDays >= 7 },
        { id: 'streak_30', name: '月度冠军', desc: '连续使用30天', icon: '👑', condition: (d) => d.stats.streakDays >= 30 },
        { id: 'level_5', name: '成长之路', desc: '达到5级', icon: '⭐', condition: (d) => d.stats.level >= 5 },
        { id: 'level_10', name: '规划大师', desc: '达到10级', icon: '🌟', condition: (d) => d.stats.level >= 10 },
        { id: 'early_bird', name: '早起鸟儿', desc: '在早上6点前开始专注', icon: '🐦', condition: (d) => d.focusRecords.some(r => new Date(r.startTime).getHours() < 6) }
    ],

    init() {
        this.loadData();
        this.bindEvents();
        this.updateTime();
        this.updateGreeting();
        this.checkAutoModeSwitch();
        this.updateIdentityUI();
        this.updateModeLabels();
        this.render();
        this.checkAchievements();
        
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkAutoModeSwitch(), 60000);
    },

    loadData() {
        const savedData = localStorage.getItem('timePlannerData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.data = { ...this.data, ...parsed };
                this.updateStreak();
            } catch (e) {
                console.error('Failed to load data:', e);
            }
        }
        
        if (this.data.settings.identity) {
            this.currentIdentity = this.data.settings.identity;
        }
        
        const savedMode = localStorage.getItem('timePlannerMode');
        if (savedMode) {
            this.currentMode = savedMode;
        }
        
        const savedTheme = localStorage.getItem('timePlannerTheme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('.theme-icon').textContent = '☀️';
        }
    },

    saveData() {
        localStorage.setItem('timePlannerData', JSON.stringify(this.data));
        localStorage.setItem('timePlannerMode', this.currentMode);
    },

    updateStreak() {
        const today = new Date().toDateString();
        const lastActive = this.data.stats.lastActiveDate;
        
        if (lastActive) {
            const lastDate = new Date(lastActive);
            const diffDays = Math.floor((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                this.data.stats.streakDays++;
            } else if (diffDays > 1) {
                this.data.stats.streakDays = 1;
            }
        } else {
            this.data.stats.streakDays = 1;
        }
        
        this.data.stats.lastActiveDate = today;
        this.saveData();
    },

    bindEvents() {
        document.querySelectorAll('.identity-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchIdentity(btn.dataset.identity));
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.switchView(item.dataset.view));
        });

        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());

        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('addTaskQuick').addEventListener('click', () => this.openTaskModal());
        document.getElementById('closeTaskModal').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('saveTaskBtn').addEventListener('click', () => this.saveTask());

        document.getElementById('addGoalBtn').addEventListener('click', () => this.openGoalModal());
        document.getElementById('closeGoalModal').addEventListener('click', () => this.closeGoalModal());
        document.getElementById('cancelGoalBtn').addEventListener('click', () => this.closeGoalModal());
        document.getElementById('saveGoalBtn').addEventListener('click', () => this.saveGoal());
        document.getElementById('addKrBtn').addEventListener('click', () => this.addKrInput());

        document.getElementById('taskRepeat').addEventListener('change', (e) => {
            document.getElementById('repeatOptions').classList.toggle('hidden', !e.target.checked);
        });

        document.querySelectorAll('.goal-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchGoalType(tab.dataset.type));
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterTasks(btn.dataset.filter));
        });

        document.getElementById('taskSort').addEventListener('change', () => this.renderTasks());

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedFocusDuration = parseInt(btn.dataset.duration);
                document.getElementById('focusDuration').value = this.selectedFocusDuration;
            });
        });

        document.getElementById('startQuickFocus').addEventListener('click', () => {
            this.switchView('focus');
        });

        document.getElementById('timerStart').addEventListener('click', () => this.startTimer());
        document.getElementById('timerPause').addEventListener('click', () => this.pauseTimer());
        document.getElementById('timerReset').addEventListener('click', () => this.resetTimer());

        document.getElementById('focusDuration').addEventListener('change', (e) => {
            this.timerDuration = parseInt(e.target.value) * 60;
            this.timerRemaining = this.timerDuration;
            this.updateTimerDisplay();
        });

        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.renderStats();
            });
        });

        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeSettings());
        
        document.getElementById('autoSwitchMode').addEventListener('change', (e) => {
            this.data.settings.autoSwitchMode = e.target.checked;
            this.saveData();
        });

        document.getElementById('autoWorkTime').addEventListener('change', (e) => {
            this.data.settings.autoWorkTime = e.target.value;
            this.saveData();
        });

        document.getElementById('autoLifeTime').addEventListener('change', (e) => {
            this.data.settings.autoLifeTime = e.target.value;
            this.saveData();
        });

        document.getElementById('enableNotify').addEventListener('change', (e) => {
            this.data.settings.enableNotify = e.target.checked;
            this.saveData();
        });

        document.getElementById('notifyAdvance').addEventListener('change', (e) => {
            this.data.settings.notifyAdvance = parseInt(e.target.value);
            this.saveData();
        });

        for (let i = 0; i <= 6; i++) {
            const checkbox = document.getElementById(`workday-${i}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateWorkdays();
                    this.renderWeeklyChart();
                });
            }
        }

        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clearData').addEventListener('click', () => this.clearData());

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            }
        });
    },

    switchIdentity(identity) {
        this.currentIdentity = identity;
        this.data.settings.identity = identity;
        this.saveData();
        
        this.updateIdentityUI();
        this.updateModeLabels();
        this.render();
        
        const config = this.identityConfig[identity];
        this.showNotification(`已切换为${config.name}模式`, config.icon);
    },

    updateIdentityUI() {
        document.querySelectorAll('.identity-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.identity === this.currentIdentity);
        });
    },

    updateModeLabels() {
        const config = this.identityConfig[this.currentIdentity];
        
        const workModeText = document.getElementById('workModeText');
        if (workModeText) {
            workModeText.textContent = config.workLabel;
        }
        
        const workModeBtn = document.getElementById('workModeBtn');
        if (workModeBtn) {
            workModeBtn.querySelector('.mode-text').textContent = config.workLabel;
        }
        
        const cardTitle = document.getElementById('todayCardTitle');
        if (cardTitle) {
            cardTitle.textContent = config.cardTitle[this.currentMode];
        }
        
        const statLabel = document.querySelector('.stat-item:first-child .stat-label');
        if (statLabel) {
            statLabel.textContent = config.statLabel[this.currentMode];
        }
        
        this.updateGoalTabs();
    },

    updateGoalTabs() {
        const config = this.identityConfig[this.currentIdentity];
        const goalTabs = document.querySelectorAll('.goal-tab');
        
        goalTabs.forEach(tab => {
            const type = tab.dataset.type;
            if (config.goalTypes[type]) {
                const textSpan = tab.querySelector('span:not(.goal-tab-icon)');
                if (textSpan) {
                    textSpan.textContent = config.goalTypes[type];
                }
            }
        });
    },

    switchMode(mode) {
        this.currentMode = mode;
        document.documentElement.setAttribute('data-mode', mode);
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        localStorage.setItem('timePlannerMode', mode);
        
        this.updateModeLabels();
        this.render();
    },

    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
        
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `${view}View`);
        });
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme === 'dark' ? 'dark' : '');
        document.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        localStorage.setItem('timePlannerTheme', newTheme);
    },

    checkAutoModeSwitch() {
        if (!this.data.settings.autoSwitchMode) return;
        
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (currentTime === this.data.settings.autoWorkTime) {
            this.switchMode('work');
            this.showNotification('已自动切换到工作模式', '💼');
        } else if (currentTime === this.data.settings.autoLifeTime) {
            this.switchMode('life');
            this.showNotification('已自动切换到生活成长模式', '🌱');
        }
    },

    updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('currentTime').textContent = timeStr;
    },

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '晚上好';
        
        if (hour < 6) greeting = '夜深了';
        else if (hour < 9) greeting = '早上好';
        else if (hour < 12) greeting = '上午好';
        else if (hour < 14) greeting = '中午好';
        else if (hour < 18) greeting = '下午好';
        else if (hour < 22) greeting = '晚上好';
        
        document.getElementById('greeting').textContent = greeting;
        
        const dateStr = new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        document.getElementById('dateDisplay').textContent = dateStr;
    },

    render() {
        this.renderDashboard();
        this.renderTasks();
        this.renderGoals();
        this.renderFocusStats();
        this.renderStats();
        this.renderAchievements();
        this.renderWeeklyChart();
        this.updateGoalSelect();
    },

    renderDashboard() {
        const today = new Date().toDateString();
        const isLifeMode = this.currentMode === 'life';
        const config = this.identityConfig[this.currentIdentity];
        
        const cardTitle = document.getElementById('todayCardTitle');
        const emptyText = document.getElementById('todayEmptyText');
        const emptyHint = document.getElementById('todayEmptyHint');
        const statLabel = document.querySelector('.stat-item:first-child .stat-label');
        
        if (cardTitle) {
            cardTitle.textContent = config.cardTitle[this.currentMode];
        }
        if (statLabel) {
            statLabel.textContent = config.statLabel[this.currentMode];
        }
        
        const todayTasks = this.data.tasks.filter(t => {
            const taskMode = t.mode || 'work';
            if (taskMode !== this.currentMode) return false;
            if (t.deadline) {
                return new Date(t.deadline).toDateString() === today;
            }
            return new Date(t.createdAt).toDateString() === today;
        });
        
        const completedToday = todayTasks.filter(t => t.status === 'completed');
        
        document.getElementById('todayTasks').textContent = todayTasks.length;
        document.getElementById('completedTasks').textContent = completedToday.length;
        
        const todayFocus = this.data.focusRecords.filter(r => 
            new Date(r.startTime).toDateString() === today
        );
        const totalFocusMinutes = todayFocus.reduce((sum, r) => sum + r.duration, 0);
        document.getElementById('focusTime').textContent = `${Math.floor(totalFocusMinutes / 60)}h`;
        
        const taskList = document.getElementById('todayTaskList');
        if (todayTasks.length === 0) {
            if (isLifeMode) {
                if (emptyText) emptyText.textContent = '暂无计划';
                if (emptyHint) emptyHint.textContent = '点击添加按钮创建新计划';
            } else {
                if (emptyText) emptyText.textContent = '暂无任务';
                if (emptyHint) emptyHint.textContent = '点击添加按钮创建新任务';
            }
        } else {
            taskList.innerHTML = todayTasks.slice(0, 5).map(task => this.renderTaskItem(task)).join('');
            this.bindTaskEvents();
        }
        
        this.renderGoalProgress();
    },

    renderTaskItem(task) {
        const priorityLabels = { high: '高', medium: '中', low: '低' };
        const deadlineStr = task.deadline ? this.formatDeadline(task.deadline) : '';
        
        return `
            <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" data-id="${task.id}"></div>
                <div class="task-info">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${priorityLabels[task.priority]}</span>
                        ${deadlineStr ? `<span class="task-tag">${deadlineStr}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    renderGoalProgress() {
        const goals = this.data.goals.filter(g => {
            if (this.currentMode === 'work') return g.type === 'work';
            return g.type === 'growth' || g.type === 'life';
        });
        
        const container = document.getElementById('goalProgressList');
        
        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🎯</span>
                    <p>暂无目标</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = goals.slice(0, 3).map(goal => `
            <div class="goal-progress-item">
                <div class="goal-progress-header">
                    <span class="goal-progress-title">${this.escapeHtml(goal.title)}</span>
                    <span class="goal-progress-value">${goal.progress || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
                </div>
            </div>
        `).join('');
    },

    renderTasks() {
        const sortBy = document.getElementById('taskSort').value;
        let tasks = [...this.data.tasks];
        
        tasks = tasks.filter(t => {
            const taskMode = t.mode || 'work';
            return taskMode === this.currentMode;
        });
        
        tasks.sort((a, b) => {
            if (sortBy === 'priority') {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            } else if (sortBy === 'deadline') {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            } else {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
        
        const pending = tasks.filter(t => t.status === 'pending');
        const inProgress = tasks.filter(t => t.status === 'in-progress');
        const completed = tasks.filter(t => t.status === 'completed');
        
        document.getElementById('pendingCount').textContent = pending.length;
        document.getElementById('inProgressCount').textContent = inProgress.length;
        document.getElementById('completedCount').textContent = completed.length;
        
        document.getElementById('pendingTasks').innerHTML = pending.length ? 
            pending.map(t => this.renderTaskCard(t)).join('') : 
            '<div class="empty-state"><p>暂无待办任务</p></div>';
            
        document.getElementById('inProgressTasks').innerHTML = inProgress.length ? 
            inProgress.map(t => this.renderTaskCard(t)).join('') : 
            '<div class="empty-state"><p>暂无进行中任务</p></div>';
            
        document.getElementById('completedTasks').innerHTML = completed.length ? 
            completed.map(t => this.renderTaskCard(t)).join('') : 
            '<div class="empty-state"><p>暂无已完成任务</p></div>';
        
        this.bindTaskCardEvents();
    },

    renderTaskCard(task) {
        const priorityLabels = { high: '高', medium: '中', low: '低' };
        const deadlineStr = task.deadline ? this.formatDeadline(task.deadline) : '';
        const isUrgent = task.deadline && new Date(task.deadline) < new Date();
        
        return `
            <div class="task-card" data-id="${task.id}">
                <div class="task-card-header">
                    <span class="task-card-title">${this.escapeHtml(task.title)}</span>
                    <div class="task-card-actions">
                        <button class="task-action-btn edit-task" data-id="${task.id}" title="编辑">✏️</button>
                        <button class="task-action-btn delete-task" data-id="${task.id}" title="删除">🗑️</button>
                    </div>
                </div>
                ${task.description ? `<div class="task-card-body"><p class="task-card-desc">${this.escapeHtml(task.description)}</p></div>` : ''}
                <div class="task-card-footer">
                    <span class="task-priority ${task.priority}">${priorityLabels[task.priority]}</span>
                    ${deadlineStr ? `<span class="task-deadline ${isUrgent ? 'urgent' : ''}">${deadlineStr}</span>` : ''}
                </div>
            </div>
        `;
    },

    bindTaskEvents() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTaskStatus(checkbox.dataset.id);
            });
        });
        
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openTaskModal(item.dataset.id);
            });
        });
    },

    bindTaskCardEvents() {
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('task-action-btn')) {
                    this.openTaskModal(card.dataset.id);
                }
            });
        });
        
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openTaskModal(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(btn.dataset.id);
            });
        });
    },

    openTaskModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('taskModalTitle');
        const form = document.getElementById('taskForm');
        
        form.reset();
        document.getElementById('repeatOptions').classList.add('hidden');
        
        if (taskId) {
            const task = this.data.tasks.find(t => t.id === taskId);
            if (task) {
                title.textContent = '编辑任务';
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDesc').value = task.description || '';
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskDeadline').value = task.deadline || '';
                document.getElementById('taskEstimate').value = task.estimate || '';
                document.getElementById('taskGoal').value = task.goalId || '';
                document.getElementById('taskTags').value = task.tags ? task.tags.join(', ') : '';
                document.getElementById('taskFragment').checked = task.isFragment || false;
                document.getElementById('taskRepeat').checked = task.isRepeat || false;
                if (task.isRepeat) {
                    document.getElementById('repeatOptions').classList.remove('hidden');
                    document.getElementById('repeatType').value = task.repeatType || 'daily';
                }
            }
        } else {
            title.textContent = '新建任务';
            document.getElementById('taskId').value = '';
        }
        
        modal.classList.add('active');
    },

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
    },

    saveTask() {
        const id = document.getElementById('taskId').value;
        const title = document.getElementById('taskTitle').value.trim();
        
        if (!title) {
            this.showNotification('请输入任务标题', '⚠️');
            return;
        }
        
        const taskData = {
            title,
            description: document.getElementById('taskDesc').value.trim(),
            priority: document.getElementById('taskPriority').value,
            deadline: document.getElementById('taskDeadline').value,
            estimate: parseInt(document.getElementById('taskEstimate').value) || null,
            goalId: document.getElementById('taskGoal').value || null,
            tags: document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t),
            isFragment: document.getElementById('taskFragment').checked,
            isRepeat: document.getElementById('taskRepeat').checked,
            repeatType: document.getElementById('taskRepeat').checked ? document.getElementById('repeatType').value : null,
            mode: this.currentMode
        };
        
        if (id) {
            const index = this.data.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                this.data.tasks[index] = { ...this.data.tasks[index], ...taskData, updatedAt: new Date().toISOString() };
            }
            this.showNotification('任务已更新', '✅');
        } else {
            const newTask = {
                id: this.generateId(),
                ...taskData,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.data.tasks.push(newTask);
            this.addExp(10);
            this.showNotification('任务已创建', '✅');
        }
        
        this.saveData();
        this.closeTaskModal();
        this.render();
        this.checkAchievements();
    },

    toggleTaskStatus(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (task.status === 'completed') {
            task.status = 'pending';
        } else {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            this.addExp(20);
            
            if (task.goalId) {
                this.updateGoalProgress(task.goalId);
            }
        }
        
        this.saveData();
        this.render();
        this.checkAchievements();
    },

    deleteTask(taskId) {
        if (confirm('确定要删除这个任务吗？')) {
            this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.render();
            this.showNotification('任务已删除', '🗑️');
        }
    },

    filterTasks(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        const columns = document.querySelectorAll('.task-column');
        
        if (filter === 'all') {
            columns.forEach(col => col.style.display = 'block');
        } else {
            columns.forEach(col => {
                const status = col.dataset.status;
                col.style.display = status === filter ? 'block' : 'none';
            });
        }
    },

    switchGoalType(type) {
        this.currentGoalType = type;
        
        document.querySelectorAll('.goal-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });
        
        this.renderGoals();
    },

    renderGoals() {
        const goals = this.data.goals.filter(g => g.type === this.currentGoalType);
        const container = document.getElementById('goalsList');
        
        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🎯</span>
                    <p>暂无目标，点击上方按钮创建</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = goals.map(goal => this.renderGoalCard(goal)).join('');
        this.bindGoalEvents();
    },

    renderGoalCard(goal) {
        const typeLabels = { work: '工作', growth: '成长', life: '生活' };
        const levelLabels = { yearly: '年度', quarterly: '季度', monthly: '月度', weekly: '周' };
        
        return `
            <div class="goal-card" data-id="${goal.id}">
                <div class="goal-card-header">
                    <div>
                        <h4 class="goal-card-title">${this.escapeHtml(goal.title)}</h4>
                        <div class="goal-card-meta">
                            <span class="goal-type-badge">${typeLabels[goal.type]}</span>
                            <span class="goal-level-badge">${levelLabels[goal.level]}</span>
                        </div>
                    </div>
                    <div class="goal-card-actions">
                        <button class="task-action-btn edit-goal" data-id="${goal.id}" title="编辑">✏️</button>
                        <button class="task-action-btn delete-goal" data-id="${goal.id}" title="删除">🗑️</button>
                    </div>
                </div>
                <div class="goal-progress-section">
                    <div class="goal-progress-info">
                        <span class="goal-progress-text">完成进度</span>
                        <span class="goal-progress-percent">${goal.progress || 0}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
                    </div>
                </div>
                ${goal.keyResults && goal.keyResults.length > 0 ? `
                    <div class="kr-list-card">
                        <h5>关键结果</h5>
                        ${goal.keyResults.map((kr, i) => `
                            <div class="kr-item-card">
                                <div class="kr-checkbox ${kr.completed ? 'checked' : ''}" data-goal="${goal.id}" data-kr="${i}"></div>
                                <span class="kr-text ${kr.completed ? 'completed' : ''}">${this.escapeHtml(kr.text)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    bindGoalEvents() {
        document.querySelectorAll('.edit-goal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openGoalModal(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-goal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteGoal(btn.dataset.id);
            });
        });
        
        document.querySelectorAll('.kr-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleKr(checkbox.dataset.goal, parseInt(checkbox.dataset.kr));
            });
        });
    },

    openGoalModal(goalId = null) {
        const modal = document.getElementById('goalModal');
        const title = document.getElementById('goalModalTitle');
        const form = document.getElementById('goalForm');
        
        form.reset();
        document.getElementById('krList').innerHTML = `
            <div class="kr-item">
                <input type="text" class="kr-input" placeholder="输入关键结果">
                <button type="button" class="btn-remove-kr">&times;</button>
            </div>
        `;
        this.bindKrEvents();
        
        if (goalId) {
            const goal = this.data.goals.find(g => g.id === goalId);
            if (goal) {
                title.textContent = '编辑目标';
                document.getElementById('goalId').value = goal.id;
                document.getElementById('goalTitle').value = goal.title;
                document.getElementById('goalType').value = goal.type;
                document.getElementById('goalLevel').value = goal.level;
                document.getElementById('goalStart').value = goal.startDate || '';
                document.getElementById('goalEnd').value = goal.endDate || '';
                document.getElementById('goalDesc').value = goal.description || '';
                
                if (goal.keyResults && goal.keyResults.length > 0) {
                    document.getElementById('krList').innerHTML = goal.keyResults.map(kr => `
                        <div class="kr-item">
                            <input type="text" class="kr-input" value="${this.escapeHtml(kr.text)}" placeholder="输入关键结果">
                            <button type="button" class="btn-remove-kr">&times;</button>
                        </div>
                    `).join('');
                    this.bindKrEvents();
                }
            }
        } else {
            title.textContent = '新建目标';
            document.getElementById('goalId').value = '';
            document.getElementById('goalType').value = this.currentGoalType;
        }
        
        modal.classList.add('active');
    },

    closeGoalModal() {
        document.getElementById('goalModal').classList.remove('active');
    },

    addKrInput() {
        const krList = document.getElementById('krList');
        const krItem = document.createElement('div');
        krItem.className = 'kr-item';
        krItem.innerHTML = `
            <input type="text" class="kr-input" placeholder="输入关键结果">
            <button type="button" class="btn-remove-kr">&times;</button>
        `;
        krList.appendChild(krItem);
        this.bindKrEvents();
    },

    bindKrEvents() {
        document.querySelectorAll('.btn-remove-kr').forEach(btn => {
            btn.onclick = () => {
                const krList = document.getElementById('krList');
                if (krList.children.length > 1) {
                    btn.parentElement.remove();
                }
            };
        });
    },

    saveGoal() {
        const id = document.getElementById('goalId').value;
        const title = document.getElementById('goalTitle').value.trim();
        
        if (!title) {
            this.showNotification('请输入目标标题', '⚠️');
            return;
        }
        
        const krInputs = document.querySelectorAll('.kr-input');
        const keyResults = Array.from(krInputs)
            .map(input => ({ text: input.value.trim(), completed: false }))
            .filter(kr => kr.text);
        
        const goalData = {
            title,
            type: document.getElementById('goalType').value,
            level: document.getElementById('goalLevel').value,
            startDate: document.getElementById('goalStart').value,
            endDate: document.getElementById('goalEnd').value,
            description: document.getElementById('goalDesc').value.trim(),
            keyResults
        };
        
        if (id) {
            const index = this.data.goals.findIndex(g => g.id === id);
            if (index !== -1) {
                const existing = this.data.goals[index];
                goalData.progress = existing.progress;
                goalData.keyResults = keyResults.map((kr, i) => ({
                    ...kr,
                    completed: existing.keyResults && existing.keyResults[i] ? existing.keyResults[i].completed : false
                }));
                this.data.goals[index] = { ...existing, ...goalData, updatedAt: new Date().toISOString() };
            }
            this.showNotification('目标已更新', '✅');
        } else {
            const newGoal = {
                id: this.generateId(),
                ...goalData,
                progress: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.data.goals.push(newGoal);
            this.addExp(30);
            this.showNotification('目标已创建', '✅');
        }
        
        this.saveData();
        this.closeGoalModal();
        this.render();
        this.checkAchievements();
    },

    deleteGoal(goalId) {
        if (confirm('确定要删除这个目标吗？')) {
            this.data.goals = this.data.goals.filter(g => g.id !== goalId);
            this.saveData();
            this.render();
            this.showNotification('目标已删除', '🗑️');
        }
    },

    toggleKr(goalId, krIndex) {
        const goal = this.data.goals.find(g => g.id === goalId);
        if (!goal || !goal.keyResults[krIndex]) return;
        
        goal.keyResults[krIndex].completed = !goal.keyResults[krIndex].completed;
        this.updateGoalProgress(goalId);
        this.saveData();
        this.render();
        this.checkAchievements();
    },

    updateGoalProgress(goalId) {
        const goal = this.data.goals.find(g => g.id === goalId);
        if (!goal || !goal.keyResults || goal.keyResults.length === 0) return;
        
        const completed = goal.keyResults.filter(kr => kr.completed).length;
        goal.progress = Math.round((completed / goal.keyResults.length) * 100);
        
        if (goal.progress === 100 && !goal.completedAt) {
            goal.completedAt = new Date().toISOString();
            this.addExp(100);
            this.showNotification('恭喜！目标已达成！', '🎉');
        }
    },

    updateGoalSelect() {
        const select = document.getElementById('taskGoal');
        const goals = this.data.goals.filter(g => {
            if (this.currentMode === 'work') return g.type === 'work';
            return g.type === 'growth' || g.type === 'life';
        });
        
        select.innerHTML = '<option value="">无关联目标</option>' + 
            goals.map(g => `<option value="${g.id}">${this.escapeHtml(g.title)}</option>`).join('');
        
        const focusSelect = document.getElementById('focusTaskSelect');
        const tasks = this.data.tasks.filter(t => t.status !== 'completed');
        focusSelect.innerHTML = '<option value="">选择关联任务（可选）</option>' + 
            tasks.map(t => `<option value="${t.id}">${this.escapeHtml(t.title)}</option>`).join('');
    },

    startTimer() {
        if (this.timerRunning && !this.timerPaused) return;
        
        if (!this.timerPaused) {
            this.timerDuration = parseInt(document.getElementById('focusDuration').value) * 60;
            this.timerRemaining = this.timerDuration;
        }
        
        this.timerRunning = true;
        this.timerPaused = false;
        
        document.getElementById('timerStart').disabled = true;
        document.getElementById('timerPause').disabled = false;
        document.getElementById('timerReset').disabled = false;
        document.getElementById('timerLabel').textContent = '专注中...';
        
        this.timer = setInterval(() => {
            this.timerRemaining--;
            this.updateTimerDisplay();
            
            if (this.timerRemaining <= 0) {
                this.completeTimer();
            }
        }, 1000);
    },

    pauseTimer() {
        if (!this.timerRunning) return;
        
        clearInterval(this.timer);
        this.timerPaused = true;
        this.timerRunning = false;
        
        document.getElementById('timerStart').disabled = false;
        document.getElementById('timerPause').disabled = true;
        document.getElementById('timerLabel').textContent = '已暂停';
    },

    resetTimer() {
        clearInterval(this.timer);
        this.timerRunning = false;
        this.timerPaused = false;
        this.timerDuration = parseInt(document.getElementById('focusDuration').value) * 60;
        this.timerRemaining = this.timerDuration;
        
        document.getElementById('timerStart').disabled = false;
        document.getElementById('timerPause').disabled = true;
        document.getElementById('timerReset').disabled = true;
        document.getElementById('timerLabel').textContent = '专注时间';
        
        this.updateTimerDisplay();
    },

    completeTimer() {
        clearInterval(this.timer);
        this.timerRunning = false;
        this.timerPaused = false;
        
        const duration = Math.round((this.timerDuration - this.timerRemaining) / 60);
        const taskId = document.getElementById('focusTaskSelect').value;
        
        const record = {
            id: this.generateId(),
            startTime: new Date(Date.now() - duration * 60000).toISOString(),
            endTime: new Date().toISOString(),
            duration,
            taskId: taskId || null,
            mode: this.currentMode
        };
        
        this.data.focusRecords.push(record);
        this.addExp(duration * 2);
        
        this.saveData();
        this.render();
        this.checkAchievements();
        
        this.showNotification(`专注完成！本次专注 ${duration} 分钟`, '🎉');
        
        if (this.data.settings.enableNotify && Notification.permission === 'granted') {
            new Notification('专注完成', { body: `本次专注 ${duration} 分钟，休息一下吧！` });
        }
        
        this.resetTimer();
    },

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerRemaining / 60);
        const seconds = this.timerRemaining % 60;
        
        document.getElementById('timerDisplay').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const progress = document.getElementById('timerProgress');
        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - this.timerRemaining / this.timerDuration);
        progress.style.strokeDashoffset = offset;
    },

    renderFocusStats() {
        const today = new Date().toDateString();
        const todayRecords = this.data.focusRecords.filter(r => 
            new Date(r.startTime).toDateString() === today
        );
        
        const totalMinutes = todayRecords.reduce((sum, r) => sum + r.duration, 0);
        const maxDuration = Math.max(...todayRecords.map(r => r.duration), 0);
        
        document.getElementById('todayFocusCount').textContent = todayRecords.length;
        document.getElementById('todayFocusDuration').textContent = `${totalMinutes}分钟`;
        document.getElementById('maxFocusDuration').textContent = `${maxDuration}分钟`;
    },

    renderStats() {
        const now = new Date();
        let startDate;
        
        switch (this.currentPeriod) {
            case 'day':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }
        
        const tasks = this.data.tasks.filter(t => new Date(t.createdAt) >= startDate);
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const completionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
        
        document.getElementById('statTotalTasks').textContent = tasks.length;
        document.getElementById('statCompletedTasks').textContent = completedTasks.length;
        document.getElementById('statCompletionRate').textContent = `${completionRate}%`;
        
        const focusRecords = this.data.focusRecords.filter(r => new Date(r.startTime) >= startDate);
        const totalFocus = focusRecords.reduce((sum, r) => sum + r.duration, 0);
        const avgFocus = focusRecords.length ? Math.round(totalFocus / focusRecords.length) : 0;
        
        document.getElementById('statTotalFocus').textContent = `${Math.floor(totalFocus / 60)}h`;
        document.getElementById('statFocusCount').textContent = focusRecords.length;
        document.getElementById('statAvgFocus').textContent = `${avgFocus}min`;
    },

    renderAchievements() {
        const level = this.data.stats.level;
        const exp = this.data.stats.totalExp;
        const expForLevel = level * 100;
        const expInCurrentLevel = exp % 100;
        
        document.querySelector('.level-number').textContent = level;
        document.getElementById('expFill').style.width = `${expInCurrentLevel}%`;
        document.getElementById('expText').textContent = `${expInCurrentLevel}/${expForLevel} 经验`;
        
        const levelTitles = ['新手规划师', '初级规划师', '中级规划师', '高级规划师', '规划专家', '规划大师', '时间管理大师', '效率专家', '时间领主', '规划之神'];
        document.querySelector('.level-title').textContent = levelTitles[Math.min(level - 1, levelTitles.length - 1)];
        
        const grid = document.getElementById('achievementsGrid');
        grid.innerHTML = this.achievements.map(achievement => {
            const unlocked = this.data.achievements.includes(achievement.id);
            return `
                <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                    ${unlocked ? '<div class="achievement-progress">已解锁</div>' : '<div class="achievement-progress">未解锁</div>'}
                </div>
            `;
        }).join('');
    },

    checkAchievements() {
        let newAchievements = [];
        
        this.achievements.forEach(achievement => {
            if (!this.data.achievements.includes(achievement.id) && achievement.condition(this.data)) {
                this.data.achievements.push(achievement.id);
                newAchievements.push(achievement);
            }
        });
        
        if (newAchievements.length > 0) {
            this.saveData();
            newAchievements.forEach(a => {
                this.showNotification(`解锁成就：${a.name}`, a.icon);
                this.addExp(50);
            });
        }
    },

    addExp(amount) {
        this.data.stats.totalExp += amount;
        const newLevel = Math.floor(this.data.stats.totalExp / 100) + 1;
        
        if (newLevel > this.data.stats.level) {
            this.data.stats.level = newLevel;
            this.showNotification(`升级了！当前等级：${newLevel}`, '⭐');
        }
        
        this.saveData();
    },

    openSettings() {
        const modal = document.getElementById('settingsModal');
        
        document.getElementById('autoWorkTime').value = this.data.settings.autoWorkTime;
        document.getElementById('autoLifeTime').value = this.data.settings.autoLifeTime;
        document.getElementById('autoSwitchMode').checked = this.data.settings.autoSwitchMode;
        document.getElementById('enableNotify').checked = this.data.settings.enableNotify;
        document.getElementById('notifyAdvance').value = this.data.settings.notifyAdvance;
        
        const workdays = this.data.settings.workdays || [1, 2, 3, 4, 5];
        for (let i = 0; i <= 6; i++) {
            const checkbox = document.getElementById(`workday-${i}`);
            if (checkbox) {
                checkbox.checked = workdays.includes(i);
            }
        }
        
        modal.classList.add('active');
    },

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    },

    exportData() {
        const format = document.getElementById('exportFormat').value;
        const dateStr = new Date().toISOString().split('T')[0];
        
        switch (format) {
            case 'csv':
                this.exportToCSV(dateStr);
                break;
            case 'excel':
                this.exportToExcel(dateStr);
                break;
            case 'json':
            default:
                this.exportToJSON(dateStr);
                break;
        }
    },

    exportToJSON(dateStr) {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        this.downloadFile(blob, `time-planner-backup-${dateStr}.json`);
        this.showNotification('数据已导出为 JSON 格式', '📤');
    },

    exportToCSV(dateStr) {
        const csvContent = this.generateCSV();
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
        this.downloadFile(blob, `time-planner-data-${dateStr}.csv`);
        this.showNotification('数据已导出为 CSV 格式', '📊');
    },

    exportToExcel(dateStr) {
        const workbook = this.generateExcelWorkbook();
        const excelBuffer = this.arrayToExcelBuffer(workbook);
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        this.downloadFile(blob, `time-planner-data-${dateStr}.xlsx`);
        this.showNotification('数据已导出为 Excel 格式', '📗');
    },

    generateCSV() {
        let csv = '';
        
        csv += '【任务数据】\n';
        csv += 'ID,标题,描述,状态,优先级,截止时间,预估耗时(分钟),标签,模式,创建时间,完成时间\n';
        this.data.tasks.forEach(task => {
            csv += [
                task.id || '',
                this.escapeCSV(task.title) || '',
                this.escapeCSV(task.description) || '',
                task.status || 'pending',
                task.priority || 'medium',
                task.deadline || '',
                task.estimate || '',
                this.escapeCSV((task.tags || []).join(';')) || '',
                task.mode || 'work',
                task.createdAt || '',
                task.completedAt || ''
            ].join(',') + '\n';
        });
        
        csv += '\n【目标数据】\n';
        csv += 'ID,标题,类型,层级,进度,开始日期,结束日期,描述,创建时间\n';
        this.data.goals.forEach(goal => {
            csv += [
                goal.id || '',
                this.escapeCSV(goal.title) || '',
                goal.type || 'work',
                goal.level || 'monthly',
                goal.progress || 0,
                goal.startDate || '',
                goal.endDate || '',
                this.escapeCSV(goal.description) || '',
                goal.createdAt || ''
            ].join(',') + '\n';
        });
        
        csv += '\n【专注记录】\n';
        csv += 'ID,开始时间,结束时间,时长(分钟),关联任务ID,模式\n';
        this.data.focusRecords.forEach(record => {
            csv += [
                record.id || '',
                record.startTime || '',
                record.endTime || '',
                record.duration || 0,
                record.taskId || '',
                record.mode || 'work'
            ].join(',') + '\n';
        });
        
        csv += '\n【统计数据】\n';
        csv += '总经验值,等级,连续天数,最后活跃日期\n';
        csv += [
            this.data.stats.totalExp || 0,
            this.data.stats.level || 1,
            this.data.stats.streakDays || 0,
            this.data.stats.lastActiveDate || ''
        ].join(',') + '\n';
        
        return csv;
    },

    generateExcelWorkbook() {
        const sheets = [];
        
        const taskHeaders = ['ID', '标题', '描述', '状态', '优先级', '截止时间', '预估耗时(分钟)', '标签', '模式', '创建时间', '完成时间'];
        const taskData = this.data.tasks.map(task => [
            task.id || '',
            task.title || '',
            task.description || '',
            this.getStatusText(task.status),
            this.getPriorityText(task.priority),
            task.deadline || '',
            task.estimate || '',
            (task.tags || []).join('; '),
            task.mode === 'life' ? '生活' : '工作',
            task.createdAt || '',
            task.completedAt || ''
        ]);
        sheets.push({ name: '任务', headers: taskHeaders, data: taskData });
        
        const goalHeaders = ['ID', '标题', '类型', '层级', '进度(%)', '关键结果数', '已完成KR', '开始日期', '结束日期', '描述', '创建时间'];
        const goalData = this.data.goals.map(goal => [
            goal.id || '',
            goal.title || '',
            this.getGoalTypeText(goal.type),
            this.getGoalLevelText(goal.level),
            goal.progress || 0,
            (goal.keyResults || []).length,
            (goal.keyResults || []).filter(kr => kr.completed).length,
            goal.startDate || '',
            goal.endDate || '',
            goal.description || '',
            goal.createdAt || ''
        ]);
        sheets.push({ name: '目标', headers: goalHeaders, data: goalData });
        
        const focusHeaders = ['ID', '开始时间', '结束时间', '时长(分钟)', '关联任务', '模式'];
        const focusData = this.data.focusRecords.map(record => {
            const task = this.data.tasks.find(t => t.id === record.taskId);
            return [
                record.id || '',
                record.startTime || '',
                record.endTime || '',
                record.duration || 0,
                task ? task.title : '',
                record.mode === 'life' ? '生活' : '工作'
            ];
        });
        sheets.push({ name: '专注记录', headers: focusHeaders, data: focusData });
        
        const statsHeaders = ['统计项', '数值'];
        const statsData = [
            ['总经验值', this.data.stats.totalExp || 0],
            ['当前等级', this.data.stats.level || 1],
            ['连续使用天数', this.data.stats.streakDays || 0],
            ['最后活跃日期', this.data.stats.lastActiveDate || ''],
            ['总任务数', this.data.tasks.length],
            ['已完成任务', this.data.tasks.filter(t => t.status === 'completed').length],
            ['总目标数', this.data.goals.length],
            ['已完成目标', this.data.goals.filter(g => g.progress >= 100).length],
            ['总专注次数', this.data.focusRecords.length],
            ['总专注时长(分钟)', this.data.focusRecords.reduce((sum, r) => sum + (r.duration || 0), 0)]
        ];
        sheets.push({ name: '统计概览', headers: statsHeaders, data: statsData });
        
        return sheets;
    },

    arrayToExcelBuffer(sheets) {
        const xmlStrings = [];
        
        xmlStrings.push('<?xml version="1.0" encoding="UTF-8"?>\n');
        xmlStrings.push('<?mso-application progid="Excel.Sheet"?>\n');
        xmlStrings.push('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ');
        xmlStrings.push('xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n');
        
        sheets.forEach(sheet => {
            xmlStrings.push(`<Worksheet ss:Name="${this.escapeXML(sheet.name)}">\n`);
            xmlStrings.push('<Table>\n');
            
            xmlStrings.push('<Row>\n');
            sheet.headers.forEach(header => {
                xmlStrings.push(`<Cell><Data ss:Type="String">${this.escapeXML(header)}</Data></Cell>\n`);
            });
            xmlStrings.push('</Row>\n');
            
            sheet.data.forEach(row => {
                xmlStrings.push('<Row>\n');
                row.forEach((cell, index) => {
                    const type = typeof cell === 'number' ? 'Number' : 'String';
                    const value = typeof cell === 'number' ? cell : this.escapeXML(String(cell || ''));
                    xmlStrings.push(`<Cell><Data ss:Type="${type}">${value}</Data></Cell>\n`);
                });
                xmlStrings.push('</Row>\n');
            });
            
            xmlStrings.push('</Table>\n');
            xmlStrings.push('</Worksheet>\n');
        });
        
        xmlStrings.push('</Workbook>');
        
        const encoder = new TextEncoder('utf-8');
        return encoder.encode(xmlStrings.join(''));
    },

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    escapeCSV(str) {
        if (!str) return '';
        str = String(str);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    },

    escapeXML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    getStatusText(status) {
        const statusMap = {
            'pending': '待办',
            'in-progress': '进行中',
            'completed': '已完成'
        };
        return statusMap[status] || status;
    },

    getPriorityText(priority) {
        const priorityMap = {
            'high': '高',
            'medium': '中',
            'low': '低'
        };
        return priorityMap[priority] || priority;
    },

    getGoalTypeText(type) {
        const typeMap = {
            'work': '工作',
            'growth': '成长',
            'life': '生活'
        };
        return typeMap[type] || type;
    },

    getGoalLevelText(level) {
        const levelMap = {
            'yearly': '年度',
            'quarterly': '季度',
            'monthly': '月度',
            'weekly': '周'
        };
        return levelMap[level] || level;
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileName = file.name.toLowerCase();
        const reader = new FileReader();
        
        if (fileName.endsWith('.json')) {
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    this.data = { ...this.data, ...imported };
                    this.saveData();
                    this.render();
                    this.renderWeeklyChart();
                    this.showNotification('JSON 数据已导入', '📥');
                } catch (err) {
                    this.showNotification('导入失败：JSON 格式错误', '❌');
                }
            };
            reader.readAsText(file);
        } else if (fileName.endsWith('.csv')) {
            reader.onload = (e) => {
                try {
                    this.importFromCSV(e.target.result);
                    this.saveData();
                    this.render();
                    this.renderWeeklyChart();
                    this.showNotification('CSV 数据已导入', '📊');
                } catch (err) {
                    this.showNotification('导入失败：CSV 格式错误', '❌');
                }
            };
            reader.readAsText(file);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            reader.onload = (e) => {
                try {
                    this.importFromExcel(e.target.result);
                    this.saveData();
                    this.render();
                    this.renderWeeklyChart();
                    this.showNotification('Excel 数据已导入', '📗');
                } catch (err) {
                    this.showNotification('导入失败：Excel 格式错误', '❌');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            this.showNotification('不支持的文件格式', '❌');
        }
        
        event.target.value = '';
    },

    importFromCSV(csvContent) {
        const lines = csvContent.split('\n');
        let currentSection = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes('【任务数据】')) {
                currentSection = 'tasks';
                i++;
                continue;
            } else if (line.includes('【目标数据】')) {
                currentSection = 'goals';
                i++;
                continue;
            } else if (line.includes('【专注记录】')) {
                currentSection = 'focus';
                i++;
                continue;
            } else if (line.includes('【统计数据】')) {
                currentSection = 'stats';
                i++;
                continue;
            }
            
            if (!line || line.includes('ID,') || line.includes('统计项')) continue;
            
            const values = this.parseCSVLine(line);
            
            if (currentSection === 'tasks' && values.length >= 10) {
                const task = {
                    id: values[0] || this.generateId(),
                    title: values[1] || '',
                    description: values[2] || '',
                    status: values[3] || 'pending',
                    priority: values[4] || 'medium',
                    deadline: values[5] || '',
                    estimate: values[6] ? parseInt(values[6]) : null,
                    tags: values[7] ? values[7].split(';').map(t => t.trim()).filter(t => t) : [],
                    mode: values[8] || 'work',
                    createdAt: values[9] || new Date().toISOString(),
                    completedAt: values[10] || null,
                    updatedAt: new Date().toISOString()
                };
                
                const existingIndex = this.data.tasks.findIndex(t => t.id === task.id);
                if (existingIndex === -1) {
                    this.data.tasks.push(task);
                }
            } else if (currentSection === 'goals' && values.length >= 9) {
                const goal = {
                    id: values[0] || this.generateId(),
                    title: values[1] || '',
                    type: values[2] || 'work',
                    level: values[3] || 'monthly',
                    progress: parseInt(values[4]) || 0,
                    startDate: values[6] || '',
                    endDate: values[7] || '',
                    description: values[8] || '',
                    keyResults: [],
                    createdAt: values[9] || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                const existingIndex = this.data.goals.findIndex(g => g.id === goal.id);
                if (existingIndex === -1) {
                    this.data.goals.push(goal);
                }
            } else if (currentSection === 'focus' && values.length >= 5) {
                const record = {
                    id: values[0] || this.generateId(),
                    startTime: values[1] || '',
                    endTime: values[2] || '',
                    duration: parseInt(values[3]) || 0,
                    taskId: values[4] || null,
                    mode: values[5] || 'work'
                };
                
                const existingIndex = this.data.focusRecords.findIndex(r => r.id === record.id);
                if (existingIndex === -1) {
                    this.data.focusRecords.push(record);
                }
            }
        }
    },

    importFromExcel(arrayBuffer) {
        const decoder = new TextDecoder('utf-8');
        const xmlContent = decoder.decode(arrayBuffer);
        
        const taskMatches = xmlContent.match(/<Worksheet[^>]*Name="任务"[^>]*>([\s\S]*?)<\/Worksheet>/);
        const goalMatches = xmlContent.match(/<Worksheet[^>]*Name="目标"[^>]*>([\s\S]*?)<\/Worksheet>/);
        const focusMatches = xmlContent.match(/<Worksheet[^>]*Name="专注记录"[^>]*>([\s\S]*?)<\/Worksheet>/);
        
        if (taskMatches) {
            this.parseExcelRows(taskMatches[1], 'tasks');
        }
        if (goalMatches) {
            this.parseExcelRows(goalMatches[1], 'goals');
        }
        if (focusMatches) {
            this.parseExcelRows(focusMatches[1], 'focus');
        }
    },

    parseExcelRows(tableContent, section) {
        const rowMatches = tableContent.match(/<Row>([\s\S]*?)<\/Row>/g);
        if (!rowMatches || rowMatches.length <= 1) return;
        
        for (let i = 1; i < rowMatches.length; i++) {
            const cellMatches = rowMatches[i].match(/<Data[^>]*>([^<]*)<\/Data>/g);
            if (!cellMatches) continue;
            
            const values = cellMatches.map(cell => {
                const match = cell.match(/<Data[^>]*>([^<]*)<\/Data>/);
                return match ? match[1] : '';
            });
            
            if (section === 'tasks' && values.length >= 10) {
                const statusMap = { '待办': 'pending', '进行中': 'in-progress', '已完成': 'completed' };
                const priorityMap = { '高': 'high', '中': 'medium', '低': 'low' };
                
                const task = {
                    id: values[0] || this.generateId(),
                    title: values[1] || '',
                    description: values[2] || '',
                    status: statusMap[values[3]] || values[3] || 'pending',
                    priority: priorityMap[values[4]] || values[4] || 'medium',
                    deadline: values[5] || '',
                    estimate: values[6] ? parseInt(values[6]) : null,
                    tags: values[7] ? values[7].split(';').map(t => t.trim()).filter(t => t) : [],
                    mode: values[8] === '生活' ? 'life' : 'work',
                    createdAt: values[9] || new Date().toISOString(),
                    completedAt: values[10] || null,
                    updatedAt: new Date().toISOString()
                };
                
                const existingIndex = this.data.tasks.findIndex(t => t.id === task.id);
                if (existingIndex === -1) {
                    this.data.tasks.push(task);
                }
            } else if (section === 'goals' && values.length >= 9) {
                const typeMap = { '工作': 'work', '成长': 'growth', '生活': 'life' };
                const levelMap = { '年度': 'yearly', '季度': 'quarterly', '月度': 'monthly', '周': 'weekly' };
                
                const goal = {
                    id: values[0] || this.generateId(),
                    title: values[1] || '',
                    type: typeMap[values[2]] || values[2] || 'work',
                    level: levelMap[values[3]] || values[3] || 'monthly',
                    progress: parseInt(values[4]) || 0,
                    startDate: values[7] || '',
                    endDate: values[8] || '',
                    description: values[9] || '',
                    keyResults: [],
                    createdAt: values[10] || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                const existingIndex = this.data.goals.findIndex(g => g.id === goal.id);
                if (existingIndex === -1) {
                    this.data.goals.push(goal);
                }
            } else if (section === 'focus' && values.length >= 4) {
                const record = {
                    id: values[0] || this.generateId(),
                    startTime: values[1] || '',
                    endTime: values[2] || '',
                    duration: parseInt(values[3]) || 0,
                    taskId: null,
                    mode: values[5] === '生活' ? 'life' : 'work'
                };
                
                const existingIndex = this.data.focusRecords.findIndex(r => r.id === record.id);
                if (existingIndex === -1) {
                    this.data.focusRecords.push(record);
                }
            }
        }
    },

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    },

    clearData() {
        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            localStorage.removeItem('timePlannerData');
            this.data = {
                tasks: [],
                goals: [],
                focusRecords: [],
                achievements: [],
                settings: {
                    autoWorkTime: '09:00',
                    autoLifeTime: '18:00',
                    autoSwitchMode: false,
                    enableNotify: true,
                    notifyAdvance: 15,
                    workdays: [1, 2, 3, 4, 5]
                },
                stats: {
                    totalExp: 0,
                    level: 1,
                    streakDays: 0,
                    lastActiveDate: null
                }
            };
            this.render();
            this.showNotification('数据已清除', '🗑️');
        }
    },

    updateWorkdays() {
        const workdays = [];
        for (let i = 0; i <= 6; i++) {
            const checkbox = document.getElementById(`workday-${i}`);
            if (checkbox && checkbox.checked) {
                workdays.push(i);
            }
        }
        this.data.settings.workdays = workdays;
        this.saveData();
    },

    isWorkday(dayOfWeek) {
        const workdays = this.data.settings.workdays || [1, 2, 3, 4, 5];
        return workdays.includes(dayOfWeek);
    },

    renderWeeklyChart() {
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) return;
        
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const today = new Date().getDay();
        
        const weekData = this.getWeeklyData();
        const weekDetails = this.getWeeklyDetails();
        
        chartContainer.innerHTML = days.map((day, index) => {
            const isWorkday = this.isWorkday(index);
            const isToday = index === today;
            const height = weekData[index] || 0;
            const details = weekDetails[index] || { tasks: [], focusMinutes: 0, completedTasks: 0 };
            
            return `
                <div class="chart-bar ${!isWorkday ? 'weekend' : ''} ${isToday ? 'today' : ''}" 
                     data-day="${day}"
                     data-day-index="${index}"
                     style="--height: ${Math.max(height, 5)}%">
                    <div class="bar-fill"></div>
                    <span class="bar-label">${day}</span>
                    <div class="chart-tooltip">
                        <div class="tooltip-header">
                            <span class="tooltip-date">${this.getWeekDate(index)}</span>
                            ${isToday ? '<span class="tooltip-today">今天</span>' : ''}
                        </div>
                        <div class="tooltip-content">
                            <div class="tooltip-stat">
                                <span class="tooltip-icon">⏱️</span>
                                <span class="tooltip-label">专注时长</span>
                                <span class="tooltip-value">${this.formatDuration(details.focusMinutes)}</span>
                            </div>
                            <div class="tooltip-stat">
                                <span class="tooltip-icon">📋</span>
                                <span class="tooltip-label">任务数</span>
                                <span class="tooltip-value">${details.tasks.length}个</span>
                            </div>
                            <div class="tooltip-stat">
                                <span class="tooltip-icon">✅</span>
                                <span class="tooltip-label">已完成</span>
                                <span class="tooltip-value">${details.completedTasks}个</span>
                            </div>
                            ${details.tasks.length > 0 ? `
                                <div class="tooltip-tasks">
                                    <div class="tooltip-tasks-title">任务列表</div>
                                    ${details.tasks.slice(0, 3).map(task => `
                                        <div class="tooltip-task-item ${task.status === 'completed' ? 'completed' : ''}">
                                            <span class="tooltip-task-status">${task.status === 'completed' ? '✓' : '○'}</span>
                                            <span class="tooltip-task-name">${this.escapeHtml(task.title)}</span>
                                        </div>
                                    `).join('')}
                                    ${details.tasks.length > 3 ? `<div class="tooltip-more">还有 ${details.tasks.length - 3} 个任务...</div>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    getWeeklyDetails() {
        const weekDetails = {};
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dayStr = dayDate.toDateString();
            
            const dayFocus = this.data.focusRecords.filter(r => 
                new Date(r.startTime).toDateString() === dayStr
            );
            const totalMinutes = dayFocus.reduce((sum, r) => sum + (r.duration || 0), 0);
            
            const dayTasks = this.data.tasks.filter(t => {
                const taskDate = t.deadline ? new Date(t.deadline) : new Date(t.createdAt);
                return taskDate.toDateString() === dayStr;
            });
            
            const completedTasks = dayTasks.filter(t => t.status === 'completed').length;
            
            weekDetails[i] = {
                tasks: dayTasks,
                focusMinutes: totalMinutes,
                completedTasks: completedTasks
            };
        }
        
        return weekDetails;
    },

    getWeekDate(dayIndex) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        const targetDate = new Date(startOfWeek);
        targetDate.setDate(startOfWeek.getDate() + dayIndex);
        
        return `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
    },

    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes}分钟`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    },

    getWeeklyData() {
        const weekData = {};
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dayStr = dayDate.toDateString();
            
            const dayFocus = this.data.focusRecords.filter(r => 
                new Date(r.startTime).toDateString() === dayStr
            );
            const totalMinutes = dayFocus.reduce((sum, r) => sum + (r.duration || 0), 0);
            
            weekData[i] = Math.min((totalMinutes / 480) * 100, 100);
        }
        
        return weekData;
    },

    showNotification(message, icon = '📢') {
        const notification = document.getElementById('notification');
        notification.querySelector('.notification-icon').textContent = icon;
        notification.querySelector('.notification-text').textContent = message;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDeadline(deadline) {
        const date = new Date(deadline);
        const now = new Date();
        const diff = date - now;
        
        if (diff < 0) return '已过期';
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时后`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天后`;
        
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    TimePlanner.init();
    
    if (Notification.permission === 'default' && TimePlanner.data.settings.enableNotify) {
        Notification.requestPermission();
    }
});
