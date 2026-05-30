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
    let currentTab = 'bookmarks';
    const tabs = document.querySelectorAll('.work-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            currentTab = tab.getAttribute('data-tab');
            document.getElementById(`tab-${currentTab}`).classList.add('active');
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
    const scheduleList = document.getElementById('schedule-list');
    let schedulesData = [];

    db.collection('workSchedules').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        schedulesData = [];
        snapshot.forEach(doc => schedulesData.push({ id: doc.id, ...doc.data() }));
        renderSchedules();
    });

    function renderSchedules() {
        scheduleList.innerHTML = '';
        if (schedulesData.length === 0) {
            scheduleList.innerHTML = '<li style="text-align:center; padding: 20px; color: var(--text-muted);">등록된 일정이 없습니다.</li>';
            return;
        }
        
        schedulesData.forEach(item => {
            const isCompleted = item.completed;
            const dateStr = item.date ? `<div class="schedule-date"><i class="fa-regular fa-calendar"></i> ${item.date}</div>` : '';
            const deleteBtn = currentUser ? `<button class="item-delete-btn" onclick="window.deleteItem('workSchedules', '${item.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            
            const li = document.createElement('li');
            li.className = `schedule-item ${isCompleted ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="schedule-checkbox" ${isCompleted ? 'checked' : ''} onchange="window.toggleSchedule('${item.id}', ${isCompleted})">
                <div class="schedule-info">
                    <div class="schedule-title">${item.title}</div>
                    ${dateStr}
                </div>
                ${deleteBtn}
            `;
            scheduleList.appendChild(li);
        });
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
    const performanceTimeline = document.getElementById('performance-timeline');
    let performancesData = [];

    db.collection('workPerformances').orderBy('date', 'desc').onSnapshot((snapshot) => {
        performancesData = [];
        snapshot.forEach(doc => performancesData.push({ id: doc.id, ...doc.data() }));
        renderPerformances();
    });

    function renderPerformances() {
        performanceTimeline.innerHTML = '';
        if (performancesData.length === 0) {
            performanceTimeline.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">등록된 성과 기록이 없습니다.</div>';
            return;
        }

        performancesData.forEach(item => {
            const deleteBtn = currentUser ? `<button class="item-delete-btn" onclick="window.deleteItem('workPerformances', '${item.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
            const descHtml = item.description.replace(/\n/g, '<br>');
            
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${item.date}</div>
                    <h4 class="timeline-title">${item.title}</h4>
                    <p class="timeline-desc">${descHtml}</p>
                    ${deleteBtn}
                </div>
            `;
            performanceTimeline.appendChild(div);
        });
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
    // 프로젝트 (Projects)
    // ====================================================
    let projectsData = [];

    db.collection('workProjects').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        projectsData = [];
        snapshot.forEach(doc => projectsData.push({ id: doc.id, ...doc.data() }));
        renderProjects();
    });

    function renderProjects() {
        const todoContainer = document.getElementById('kanban-todo');
        const progressContainer = document.getElementById('kanban-progress');
        const doneContainer = document.getElementById('kanban-done');
        
        todoContainer.innerHTML = '';
        progressContainer.innerHTML = '';
        doneContainer.innerHTML = '';

        projectsData.forEach(item => {
            const deleteBtn = currentUser ? `<button class="item-delete-btn" onclick="window.deleteItem('workProjects', '${item.id}')"><i class="fa-solid fa-xmark"></i></button>` : '';
            const dateStr = item.dueDate ? `<i class="fa-regular fa-calendar"></i> ${item.dueDate}` : '';
            
            // 상태 변경 select
            const statusSelect = currentUser ? `
                <select class="kanban-status-select" onchange="window.updateProjectStatus('${item.id}', this.value)">
                    <option value="todo" ${item.status === 'todo' ? 'selected' : ''}>To Do</option>
                    <option value="progress" ${item.status === 'progress' ? 'selected' : ''}>In Progress</option>
                    <option value="done" ${item.status === 'done' ? 'selected' : ''}>Done</option>
                </select>
            ` : '';

            const card = document.createElement('div');
            card.className = 'kanban-card';
            if (item.status === 'done') card.style.opacity = '0.6';
            card.innerHTML = `
                <h4 class="kanban-title">${item.title}</h4>
                <div class="kanban-meta">
                    <span>${dateStr}</span>
                </div>
                ${statusSelect}
                ${deleteBtn}
            `;
            
            if (item.status === 'todo') todoContainer.appendChild(card);
            else if (item.status === 'progress') progressContainer.appendChild(card);
            else if (item.status === 'done') doneContainer.appendChild(card);
            else todoContainer.appendChild(card);
        });
    }

    document.getElementById('form-projects').addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('workProjects').add({
            title: document.getElementById('proj-title').value.trim(),
            status: document.getElementById('proj-status').value,
            dueDate: document.getElementById('proj-date').value,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            e.target.reset();
            document.getElementById('modal-projects').classList.add('hidden');
        });
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
