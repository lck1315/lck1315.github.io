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
        renderWorkLinks(); // 다시 렌더링해서 삭제 버튼 보이기/숨기기
    });

    // ----------------------------------------------------
    // UI 모달 관리
    // ----------------------------------------------------
    const btnOpenModal = document.getElementById('btn-open-work-modal');
    const workModalOverlay = document.getElementById('work-modal-overlay');
    const workCloseBtn = document.getElementById('work-close-btn');
    const loginRequiredModal = document.getElementById('login-required-modal');

    btnOpenModal.addEventListener('click', () => {
        if (!currentUser) {
            loginRequiredModal.classList.remove('hidden');
        } else {
            workModalOverlay.classList.remove('hidden');
        }
    });

    workCloseBtn.addEventListener('click', () => {
        workModalOverlay.classList.add('hidden');
    });

    // 모달 외부 클릭시 닫기
    window.addEventListener('click', (e) => {
        if (e.target === workModalOverlay) workModalOverlay.classList.add('hidden');
        if (e.target === loginRequiredModal) loginRequiredModal.classList.add('hidden');
    });

    // ----------------------------------------------------
    // 파이어베이스 데이터 연동 및 렌더링
    // ----------------------------------------------------
    const workContainer = document.getElementById('work-content-container');
    let workLinksData = [];

    // 실시간 리스너
    db.collection('workLinks').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        workLinksData = [];
        snapshot.forEach(doc => {
            workLinksData.push({ id: doc.id, ...doc.data() });
        });
        renderWorkLinks();
    });

    // 삭제 전역 함수 설정 (HTML에서 바로 호출 가능하게)
    window.deleteWorkLink = function(id) {
        if (!currentUser) {
            loginRequiredModal.classList.remove('hidden');
            return;
        }
        if (confirm('이 북마크를 정말 삭제하시겠습니까?')) {
            db.collection('workLinks').doc(id).delete()
                .then(() => console.log('Deleted successfully'))
                .catch(err => console.error('Error deleting:', err));
        }
    };

    function renderWorkLinks() {
        workContainer.innerHTML = '';

        if (workLinksData.length === 0) {
            workContainer.innerHTML = '<div style="text-align:center; padding: 50px; color: var(--text-muted);"><i class="fa-solid fa-folder-open"></i> 등록된 업무 북마크가 없습니다.</div>';
            return;
        }

        // 카테고리별로 데이터 그룹화
        const grouped = {};
        workLinksData.forEach(link => {
            const cat = link.category || '기타';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(link);
        });

        // 렌더링
        for (const [category, links] of Object.entries(grouped)) {
            // 카테고리 제목
            const catTitle = document.createElement('h3');
            catTitle.className = 'work-category-title';
            catTitle.innerHTML = `<i class="fa-solid fa-bookmark"></i> ${category}`;
            workContainer.appendChild(catTitle);

            // 해당 카테고리 그리드
            const grid = document.createElement('div');
            grid.className = 'work-grid';

            links.forEach(link => {
                const iconClass = link.icon || 'fa-solid fa-link';
                const deleteBtnHtml = currentUser 
                    ? `<button class="work-card-delete" onclick="event.preventDefault(); deleteWorkLink('${link.id}')"><i class="fa-solid fa-xmark"></i></button>`
                    : '';

                const cardHtml = `
                    <a href="${link.url}" target="_blank" class="work-card glass-card">
                        <div class="work-icon-wrap"><i class="${iconClass}"></i></div>
                        <div class="work-info">
                            <h4>${link.title}</h4>
                            <p>${link.url}</p>
                        </div>
                        ${deleteBtnHtml}
                    </a>
                `;
                grid.insertAdjacentHTML('beforeend', cardHtml);
            });

            workContainer.appendChild(grid);
        }
    }

    // ----------------------------------------------------
    // 북마크 추가 폼 제출
    // ----------------------------------------------------
    const workForm = document.getElementById('work-form');
    workForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        const category = document.getElementById('work-category').value.trim();
        const title = document.getElementById('work-title').value.trim();
        const url = document.getElementById('work-url').value.trim();
        const icon = document.getElementById('work-icon').value.trim();

        const submitBtn = workForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 추가중...';

        db.collection('workLinks').add({
            category: category || '기타',
            title: title,
            url: url,
            icon: icon,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            workForm.reset();
            workModalOverlay.classList.add('hidden');
        }).catch(err => {
            console.error('Error adding document:', err);
            alert('오류가 발생했습니다. 다시 시도해 주세요.');
        }).finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    });

    // ----------------------------------------------------
    // 파티클 엔진 (app.js에서 가져옴)
    // ----------------------------------------------------
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const numberOfParticles = 40;
    const mouse = { x: null, y: null, radius: 120 };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    });

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
                if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
                if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
                if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
                if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
            }

            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function initParticles() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particlesArray = [];

        const isLight = body.classList.contains('light-theme');
        const colors = isLight 
            ? ['rgba(108, 92, 231, 0.15)', 'rgba(253, 121, 168, 0.15)', 'rgba(225, 112, 85, 0.15)'] 
            : ['rgba(162, 155, 254, 0.12)', 'rgba(0, 206, 201, 0.1)', 'rgba(253, 121, 168, 0.1)'];

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 8) + 4;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = colors[Math.floor(Math.random() * colors.length)];

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, innerWidth, innerHeight);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
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
                    ctx.strokeStyle = lineColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    initParticles();
    animateParticles();
});
