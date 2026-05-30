/* ==========================================================================
   DODO Family Work Space Javascript
   ========================================================================== */

const firebaseConfig = {
    projectId: "dodo-family-space-lck",
    appId: "1:540819252997:web:2f6350f3a84461944df96c",
    storageBucket: "dodo-family-space-lck.firebasestorage.app",
    apiKey: "AIzaSyCT6eXu_rJqsKdxa8jr7OGKOWk6GH_fxkk",
    authDomain: "dodo-family-space-lck.firebaseapp.com",
    messagingSenderId: "540819252997",
    projectNumber: "540819252997",
    databaseURL: "https://dodo-family-space-lck-default-rtdb.firebaseio.com"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 테마 설정
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('dodo-theme') || 'dark-theme';
    body.className = savedTheme;

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.replace('dark-theme', 'light-theme');
            localStorage.setItem('dodo-theme', 'light-theme');
        } else {
            body.classList.replace('light-theme', 'dark-theme');
            localStorage.setItem('dodo-theme', 'dark-theme');
        }
        initParticles();
    });

    // ----------------------------------------------------
    // 인증 관리
    // ----------------------------------------------------
    let currentUser = null;
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        renderWorkLinks();
        renderSchedules();
        renderPerformances();
        renderProjects();
    });

    const loginRequiredModal = document.getElementById('login-required-modal');

    // ----------------------------------------------------
    // 탭 네비게이션
    // ----------------------------------------------------
    let currentTab = 'schedule';
    const tabs = document.querySelectorAll('.work-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            currentTab = tab.getAttribute('data-tab');
            document.getElementById(`tab-${currentTab}`).classList.add('active');
            
            // 프로젝트 탭일 경우 화면 너비 100% 확장
            const container = document.querySelector('main .container');
            if (container) {
                if (currentTab === 'projects') {
                    container.style.maxWidth = '100%';
                    container.style.padding = '0 1rem';
                } else {
                    container.style.maxWidth = '900px';
                    container.style.padding = '0 2rem';
                }
            }
        });
    });

    // ----------------------------------------------------
    // 모달 관리
    // ----------------------------------------------------
    const btnOpenModal = document.getElementById('btn-open-modal');
    
    btnOpenModal.addEventListener('click', () => {
        if (!currentUser) {
            loginRequiredModal.classList.remove('hidden');
            return;
        }
        const modal = document.getElementById(`modal-${currentTab}`);
        if(modal) modal.classList.remove('hidden');
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.auth-modal-overlay').classList.add('hidden');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('auth-modal-overlay')) {
            e.target.classList.add('hidden');
        }
    });

    // 전역 삭제 함수
    window.deleteItem = function(collection, id) {
        if (!currentUser) {
            loginRequiredModal.classList.remove('hidden');
            return;
        }
        if (confirm('정말 삭제하시겠습니까?')) {
            db.collection(collection).doc(id).delete().catch(err => console.error(err));
        }
    };
    
    // 토글 함수 (일정 완료 처리 등)
    window.toggleSchedule = function(id, currentStatus) {
        if (!currentUser) return;
        db.collection('workSchedules').doc(id).update({
            completed: !currentStatus
        }).catch(err => console.error(err));
    };

    window.updateProjectStatus = function(id, newStatus) {
        if (!currentUser) return;
        db.collection('workProjects').doc(id).update({
            status: newStatus
        }).catch(err => console.error(err));
    }

    // ====================================================
    // 북마크 (Bookmarks)
    // ====================================================
    const workContainer = document.getElementById('work-content-container');
    let workLinksData = [];

    db.collection('workLinks').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        workLinksData = [];
        snapshot.forEach(doc => workLinksData.push({ id: doc.id, ...doc.data() }));
        renderWorkLinks();
    });

    function renderWorkLinks() {
        workContainer.innerHTML = '';
        if (workLinksData.length === 0) {
            workContainer.innerHTML = '<div style="text-align:center; padding: 50px; color: var(--text-muted);"><i class="fa-solid fa-folder-open"></i> 등록된 업무 북마크가 없습니다.</div>';
            return;
        }
        const grouped = {};
        workLinksData.forEach(link => {
            const cat = link.category || '기타';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(link);
        });

        for (const [category, links] of Object.entries(grouped)) {
            const catTitle = document.createElement('h3');
            catTitle.className = 'work-category-title';
            catTitle.innerHTML = `<i class="fa-solid fa-bookmark"></i> ${category}`;
            workContainer.appendChild(catTitle);

            const grid = document.createElement('div');
            grid.className = 'work-grid';

            links.forEach(link => {
                const iconClass = link.icon || 'fa-solid fa-link';
                const deleteBtnHtml = currentUser ? `<button class="work-card-delete item-delete-btn" onclick="event.preventDefault(); window.deleteItem('workLinks', '${link.id}')"><i class="fa-solid fa-xmark"></i></button>` : '';
                grid.insertAdjacentHTML('beforeend', `
                    <a href="${link.url}" target="_blank" class="work-card glass-card">
                        <div class="work-icon-wrap"><i class="${iconClass}"></i></div>
                        <div class="work-info"><h4>${link.title}</h4><p>${link.url}</p></div>
                        ${deleteBtnHtml}
                    </a>
                `);
            });
            workContainer.appendChild(grid);
        }
    }

    document.getElementById('form-bookmarks').addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('bm-category').value.trim();
        db.collection('workLinks').add({
            category: category || '기타',
            title: document.getElementById('bm-title').value.trim(),
            url: document.getElementById('bm-url').value.trim(),
            icon: document.getElementById('bm-icon').value.trim(),
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            e.target.reset();
            document.getElementById('modal-bookmarks').classList.add('hidden');
        });
    });

    // ====================================================
    // 일정관리 (Schedule)
    // ====================================================
    const scheduleContainer = document.getElementById('schedule-content-container');
    let schedulesData = [];

    db.collection('workSchedules').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        schedulesData = [];
        snapshot.forEach(doc => schedulesData.push({ id: doc.id, ...doc.data() }));
        renderSchedules();
    });

    function renderSchedules() {
        scheduleContainer.innerHTML = '';
        if (schedulesData.length === 0) {
            scheduleContainer.innerHTML = '<div style="text-align:center; padding: 50px; color: var(--text-muted);"><i class="fa-regular fa-calendar-check"></i> 등록된 일정이 없습니다.</div>';
            return;
        }
        
        const grid = document.createElement('div');
        grid.className = 'work-grid';
        
        schedulesData.forEach(item => {
            const isCompleted = item.completed;
            const iconClass = isCompleted ? 'fa-solid fa-check-double' : 'fa-regular fa-calendar-check';
            const iconColor = isCompleted ? 'style="background: #2ed573;"' : '';
            const deleteBtn = currentUser ? `<button class="work-card-delete item-delete-btn" onclick="event.preventDefault(); window.deleteItem('workSchedules', '${item.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            
            const card = document.createElement('a');
            card.href = "#";
            card.className = `work-card glass-card ${isCompleted ? 'completed' : ''}`;
            if(isCompleted) card.style.opacity = '0.6';
            card.onclick = (e) => {
                e.preventDefault();
                window.toggleSchedule(item.id, isCompleted);
            };

            card.innerHTML = `
                <div class="work-icon-wrap" ${iconColor}><i class="${iconClass}"></i></div>
                <div class="work-info">
                    <h4 style="${isCompleted ? 'text-decoration: line-through;' : ''}">${item.title}</h4>
                    <p>${item.date ? item.date : '기한 없음'}</p>
                </div>
                ${deleteBtn}
            `;
            grid.appendChild(card);
        });
        scheduleContainer.appendChild(grid);
    }

    document.getElementById('form-schedule').addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('workSchedules').add({
            title: document.getElementById('sch-title').value.trim(),
            date: document.getElementById('sch-date').value,
            completed: false,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            e.target.reset();
            document.getElementById('modal-schedule').classList.add('hidden');
        });
    });

    // ====================================================
    // 개인성과 (Performance)
    // ====================================================
    const performanceContainer = document.getElementById('performance-content-container');
    let performancesData = [];

    db.collection('workPerformances').orderBy('date', 'desc').onSnapshot((snapshot) => {
        performancesData = [];
        snapshot.forEach(doc => performancesData.push({ id: doc.id, ...doc.data() }));
        renderPerformances();
    });

    function renderPerformances() {
        performanceContainer.innerHTML = '';
        if (performancesData.length === 0) {
            performanceContainer.innerHTML = '<div style="text-align:center; padding: 50px; color: var(--text-muted);"><i class="fa-solid fa-trophy"></i> 등록된 성과 기록이 없습니다.</div>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'work-grid';

        performancesData.forEach(item => {
            const deleteBtn = currentUser ? `<button class="work-card-delete item-delete-btn" onclick="event.preventDefault(); window.deleteItem('workPerformances', '${item.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            
            const card = document.createElement('div');
            card.className = 'work-card glass-card';
            card.style.alignItems = 'flex-start'; // 텍스트가 많을 수 있으니 위로 정렬

            card.innerHTML = `
                <div class="work-icon-wrap" style="background: linear-gradient(135deg, #ffa502, #ff7f50);"><i class="fa-solid fa-medal"></i></div>
                <div class="work-info">
                    <h4>${item.title}</h4>
                    <p style="color: var(--primary-color); font-weight: 600; margin-bottom: 5px;">${item.date}</p>
                    <p style="white-space: normal; overflow: visible;">${item.description}</p>
                </div>
                ${deleteBtn}
            `;
            grid.appendChild(card);
        });
        performanceContainer.appendChild(grid);
    }

    document.getElementById('form-performance').addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('workPerformances').add({
            title: document.getElementById('perf-title').value.trim(),
            date: document.getElementById('perf-date').value,
            description: document.getElementById('perf-desc').value.trim(),
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            e.target.reset();
            document.getElementById('modal-performance').classList.add('hidden');
        });
    });

    // ====================================================
    // 프로젝트 스케줄러 (Projects Scheduler - Desktop Replica)
    // ====================================================
    let psData = [];
    let psYear = new Date().getFullYear();
    let psDayWidth = 30; // DAY_WIDTH from python
    let psSelectedId = null;
    let psRowIndexMap = []; // Maps Y-index to Task ID

    db.collection('workProjects').orderBy('order', 'asc').onSnapshot((snapshot) => {
        psData = [];
        snapshot.forEach(doc => psData.push({ id: doc.id, ...doc.data() }));
        renderPsScheduler();
    });

    document.getElementById('ps-year')?.addEventListener('change', (e) => { psYear = parseInt(e.target.value); renderPsScheduler(); });
    document.getElementById('ps-btn-today')?.addEventListener('click', () => { 
        psYear = new Date().getFullYear(); 
        document.getElementById('ps-year').value = psYear; 
        renderPsScheduler(); 
    });

    document.getElementById('ps-btn-zoom-in')?.addEventListener('click', () => { psDayWidth = Math.min(psDayWidth + 5, 100); renderPsScheduler(); });
    document.getElementById('ps-btn-zoom-out')?.addEventListener('click', () => { psDayWidth = Math.max(psDayWidth - 5, 10); renderPsScheduler(); });
    document.getElementById('ps-btn-zoom-reset')?.addEventListener('click', () => { psDayWidth = 30; renderPsScheduler(); });

    document.getElementById('ps-btn-add-project')?.addEventListener('click', () => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        db.collection('workProjects').add({
            parentId: null,
            name: '새 프로젝트',
            assignee: '',
            status: '대기중',
            startDate: '',
            endDate: '',
            color: '#fffacd',
            order: Date.now(),
            expanded: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    });

    document.getElementById('ps-btn-add-task')?.addEventListener('click', () => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        if(!psSelectedId) return alert('추가할 프로젝트/태스크를 먼저 선택하세요.');
        const parentTask = psData.find(p => p.id === psSelectedId);
        if(!parentTask) return;
        const parentId = parentTask.parentId ? parentTask.parentId : parentTask.id;
        
        db.collection('workProjects').add({
            parentId: parentId,
            name: '새 태스크',
            assignee: '',
            status: '대기중',
            startDate: '',
            endDate: '',
            color: '#e0f7fa',
            order: Date.now(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
    
    document.getElementById('ps-btn-delete')?.addEventListener('click', () => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        if(!psSelectedId) return alert('삭제할 항목을 선택하세요.');
        if(confirm('선택한 항목을 삭제하시겠습니까? (하위 태스크가 있다면 함께 삭제되지 않을 수 있습니다)')) {
            db.collection('workProjects').doc(psSelectedId).delete();
            psSelectedId = null;
        }
    });

    document.getElementById('ps-btn-color')?.addEventListener('click', () => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        if(!psSelectedId) return alert('항목을 선택하세요.');
        const task = psData.find(p => p.id === psSelectedId);
        if(!task) return;
        const colors = ['#fffacd', '#e0f7fa', '#f8bbd0', '#dcedc8', '#ffcc80', '#e1bee7', '#b3e5fc', '#ffecb3'];
        let idx = colors.indexOf(task.color);
        const nextColor = colors[(idx + 1) % colors.length];
        window.psUpdateField(psSelectedId, 'color', nextColor);
    });

    window.psUpdateField = (id, field, value) => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        db.collection('workProjects').doc(id).update({ [field]: value }).catch(e => console.error(e));
    };

    function renderPsScheduler() {
        const treeBody = document.getElementById('ps-tree-body');
        const ganttHeader = document.getElementById('ps-gantt-header');
        const bgGrid = document.getElementById('ps-gantt-bg-grid');
        const bgHlines = document.getElementById('ps-gantt-horizontal-lines');
        const ganttBlocks = document.getElementById('ps-gantt-blocks');

        if(!treeBody || !ganttHeader) return;

        // --- 1. Gantt Header & Grid ---
        const isLeapYear = (psYear % 4 === 0 && psYear % 100 !== 0) || (psYear % 400 === 0);
        const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        let headerHtml = `
            <div class="ps-gantt-header-row" id="gh-weeks"></div>
            <div class="ps-gantt-header-row" id="gh-months"></div>
            <div class="ps-gantt-header-row" id="gh-days"></div>
            <div class="ps-gantt-header-row" id="gh-weekdays"></div>
        `;
        ganttHeader.innerHTML = headerHtml;
        
        const ghWeeks = document.getElementById('gh-weeks');
        const ghMonths = document.getElementById('gh-months');
        const ghDays = document.getElementById('gh-days');
        const ghWeekdays = document.getElementById('gh-weekdays');
        
        bgGrid.innerHTML = '';
        
        const today = new Date();
        const weekdaysStr = ['일', '월', '화', '수', '목', '금', '토'];
        
        let totalDays = 0;
        let currentWeekCount = 0;
        let daysInCurrentWeek = 0;
        
        for (let m = 0; m < 12; m++) {
            const mDays = daysInMonth[m];
            
            // Month
            const mDiv = document.createElement('div');
            mDiv.className = 'ps-gh-cell';
            mDiv.style.width = `${mDays * psDayWidth}px`;
            mDiv.style.minWidth = `${mDays * psDayWidth}px`;
            mDiv.innerText = `${m + 1}월`;
            ghMonths.appendChild(mDiv);
            
            for (let d = 1; d <= mDays; d++) {
                const dayDate = new Date(psYear, m, d);
                const dayOfWeek = dayDate.getDay();
                const isToday = (dayDate.getFullYear() === today.getFullYear() && dayDate.getMonth() === today.getMonth() && dayDate.getDate() === today.getDate());
                
                // Day number
                const dDiv = document.createElement('div');
                dDiv.className = 'ps-gh-cell';
                dDiv.style.width = `${psDayWidth}px`;
                dDiv.style.minWidth = `${psDayWidth}px`;
                dDiv.innerText = d;
                ghDays.appendChild(dDiv);
                
                // Weekday
                const wdDiv = document.createElement('div');
                wdDiv.className = 'ps-gh-cell';
                wdDiv.style.width = `${psDayWidth}px`;
                wdDiv.style.minWidth = `${psDayWidth}px`;
                wdDiv.innerText = weekdaysStr[dayOfWeek];
                if(dayOfWeek === 0) wdDiv.classList.add('weekend-sun');
                if(dayOfWeek === 6) wdDiv.classList.add('weekend-sat');
                ghWeekdays.appendChild(wdDiv);
                
                // Background Grid Line
                const gridLine = document.createElement('div');
                gridLine.className = 'ps-gantt-bg-day';
                gridLine.style.width = `${psDayWidth}px`;
                gridLine.style.minWidth = `${psDayWidth}px`;
                if(dayOfWeek === 0) gridLine.classList.add('weekend-sun');
                if(dayOfWeek === 6) gridLine.classList.add('weekend-sat');
                if(isToday) gridLine.classList.add('today');
                bgGrid.appendChild(gridLine);
                
                // Weeks calculation (roughly matching PyQt ISO week, simplified)
                daysInCurrentWeek++;
                if (dayOfWeek === 0 || (m === 11 && d === 31)) {
                    currentWeekCount++;
                    const wDiv = document.createElement('div');
                    wDiv.className = 'ps-gh-cell';
                    wDiv.style.width = `${daysInCurrentWeek * psDayWidth}px`;
                    wDiv.style.minWidth = `${daysInCurrentWeek * psDayWidth}px`;
                    wDiv.innerText = `${currentWeekCount}주차`;
                    ghWeeks.appendChild(wDiv);
                    daysInCurrentWeek = 0;
                }
            }
            totalDays += mDays;
        }

        // --- 2. Tree Body & Gantt Blocks ---
        treeBody.innerHTML = '';
        bgHlines.innerHTML = '';
        ganttBlocks.innerHTML = '';

        psRowIndexMap = []; // Reset map

        const rootTasks = psData.filter(p => !p.parentId).sort((a,b) => a.order - b.order);
        let globalIndex = 0;

        function renderRow(task, level, prefix) {
            psRowIndexMap.push(task.id);
            globalIndex++;
            const children = psData.filter(p => p.parentId === task.id).sort((a,b) => a.order - b.order);
            const isExpanded = task.expanded !== false;
            const hasChildren = children.length > 0;
            
            const isSelected = psSelectedId === task.id;
            
            // Tree Row
            const tr = document.createElement('div');
            tr.className = `ps-tree-row ${isSelected ? 'selected' : ''}`;
            tr.onclick = () => { psSelectedId = task.id; renderPsScheduler(); };
            
            const disabledAttr = !currentUser ? 'disabled' : '';

            tr.innerHTML = `
                <div class="ps-col-0">${globalIndex}</div>
                <div class="ps-col-1" style="padding-left: ${10 + level * 20}px;">
                    ${hasChildren ? `<span style="cursor:pointer; width:15px; display:inline-block; font-weight:bold; color:#555;" onclick="event.stopPropagation(); window.psUpdateField('${task.id}', 'expanded', ${!isExpanded})">${isExpanded ? '▼' : '▶'}</span>` : '<span style="width:15px; display:inline-block;"></span>'}
                    <span style="margin-right:5px; color:#666; font-size:11px; min-width:20px;">${prefix}</span>
                    <input class="ps-tree-input" value="${task.name || ''}" onchange="window.psUpdateField('${task.id}', 'name', this.value)" ${disabledAttr}>
                </div>
                <div class="ps-col-2">
                    <input class="ps-tree-input" value="${task.assignee || ''}" onchange="window.psUpdateField('${task.id}', 'assignee', this.value)" ${disabledAttr}>
                </div>
                <div class="ps-col-3">
                    <select class="ps-tree-combo" onchange="window.psUpdateField('${task.id}', 'status', this.value)" ${disabledAttr}>
                        <option value="대기중" ${task.status === '대기중' ? 'selected' : ''}>대기중</option>
                        <option value="진행중" ${task.status === '진행중' ? 'selected' : ''}>진행중</option>
                        <option value="완료" ${task.status === '완료' ? 'selected' : ''}>완료</option>
                    </select>
                </div>
                <div class="ps-col-4">
                    <input type="date" class="ps-tree-input" value="${task.startDate || ''}" onchange="window.psUpdateField('${task.id}', 'startDate', this.value)" ${disabledAttr} style="font-size:11px; letter-spacing:-1px;">
                </div>
                <div class="ps-col-5" style="border-right: none;">
                    <input type="date" class="ps-tree-input" value="${task.endDate || ''}" onchange="window.psUpdateField('${task.id}', 'endDate', this.value)" ${disabledAttr} style="font-size:11px; letter-spacing:-1px;">
                </div>
            `;
            treeBody.appendChild(tr);
            
            // Background Horizontal Line
            const hline = document.createElement('div');
            hline.className = 'ps-gantt-hline';
            hline.style.width = `${totalDays * psDayWidth}px`;
            bgHlines.appendChild(hline);
            
            // Gantt Block
            if (task.startDate && task.endDate) {
                const sDate = new Date(task.startDate);
                const eDate = new Date(task.endDate);
                
                if (sDate.getFullYear() <= psYear && eDate.getFullYear() >= psYear) {
                    const yearStart = new Date(psYear, 0, 1);
                    const yearEnd = new Date(psYear, 11, 31);
                    
                    let drawStart = sDate < yearStart ? yearStart : sDate;
                    let drawEnd = eDate > yearEnd ? yearEnd : eDate;
                    
                    const daysFromStart = Math.floor((drawStart - yearStart) / (1000 * 60 * 60 * 24));
                    const durationDays = Math.floor((drawEnd - drawStart) / (1000 * 60 * 60 * 24)) + 1;
                    
                    if (daysFromStart >= 0 && durationDays > 0) {
                        const block = document.createElement('div');
                        block.className = `ps-block ${isSelected ? 'selected' : ''}`;
                        block.style.left = `${daysFromStart * psDayWidth}px`;
                        block.style.width = `${durationDays * psDayWidth}px`;
                        block.style.top = `${(globalIndex - 1) * 30 + 5}px`;
                        block.style.background = task.color || '#fffacd';
                        block.innerText = task.name;
                        
                        block.onclick = (e) => {
                            e.stopPropagation();
                            psSelectedId = task.id;
                            renderPsScheduler();
                        };
                        ganttBlocks.appendChild(block);
                    }
                }
            }

            if (isExpanded) {
                children.forEach((child, idx) => {
                    renderRow(child, level + 1, `${prefix}-${idx + 1}`);
                });
            }
        }

        rootTasks.forEach((root, idx) => {
            renderRow(root, 0, `${idx + 1}`);
        });

        if(psData.length === 0) {
            treeBody.innerHTML = '<div style="text-align:center; padding: 20px; color: #888;">등록된 일정이 없습니다.</div>';
        }

        // --- 3. Synchronize Scrolling ---
        const ganttContainer = document.getElementById('ps-gantt-container');
        let isSyncingLeft = false;
        let isSyncingRight = false;
        
        treeBody.onscroll = () => {
            if(!isSyncingLeft) {
                isSyncingRight = true;
                ganttContainer.scrollTop = treeBody.scrollTop;
            }
            isSyncingLeft = false;
        };
        
        ganttContainer.onscroll = () => {
            if(!isSyncingRight) {
                isSyncingLeft = true;
                treeBody.scrollTop = ganttContainer.scrollTop;
            }
            isSyncingRight = false;
        };
    }

    // --- 4. Drag to Draw Block ---
    let isDrawing = false;
    let drawStartDayIndex = 0;
    let drawingTaskId = null;
    let drawingBlock = null;

    document.addEventListener('mousedown', (e) => {
        const ganttBody = document.getElementById('ps-gantt-body');
        if (ganttBody && ganttBody.contains(e.target)) {
            if(!currentUser) {
                alert('로그인이 필요합니다.');
                return;
            }
            const container = document.getElementById('ps-gantt-container');
            const rect = ganttBody.getBoundingClientRect();
            const x = e.clientX - rect.left + container.scrollLeft;
            const y = e.clientY - rect.top;
            
            const rowIndex = Math.floor(y / 30);
            const dayIndex = Math.floor(x / psDayWidth);
            
            if(rowIndex >= 0 && rowIndex < psRowIndexMap.length) {
                isDrawing = true;
                drawStartDayIndex = dayIndex;
                drawingTaskId = psRowIndexMap[rowIndex];
                psSelectedId = drawingTaskId; // Update selection
                renderPsScheduler(); // To highlight selected row
                
                // Create temporary block
                drawingBlock = document.createElement('div');
                drawingBlock.className = 'ps-block selected';
                drawingBlock.style.left = `${dayIndex * psDayWidth}px`;
                drawingBlock.style.width = `${psDayWidth}px`;
                drawingBlock.style.top = `${rowIndex * 30 + 5}px`;
                drawingBlock.style.background = 'rgba(255, 107, 129, 0.7)'; // Red-ish preview
                drawingBlock.innerText = '설정 중...';
                document.getElementById('ps-gantt-blocks').appendChild(drawingBlock);
                e.preventDefault(); // Prevent text selection
            }
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if(isDrawing && drawingBlock) {
            const ganttBody = document.getElementById('ps-gantt-body');
            const container = document.getElementById('ps-gantt-container');
            const rect = ganttBody.getBoundingClientRect();
            let x = e.clientX - rect.left + container.scrollLeft;
            if(x < 0) x = 0;
            const dayIndex = Math.floor(x / psDayWidth);
            
            const minDay = Math.min(drawStartDayIndex, dayIndex);
            const maxDay = Math.max(drawStartDayIndex, dayIndex);
            
            drawingBlock.style.left = `${minDay * psDayWidth}px`;
            drawingBlock.style.width = `${(maxDay - minDay + 1) * psDayWidth}px`;
        }
    });
    
    document.addEventListener('mouseup', (e) => {
        if(isDrawing) {
            isDrawing = false;
            if(drawingBlock && drawingTaskId) {
                const ganttBody = document.getElementById('ps-gantt-body');
                const container = document.getElementById('ps-gantt-container');
                const rect = ganttBody.getBoundingClientRect();
                let x = e.clientX - rect.left + container.scrollLeft;
                if (x < 0) x = 0;
                const dayIndex = Math.floor(x / psDayWidth);
                
                const minDay = Math.min(drawStartDayIndex, dayIndex);
                const maxDay = Math.max(drawStartDayIndex, dayIndex);
                
                // Convert minDay and maxDay to Date
                const yearStart = new Date(psYear, 0, 1);
                
                // Add minDay days to yearStart
                const sDate = new Date(psYear, 0, 1 + minDay);
                const eDate = new Date(psYear, 0, 1 + maxDay);
                
                const sDateStr = sDate.getFullYear() + '-' + String(sDate.getMonth() + 1).padStart(2, '0') + '-' + String(sDate.getDate()).padStart(2, '0');
                const eDateStr = eDate.getFullYear() + '-' + String(eDate.getMonth() + 1).padStart(2, '0') + '-' + String(eDate.getDate()).padStart(2, '0');
                
                // Update Firebase
                window.psUpdateField(drawingTaskId, 'startDate', sDateStr);
                window.psUpdateField(drawingTaskId, 'endDate', eDateStr);
                
                drawingBlock.remove();
                drawingBlock = null;
            }
        }
    });

    // ====================================================
    // 파티클 배경 로직 (기존 유지)
    // ====================================================
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const numberOfParticles = 40;
    const mouse = { x: null, y: null, radius: 120 };

    window.addEventListener('mousemove', (event) => { mouse.x = event.x; mouse.y = event.y; });
    window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); });

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x; this.y = y; this.directionX = directionX; this.directionY = directionY; this.size = size; this.color = color;
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill();
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
            let dx = mouse.x - this.x; let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
                if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
                if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
                if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
                if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
            }
            this.x += this.directionX; this.y += this.directionY;
            this.draw();
        }
    }

    function initParticles() {
        canvas.width = window.innerWidth; canvas.height = window.innerHeight; particlesArray = [];
        const isLight = body.classList.contains('light-theme');
        const colors = isLight 
            ? ['rgba(108, 92, 231, 0.15)', 'rgba(253, 121, 168, 0.15)', 'rgba(225, 112, 85, 0.15)'] 
            : ['rgba(162, 155, 254, 0.12)', 'rgba(0, 206, 201, 0.1)', 'rgba(253, 121, 168, 0.1)'];

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 8) + 4;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2; let directionY = (Math.random() * 0.4) - 0.2;
            let color = colors[Math.floor(Math.random() * colors.length)];
            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); }
        connectParticles();
    }

    function connectParticles() {
        const isLight = body.classList.contains('light-theme');
        const lineColor = isLight ? 'rgba(108, 92, 231, 0.04)' : 'rgba(255, 255, 255, 0.03)';
        let maxDistance = 150;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < maxDistance) {
                    ctx.strokeStyle = lineColor; ctx.lineWidth = 1; ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke();
                }
            }
        }
    }

    initParticles();
    animateParticles();
});
