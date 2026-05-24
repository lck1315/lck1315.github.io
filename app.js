/* ==========================================================================
   DODO Family Space Javascript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. 테마 스위처 (다크/라이트 모드)
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // 이전 세션 테마 설정 로드 (기본 다크테마)
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
        // 테마 바뀔 때 파티클 색상 갱신을 위해 파티클 설정 변경
        initParticles();
    });


    // ----------------------------------------------------
    // 2. 스크롤 프로그레스 바 & 네비게이션 Scrollspy
    // ----------------------------------------------------
    const progressBar = document.getElementById('scroll-progress-bar');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        // 스크롤 진행 바 업데이트
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';

        // Scrollspy (현재 보고있는 섹션 활성화)
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150; // 네비게이션 바 높이 감안
            const sectionHeight = section.clientHeight;
            if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === `#${currentSectionId}`) {
                    item.classList.add('active');
                }
            });
        }
    });


    // ----------------------------------------------------
    // 3. 캔버스 파티클 엔진 (마우스 반응형)
    // ----------------------------------------------------
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const numberOfParticles = 60;
    const mouse = {
        x: null,
        y: null,
        radius: 120
    };

    // 마우스 움직임 트래킹
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // 캔버스 크기 반응형 리사이징
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    });

    // 파티클 생성 모델
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        // 파티클 그리기
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // 파티클 상태 업데이트 (움직임 및 마우스 충돌 감지)
        update() {
            // 경계선 체크
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // 마우스 충돌 효과 (부드럽게 밀려나는 로직)
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
                if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                    this.x += 2;
                }
                if (mouse.x > this.x && this.x > this.size * 10) {
                    this.x -= 2;
                }
                if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                    this.y += 2;
                }
                if (mouse.y > this.y && this.y > this.size * 10) {
                    this.y -= 2;
                }
            }

            // 이동
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    // 파티클 초기화
    function initParticles() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particlesArray = [];

        // 테마별 파티클 색상 매핑
        const isLight = body.classList.contains('light-theme');
        const colors = isLight 
            ? ['rgba(108, 92, 231, 0.15)', 'rgba(253, 121, 168, 0.15)', 'rgba(225, 112, 85, 0.15)'] 
            : ['rgba(162, 155, 254, 0.12)', 'rgba(0, 206, 201, 0.1)', 'rgba(253, 121, 168, 0.1)'];

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 8) + 4; // 크기 4~12px
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2; // 부드럽게 흐르도록 속도 조절
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = colors[Math.floor(Math.random() * colors.length)];

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // 파티클 애니메이션 루프
    function animateParticles() {
        requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, innerWidth, innerHeight);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connectParticles();
    }

    // 인접한 파티클끼리 가느다란 실선 연결 효과
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


    // ----------------------------------------------------
    // 4. 가족 프로필 카드 3D 뒤집기 (모바일 터치 이벤트 보완)
    // ----------------------------------------------------
    const memberCards = document.querySelectorAll('.member-card-wrapper');
    memberCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // 모바일에서 클릭 시 플립 고정 토글
            card.classList.toggle('flipped');
        });
    });


    // ----------------------------------------------------
    // 5. 추억 갤러리 카테고리 필터링 & 라이트박스(모달)
    // ----------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 액티브 클래스 전환
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                // 필터링 애니메이션 처리
                if (filterValue === 'all' || category === filterValue) {
                    item.classList.remove('hide');
                    setTimeout(() => {
                        item.style.transform = 'scale(1)';
                        item.style.opacity = '1';
                    }, 50);
                } else {
                    item.style.transform = 'scale(0.8)';
                    item.style.opacity = '0';
                    setTimeout(() => {
                        item.classList.add('hide');
                    }, 400);
                }
            });
        });
    });

    // 라이트박스 오픈 로직
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.close-btn');

    galleryItems.forEach(item => {
        const imgContainer = item.querySelector('.gallery-img-container');
        imgContainer.addEventListener('click', () => {
            const imgSrc = item.querySelector('img').getAttribute('src');
            const itemTitle = item.querySelector('.gallery-item-title').textContent;
            
            lightboxImg.setAttribute('src', imgSrc);
            lightboxCaption.textContent = itemTitle;
            lightboxModal.classList.add('show');
        });
    });

    // 라이트박스 닫기
    closeBtn.addEventListener('click', () => {
        lightboxModal.classList.remove('show');
    });

    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            lightboxModal.classList.remove('show');
        }
    });


    // ----------------------------------------------------
    // 6. 스크롤 트리거 타임라인 애니메이션 (Intersection Observer)
    // ----------------------------------------------------
    const timelineItems = document.querySelectorAll('.timeline-item');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const timelineObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                // 한번 등장한 후 관찰 중단
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });


    // ----------------------------------------------------
    // 7. 가상 방명록 로직 (localStorage 연동)
    // ----------------------------------------------------
    const guestbookForm = document.getElementById('guestbook-form');
    const authorInput = document.getElementById('author-input');
    const messageInput = document.getElementById('message-input');
    const guestbookList = document.getElementById('guestbook-list');

    // 로컬스토리지에서 기존 메시지들 로드
    let messages = JSON.parse(localStorage.getItem('dodo-messages')) || [];

    // 메시지 목록 렌더링 함수
    function renderMessages() {
        guestbookList.innerHTML = '';

        if (messages.length === 0) {
            guestbookList.innerHTML = `
                <div class="no-messages">
                    <p><i class="fa-regular fa-comment-dots"></i> 아직 남겨진 메시지가 없어요. 첫 번째 메시지를 남겨보세요!</p>
                </div>
            `;
            return;
        }

        messages.forEach((msg, index) => {
            const card = document.createElement('div');
            card.className = 'guest-card glass-card';

            // 날짜 포맷팅
            const dateStr = new Date(msg.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            card.innerHTML = `
                <div class="guest-card-header">
                    <span class="guest-author"><i class="fa-solid fa-user-circle"></i> ${escapeHTML(msg.author)}</span>
                    <span class="guest-date">${dateStr}</span>
                </div>
                <p class="guest-text">${escapeHTML(msg.message).replace(/\n/g, '<br>')}</p>
                <div class="guest-card-footer">
                    <button class="heart-btn ${msg.liked ? 'liked' : ''}" data-index="${index}">
                        <i class="fa-${msg.liked ? 'solid' : 'regular'} fa-heart"></i> 
                        <span class="like-count">${msg.likes || 0}</span>
                    </button>
                    <span class="guest-sticker">${msg.sticker}</span>
                    <button class="delete-btn" data-index="${index}" title="메시지 삭제">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
            guestbookList.appendChild(card);
        });

        // 좋아요 버튼 이벤트 등록
        document.querySelectorAll('.heart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.getAttribute('data-index'));
                toggleLike(index);
            });
        });

        // 삭제 버튼 이벤트 등록
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                deleteMessage(index);
            });
        });
    }

    // XSS 방지를 위한 HTML 이스케이프
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // 새 방명록 메시지 추가
    guestbookForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const author = authorInput.value.trim();
        const message = messageInput.value.trim();
        const selectedSticker = document.querySelector('input[name="sticker"]:checked').value;

        if (!author || !message) return;

        const newMessage = {
            author,
            message,
            sticker: selectedSticker,
            date: new Date().getTime(),
            likes: 0,
            liked: false
        };

        messages.unshift(newMessage); // 최근 메시지가 항상 위로 오도록 배열 맨 앞에 삽입
        saveAndRender();

        // 폼 리셋
        authorInput.value = '';
        messageInput.value = '';
        // 첫 번째 라디오(💖)로 기본 선택값 리셋
        document.getElementById('st-heart').checked = true;
    });

    // 좋아요 토글
    function toggleLike(index) {
        if (messages[index].liked) {
            messages[index].likes -= 1;
            messages[index].liked = false;
        } else {
            messages[index].likes += 1;
            messages[index].liked = true;
        }
        saveAndRender();
    }

    // 메시지 삭제
    function deleteMessage(index) {
        if (confirm('이 방명록 글을 정말 삭제할까요?')) {
            messages.splice(index, 1);
            saveAndRender();
        }
    }

    // 로컬스토리지에 저장하고 렌더링 갱신
    function saveAndRender() {
        localStorage.setItem('dodo-messages', JSON.stringify(messages));
        renderMessages();
    }

    // 초기 방명록 렌더링
    renderMessages();
});
