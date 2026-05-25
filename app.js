/* ==========================================================================
   DODO Family Space Javascript
   ========================================================================== */

// Firebase Configuration
const firebaseConfig = {
  projectId: "dodo-family-space-lck",
  appId: "1:540819252997:web:2f6350f3a84461944df96c",
  storageBucket: "dodo-family-space-lck.firebasestorage.app",
  apiKey: "AIzaSyCT6eXu_rJqsKdxa8jr7OGKOWk6GH_fxkk",
  authDomain: "dodo-family-space-lck.firebaseapp.com",
  messagingSenderId: "540819252997",
  projectNumber: "540819252997"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 0. 회원 인증 및 권한 관리 (Firebase Auth)
    // ----------------------------------------------------
    const authContainer = document.getElementById('auth-container');
    const appContent = document.getElementById('app-content');
    const authWelcome = document.getElementById('auth-welcome');
    const authLoginScreen = document.getElementById('auth-login-screen');
    const authSignupScreen = document.getElementById('auth-signup-screen');
    
    const btnGoLogin = document.getElementById('btn-go-login');
    const btnGoSignup = document.getElementById('btn-go-signup');
    const backBtns = document.querySelectorAll('.auth-back-btn');
    const authCloseBtn = document.getElementById('auth-close-btn');
    
    const linkToSignup = document.getElementById('link-to-signup');
    const linkToLogin = document.getElementById('link-to-login');
    
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const authErrorMsg = document.getElementById('auth-error-msg');

    // 헤더 프로필 메뉴 요소
    const authMenuBtn = document.getElementById('auth-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownLoginBtn = document.getElementById('dropdown-login-btn');
    const dropdownSignupBtn = document.getElementById('dropdown-signup-btn');
    const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');

    let currentUserInfo = null;
    let activeBoardFilter = 'all';

    // 화면 전환 함수들
    function showWelcomeScreen() {
        authWelcome.classList.remove('hidden');
        authLoginScreen.classList.add('hidden');
        authSignupScreen.classList.add('hidden');
        authErrorMsg.classList.add('hidden');
    }

    function showLoginScreen() {
        authWelcome.classList.add('hidden');
        authLoginScreen.classList.remove('hidden');
        authSignupScreen.classList.add('hidden');
        authErrorMsg.classList.add('hidden');
    }

    function showSignupScreen() {
        authWelcome.classList.add('hidden');
        authLoginScreen.classList.add('hidden');
        authSignupScreen.classList.remove('hidden');
        authErrorMsg.classList.add('hidden');
    }

    // 웰컴화면 이벤트 바인딩
    btnGoLogin.addEventListener('click', showLoginScreen);
    btnGoSignup.addEventListener('click', showSignupScreen);
    
    backBtns.forEach(btn => {
        btn.addEventListener('click', showWelcomeScreen);
    });

    linkToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        showSignupScreen();
    });

    linkToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginScreen();
    });

    // 모달 닫기
    authCloseBtn.addEventListener('click', () => {
        authContainer.classList.add('hidden');
    });

    // 헤더 프로필/로그인 제어 버튼 바인딩
    authMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentUserInfo) {
            showLoginScreen();
            authContainer.classList.remove('hidden');
        } else {
            profileDropdown.classList.toggle('hidden');
        }
    });

    dropdownLoginBtn.addEventListener('click', () => {
        showLoginScreen();
        authContainer.classList.remove('hidden');
        profileDropdown.classList.add('hidden');
    });

    dropdownSignupBtn.addEventListener('click', () => {
        showSignupScreen();
        authContainer.classList.remove('hidden');
        profileDropdown.classList.add('hidden');
    });

    // 바깥 클릭 시 드롭다운 자동으로 닫기
    document.addEventListener('click', () => {
        if (profileDropdown) {
            profileDropdown.classList.add('hidden');
        }
    });

    // 에러 표시 헬퍼
    function showAuthError(msg) {
        authErrorMsg.textContent = msg;
        authErrorMsg.classList.remove('hidden');
    }

    // 권한 검증 헬퍼
    function checkAuth() {
        if (!currentUserInfo) {
            alert("가족 공간 로그인이 필요한 서비스입니다! 로그인해 주세요. 🔐");
            showLoginScreen();
            authContainer.classList.remove('hidden');
            return false;
        }
        return true;
    }

    // 로그인 처리
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                loginForm.reset();
                authErrorMsg.classList.add('hidden');
            })
            .catch((error) => {
                let errorMsg = "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMsg = "이메일 또는 비밀번호가 잘못되었습니다.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg = "유효하지 않은 이메일 형식입니다.";
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg = "로그인 시도가 일시적으로 차단되었습니다. 잠시 후 다시 시도해 주세요.";
                }
                showAuthError(errorMsg);
            });
    });

    // 회원가입 처리
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const nickname = document.getElementById('signup-nickname').value.trim();
        const role = document.getElementById('signup-role').value;

        if (password.length < 6) {
            showAuthError("비밀번호는 최소 6자 이상이어야 합니다.");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return db.collection('users').doc(user.uid).set({
                    nickname: nickname,
                    role: role,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                signupForm.reset();
                authErrorMsg.classList.add('hidden');
            })
            .catch((error) => {
                let errorMsg = "회원가입에 실패했습니다.";
                if (error.code === 'auth/email-already-in-use') {
                    errorMsg = "이미 가입된 이메일 주소입니다.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg = "유효하지 않은 이메일 형식입니다.";
                } else if (error.code === 'auth/weak-password') {
                    errorMsg = "비밀번호가 너무 취약합니다.";
                }
                showAuthError(errorMsg);
            });
    });

    // 로그아웃 처리
    dropdownLogoutBtn.addEventListener('click', () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            auth.signOut();
            profileDropdown.classList.add('hidden');
        }
    });

    // 인증 상태 감시자
    auth.onAuthStateChanged((user) => {
        const headerUserName = document.getElementById('header-user-name');
        const dropdownLoggedOut = document.getElementById('dropdown-logged-out');
        const dropdownLoggedIn = document.getElementById('dropdown-logged-in');
        const dropdownUserNickname = document.getElementById('dropdown-user-nickname');
        const dropdownUserRole = document.getElementById('dropdown-user-role');
        const galleryUploadContainer = document.getElementById('gallery-upload-container');

        if (user) {
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        currentUserInfo = {
                            uid: user.uid,
                            nickname: userData.nickname || user.displayName || "가족",
                            role: userData.role || "기타 🤍"
                        };
                    } else {
                        currentUserInfo = {
                            uid: user.uid,
                            nickname: user.displayName || "가족",
                            role: "기타 🤍"
                        };
                    }

                    headerUserName.textContent = currentUserInfo.nickname;
                    dropdownUserNickname.textContent = currentUserInfo.nickname;
                    dropdownUserRole.textContent = currentUserInfo.role;

                    dropdownLoggedOut.classList.add('hidden');
                    dropdownLoggedIn.classList.remove('hidden');
                    authContainer.classList.add('hidden');

                    // 로그인 시에만 여행 갤러리 등록 폼 노출
                    if (galleryUploadContainer) galleryUploadContainer.classList.remove('hidden');

                    // 구성원 카드 렌더링 갱신
                    if (cachedFamilySnapshot) {
                        renderFamilyCards(cachedFamilySnapshot);
                    }

                    // 메인 이미지 수정 배지 활성화
                    const heroEditBadge = document.getElementById('hero-img-edit-trigger');
                    if (heroEditBadge) heroEditBadge.classList.remove('hidden');
                })
                .catch((err) => {
                    console.error("사용자 정보 로드 오류:", err);
                    currentUserInfo = {
                        uid: user.uid,
                        nickname: user.displayName || "가족",
                        role: "기타 🤍"
                    };
                    headerUserName.textContent = currentUserInfo.nickname;
                    dropdownUserNickname.textContent = currentUserInfo.nickname;
                    dropdownUserRole.textContent = currentUserInfo.role;

                    dropdownLoggedOut.classList.add('hidden');
                    dropdownLoggedIn.classList.remove('hidden');
                    authContainer.classList.add('hidden');

                    if (galleryUploadContainer) galleryUploadContainer.classList.remove('hidden');

                    if (cachedFamilySnapshot) {
                        renderFamilyCards(cachedFamilySnapshot);
                    }
                });
        } else {
            currentUserInfo = null;
            headerUserName.textContent = "Login";
            dropdownLoggedOut.classList.remove('hidden');
            dropdownLoggedIn.classList.add('hidden');

            // 로그아웃 시 여행 갤러리 등록 폼 감춤
            if (galleryUploadContainer) galleryUploadContainer.classList.add('hidden');

            if (cachedFamilySnapshot) {
                renderFamilyCards(cachedFamilySnapshot);
            }

            // 메인 이미지 수정 배지 비활성화
            const heroEditBadge = document.getElementById('hero-img-edit-trigger');
            if (heroEditBadge) heroEditBadge.classList.add('hidden');
        }
    });

    function initRealtimeDbListeners() {
        initEventsListener();
        initBoardListener();
        initGuestbookListener();
        initFamilyMembers();
        initSettingsListener();
        initGalleryListener(); // 갤러리 실시간 리스너 추가
    }


    // ----------------------------------------------------
    // 1. 테마 스위처 (다크/라이트 모드)
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
    // 2. 스크롤 진행 바 & Scrollspy
    // ----------------------------------------------------
    const progressBar = document.getElementById('scroll-progress-bar');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';

        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
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
    // 3. 캔버스 파티클 엔진
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


    // ----------------------------------------------------
    // 4. 가족 프로필 카드 3D 뒤집기
    // ----------------------------------------------------
    const memberCards = document.querySelectorAll('.member-card-wrapper');
    memberCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });


    // ----------------------------------------------------
    // 5. 구글 스타일 가족 캘린더 엔진
    // ----------------------------------------------------
    let currentCalDate = new Date();
    const monthYearText = document.getElementById('calendar-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    const calendarModal = document.getElementById('calendar-modal');
    const modalDateTitle = document.getElementById('modal-date-title');
    const eventForm = document.getElementById('event-form');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventColorSelect = document.getElementById('event-color-select');
    const modalEventList = document.getElementById('modal-event-list');
    const modalCloseBtn = document.querySelector('.calendar-modal-close');
    
    let activeSelectedDateStr = ''; 

    let familyEvents = {};
    function initEventsListener() {
        db.collection('events').onSnapshot((snapshot) => {
            familyEvents = {};
            snapshot.forEach((doc) => {
                familyEvents[doc.id] = doc.data().events || [];
            });
            renderCalendar();
            updateAutoTimeline(); // 데이터 갱신 시 타임라인 업데이트 트리거
            if (calendarModal.classList.contains('show') && activeSelectedDateStr) {
                renderModalEventList();
            }
        });
    }

    function renderCalendar() {
        if (!calendarGrid) return;
        calendarGrid.innerHTML = '';
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();

        monthYearText.textContent = `${year}년 ${month + 1}월`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDayDate = new Date(year, month + 1, 0).getDate();
        const prevLastDayDate = new Date(year, month, 0).getDate();

        // 1. 이전 달 날짜들
        for (let i = firstDayIndex; i > 0; i--) {
            const dayNum = prevLastDayDate - i + 1;
            const prevMonthDate = new Date(year, month - 1, dayNum);
            createDayCell(prevMonthDate, false);
        }

        // 2. 이번 달 날짜들
        for (let i = 1; i <= lastDayDate; i++) {
            const currentDayDate = new Date(year, month, i);
            createDayCell(currentDayDate, true);
        }

        // 3. 다음 달 날짜들
        const totalCells = 42;
        const currentCellsCount = firstDayIndex + lastDayDate;
        const nextMonthDaysCount = totalCells - currentCellsCount;

        for (let i = 1; i <= nextMonthDaysCount; i++) {
            const nextMonthDate = new Date(year, month + 1, i);
            createDayCell(nextMonthDate, false);
        }
    }

    function createDayCell(dateObj, isCurrentMonth) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const date = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${date}`;

        if (!isCurrentMonth) dayCell.classList.add('other-month');

        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0) dayCell.classList.add('sun');
        if (dayOfWeek === 6) dayCell.classList.add('sat');

        const today = new Date();
        if (dateObj.getFullYear() === today.getFullYear() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getDate() === today.getDate()) {
            dayCell.classList.add('today');
        }

        dayCell.innerHTML = `<span class="day-number">${dateObj.getDate()}</span>`;

        if (familyEvents[dateStr] && familyEvents[dateStr].length > 0) {
            const eventsWrapper = document.createElement('div');
            eventsWrapper.className = 'day-events-list';
            
            const maxVisibleEvents = 2; 
            const eventsToShow = familyEvents[dateStr].slice(0, maxVisibleEvents);
            
            eventsToShow.forEach(event => {
                const eventBar = document.createElement('div');
                eventBar.className = 'calendar-event-bar';
                eventBar.style.backgroundColor = event.color;
                eventBar.textContent = event.title;
                eventBar.title = event.title; 
                eventsWrapper.appendChild(eventBar);
            });
            
            if (familyEvents[dateStr].length > maxVisibleEvents) {
                const moreText = document.createElement('div');
                moreText.className = 'calendar-event-more';
                moreText.textContent = `+${familyEvents[dateStr].length - maxVisibleEvents}`;
                eventsWrapper.appendChild(moreText);
            }
            
            dayCell.appendChild(eventsWrapper);
        }

        dayCell.addEventListener('click', () => {
            openEventModal(dateStr);
        });

        calendarGrid.appendChild(dayCell);
    }

    prevMonthBtn.addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderCalendar();
    });

    function openEventModal(dateStr) {
        activeSelectedDateStr = dateStr;
        const parts = dateStr.split('-');
        modalDateTitle.textContent = `${parts[0]}년 ${parts[1]}월 ${parts[2]}일 일정 🗓️`;
        
        renderModalEventList();
        calendarModal.classList.add('show');
    }

    modalCloseBtn.addEventListener('click', () => {
        calendarModal.classList.remove('show');
    });

    calendarModal.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            calendarModal.classList.remove('show');
        }
    });

    function renderModalEventList() {
        modalEventList.innerHTML = '';
        const dayEvents = familyEvents[activeSelectedDateStr] || [];

        if (dayEvents.length === 0) {
            modalEventList.innerHTML = '<p class="no-messages" style="padding:1rem;">등록된 일정이 없습니다.</p>';
            return;
        }

        dayEvents.forEach((evt, idx) => {
            const item = document.createElement('div');
            item.className = 'event-item';
            item.style.borderLeftColor = evt.color;

            const isOwner = !evt.uid || (currentUserInfo && (evt.uid === currentUserInfo.uid || evt.author === currentUserInfo.nickname));
            const delBtnHTML = isOwner 
                ? `<button class="event-del-btn" data-index="${idx}"><i class="fa-regular fa-trash-can"></i></button>`
                : '';

            item.innerHTML = `
                <span class="event-item-title">${escapeHTML(evt.title)}</span>
                ${delBtnHTML}
            `;
            modalEventList.appendChild(item);
        });

        modalEventList.querySelectorAll('.event-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                deleteEvent(index);
            });
        });
    }

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkAuth()) return;
        const title = eventTitleInput.value.trim();
        const color = eventColorSelect.value;

        if (!title) return;

        const currentEvents = familyEvents[activeSelectedDateStr] || [];
        const newEvents = [...currentEvents, { 
            title, 
            color,
            uid: currentUserInfo.uid,
            author: currentUserInfo.nickname
        }];

        db.collection('events').doc(activeSelectedDateStr).set({
            events: newEvents
        }).then(() => {
            eventTitleInput.value = ''; 
        }).catch(err => {
            console.error("Error adding event: ", err);
            alert("일정 저장에 실패했습니다. ⚠️");
        });
    });

    function deleteEvent(index) {
        if (!checkAuth()) return;
        if (confirm('이 일정을 삭제하시겠습니까?')) {
            const currentEvents = familyEvents[activeSelectedDateStr] || [];
            currentEvents.splice(index, 1);

            if (currentEvents.length === 0) {
                db.collection('events').doc(activeSelectedDateStr).delete()
                    .catch(err => console.error("Error deleting events: ", err));
            } else {
                db.collection('events').doc(activeSelectedDateStr).set({
                    events: currentEvents
                }).catch(err => console.error("Error updating events: ", err));
            }
        }
    }


    // ----------------------------------------------------
    // 6. 다중 여행 사진 업로드 및 갤러리 렌더링 (고도화 추가)
    // ----------------------------------------------------
    const galleryForm = document.getElementById('gallery-form');
    const galleryTitle = document.getElementById('gallery-title');
    const galleryDesc = document.getElementById('gallery-desc');
    const galleryCategory = document.getElementById('gallery-category');
    const galleryFiles = document.getElementById('gallery-files');
    const galleryImgPreviews = document.getElementById('gallery-img-previews');
    const galleryGrid = document.getElementById('gallery-grid');

    let compressedGalleryImages = []; // 다중 업로드용 압축 이미지 캐시 배열

    // 갤러리 파일 다중 업로드 & 리사이징 압축
    if (galleryFiles) {
        galleryFiles.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            galleryImgPreviews.innerHTML = '';
            compressedGalleryImages = [];

            if (files.length === 0) return;

            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        // 여행사진 최적화: 가로 최대 600px, 65% 압축 (용량 극최소화)
                        const max_width = 600;
                        let width = img.width;
                        let height = img.height;

                        if (width > max_width) {
                            height = Math.round((height * max_width) / width);
                            width = max_width;
                        }

                        const canvasTemp = document.createElement('canvas');
                        canvasTemp.width = width;
                        canvasTemp.height = height;
                        const ctxTemp = canvasTemp.getContext('2d');
                        ctxTemp.drawImage(img, 0, 0, width, height);

                        const base64Str = canvasTemp.toDataURL('image/jpeg', 0.65);
                        compressedGalleryImages.push(base64Str);

                        // 미리보기 썸네일 노출
                        const previewItem = document.createElement('div');
                        previewItem.className = 'gallery-preview-item';
                        previewItem.innerHTML = `
                            <img src="${base64Str}" alt="미리보기">
                            <button type="button" class="del-btn" data-index="${index}">&times;</button>
                        `;
                        
                        // 미리보기 삭제 버튼 바인딩
                        previewItem.querySelector('.del-btn').addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            previewItem.remove();
                            compressedGalleryImages.splice(index, 1);
                        });

                        galleryImgPreviews.appendChild(previewItem);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // 갤러리 폼 제출 (Firestore 저장)
    if (galleryForm) {
        galleryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!checkAuth()) return;

            const title = galleryTitle.value.trim();
            const desc = galleryDesc.value.trim();
            const category = galleryCategory.value;

            if (!title || !desc || compressedGalleryImages.length === 0) {
                alert("제목, 설명 및 사진을 등록해주세요! 📷");
                return;
            }

            const newAlbum = {
                title,
                desc,
                category,
                images: compressedGalleryImages, // 압축된 다중 base64 이미지 배열
                author: currentUserInfo.nickname,
                uid: currentUserInfo.uid,
                date: new Date().getTime()
            };

            db.collection('gallery_posts').add(newAlbum).then(() => {
                galleryForm.reset();
                galleryImgPreviews.innerHTML = '';
                compressedGalleryImages = [];
                alert("소중한 추억 앨범이 등록되었습니다! ✈️");
            }).catch(err => {
                console.error("갤러리 저장 에러:", err);
                alert("갤러리 저장 실패! ⚠️");
            });
        });
    }

    // 기본 정적 앨범 2개 정의 (예비용)
    const defaultGalleryPosts = [
        {
            id: "default_1",
            category: "travel",
            title: "가을 숲속 오두막 힐링 여행",
            desc: "바쁜 일상을 잠시 내려두고 맑은 호수와 붉은 단풍이 가득한 오두막에서 보낸 주말.",
            images: ["./assets/dodo_gallery_1.png"],
            author: "DODO Family",
            date: 1761400000000
        },
        {
            id: "default_2",
            category: "daily",
            title: "주말 저녁의 따뜻한 만찬",
            desc: "벽난로 온기 속에 모여 앉아 서로의 하루를 나누며 웃음 지었던 주말 식사 시간.",
            images: ["./assets/dodo_gallery_2.png"],
            author: "DODO Family",
            date: 1761300000000
        }
    ];

    let galleryPosts = [];
    function initGalleryListener() {
        db.collection('gallery_posts').orderBy('date', 'desc').onSnapshot(snapshot => {
            const dbPosts = [];
            snapshot.forEach(doc => {
                dbPosts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // 기본 로컬 이미지와 병합
            galleryPosts = [...dbPosts, ...defaultGalleryPosts];
            renderGallery();
        }, err => console.error("갤러리 로드 에러:", err));
    }

    // 갤러리 카드 그리기
    function renderGallery() {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = '';

        galleryPosts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'gallery-item glass-card';
            item.setAttribute('data-category', post.category);

            // 첫 번째 대표 사진 설정
            const firstImg = post.images && post.images.length > 0 ? post.images[0] : './assets/dodo_hero.png';
            
            // 사진이 여러 장일 경우 상단 배지 노출
            const multiBadgeHTML = post.images && post.images.length > 1
                ? `<div class="gallery-multi-badge"><i class="fa-regular fa-images"></i> +${post.images.length}장</div>`
                : '';

            // 삭제 버튼 (본인 글만 노출)
            const isOwner = currentUserInfo && (post.uid === currentUserInfo.uid);
            const delBtnHTML = isOwner
                ? `<button class="delete-btn gallery-del-btn" data-id="${post.id}" style="position: absolute; bottom: 15px; right: 15px; font-size: 0.8rem; background:rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);"><i class="fa-regular fa-trash-can"></i> 삭제</button>`
                : '';

            item.innerHTML = `
                <div class="gallery-img-container" style="position: relative;">
                    ${multiBadgeHTML}
                    <img src="${firstImg}" alt="${post.title}">
                    <div class="gallery-overlay">
                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                    </div>
                </div>
                <div class="gallery-content" style="position: relative; padding-bottom: 3.5rem;">
                    <span class="gallery-tag">${post.category === 'travel' ? '가족 여행 ✈️' : '소소한 일상 ☕'}</span>
                    <h3 class="gallery-item-title">${escapeHTML(post.title)}</h3>
                    <p class="gallery-item-desc">${escapeHTML(post.desc)}</p>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; font-weight: 600;"><i class="fa-solid fa-user"></i> ${escapeHTML(post.author)}</p>
                    ${delBtnHTML}
                </div>
            `;

            // 클릭 시 슬라이더 라이트박스 연동
            item.querySelector('.gallery-img-container').addEventListener('click', () => {
                openLightboxSlider(post.images || [], post.title);
            });

            // 삭제 이벤트 연결
            if (isOwner) {
                item.querySelector('.gallery-del-btn').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (confirm("이 앨범을 삭제하시겠습니까?")) {
                        db.collection('gallery_posts').doc(post.id).delete()
                            .catch(err => console.error("갤러리 삭제 에러:", err));
                    }
                });
            }

            galleryGrid.appendChild(item);
        });

        // 갤러리 필터 작동 동기화
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        if (activeFilterBtn) {
            const filterValue = activeFilterBtn.getAttribute('data-filter');
            applyGalleryFilter(filterValue);
        }
    }

    // 갤러리 필터 필터링 전용 유틸
    function applyGalleryFilter(filterValue) {
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => {
            const category = item.getAttribute('data-category');
            if (filterValue === 'all' || category === filterValue) {
                item.classList.remove('hide');
                item.style.transform = 'scale(1)';
                item.style.opacity = '1';
            } else {
                item.style.transform = 'scale(0.8)';
                item.style.opacity = '0';
                item.classList.add('hide');
            }
        });
    }

    // 갤러리 필터링 버튼 클릭 연동
    const galleryFilterBtns = document.querySelectorAll('.filter-btn');
    galleryFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            galleryFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyGalleryFilter(btn.getAttribute('data-filter'));
        });
    });


    // ----------------------------------------------------
    // 6-2. 다중 이미지 슬라이더 라이트박스 뷰어 (고도화 추가)
    // ----------------------------------------------------
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxIndexIndicator = document.getElementById('lightbox-index-indicator');
    const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
    const lightboxNextBtn = document.getElementById('lightbox-next-btn');
    const closeBtn = document.querySelector('.close-btn');

    let activeSliderImages = []; // 현재 슬라이드할 이미지 목록
    let activeSliderIndex = 0; // 현재 인덱스

    function openLightboxSlider(images, caption) {
        activeSliderImages = images;
        activeSliderIndex = 0;

        if (images.length === 0) return;

        // 라이트박스에 상태 반영
        lightboxImg.setAttribute('src', images[0]);
        lightboxCaption.textContent = caption;
        
        updateSliderIndicator();
        lightboxModal.classList.add('show');
    }

    function updateSliderIndicator() {
        const total = activeSliderImages.length;
        if (total <= 1) {
            // 이미지가 1장일 경우 화살표와 인디케이터 숨김
            lightboxPrevBtn.style.display = 'none';
            lightboxNextBtn.style.display = 'none';
            lightboxIndexIndicator.style.display = 'none';
        } else {
            lightboxPrevBtn.style.display = 'flex';
            lightboxNextBtn.style.display = 'flex';
            lightboxIndexIndicator.style.display = 'block';
            lightboxIndexIndicator.textContent = `${activeSliderIndex + 1} / ${total}`;
        }
    }

    // 슬라이더 이전 사진 이동
    lightboxPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeSliderImages.length <= 1) return;
        activeSliderIndex = (activeSliderIndex - 1 + activeSliderImages.length) % activeSliderImages.length;
        lightboxImg.setAttribute('src', activeSliderImages[activeSliderIndex]);
        updateSliderIndicator();
    });

    // 슬라이더 다음 사진 이동
    lightboxNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeSliderImages.length <= 1) return;
        activeSliderIndex = (activeSliderIndex + 1) % activeSliderImages.length;
        lightboxImg.setAttribute('src', activeSliderImages[activeSliderIndex]);
        updateSliderIndicator();
    });

    closeBtn.addEventListener('click', () => {
        lightboxModal.classList.remove('show');
    });

    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            lightboxModal.classList.remove('show');
        }
    });


    // ----------------------------------------------------
    // 7. 사진 업로드형 가족 게시판 로직 (Canvas 압축 & 저장)
    // ----------------------------------------------------
    const boardForm = document.getElementById('board-form');
    const boardTitle = document.getElementById('board-title');
    const boardFile = document.getElementById('board-file');
    const boardContent = document.getElementById('board-content');
    const boardImgPreview = document.getElementById('board-img-preview');
    const boardPostsGrid = document.getElementById('board-posts-grid');

    let compressedImageBase64 = ''; // 압축된 이미지 캐시 변수

    boardFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            boardImgPreview.style.display = 'none';
            boardImgPreview.innerHTML = '';
            compressedImageBase64 = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const max_width = 600;
                let width = img.width;
                let height = img.height;

                if (width > max_width) {
                    height = Math.round((height * max_width) / width);
                    width = max_width;
                }

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0, width, height);

                compressedImageBase64 = tempCanvas.toDataURL('image/jpeg', 0.7);

                boardImgPreview.innerHTML = `<img src="${compressedImageBase64}" alt="업로드 이미지 미리보기">`;
                boardImgPreview.style.display = 'block';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    let boardPosts = [];
    function initBoardListener() {
        db.collection('board_posts').orderBy('date', 'desc').onSnapshot((snapshot) => {
            boardPosts = [];
            snapshot.forEach((doc) => {
                boardPosts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderBoardPosts();
            updateAutoTimeline(); // 데이터 갱신 시 타임라인 업데이트 트리거
        });
    }

    function renderBoardPosts() {
        if (!boardPostsGrid) return;
        boardPostsGrid.innerHTML = '';

        const filteredPosts = activeBoardFilter === 'all'
            ? boardPosts
            : boardPosts.filter(post => post.role === activeBoardFilter);

        if (filteredPosts.length === 0) {
            boardPostsGrid.innerHTML = `
                <div class="no-posts">
                    <p><i class="fa-regular fa-folder-open"></i> 아직 등록된 게시글이 없어요. 사진과 글을 올려보세요!</p>
                </div>
            `;
            return;
        }

        filteredPosts.forEach((post) => {
            const postCard = document.createElement('div');
            postCard.className = 'board-post-card glass-card';

            const dateStr = new Date(post.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            const imgHeaderHTML = post.image 
                ? `<div class="post-img-header"><img src="${post.image}" alt="게시글 대표 사진"></div>`
                : `<div class="post-img-header"><div class="post-no-img"><i class="fa-regular fa-image"></i></div></div>`;

            const isOwner = currentUserInfo && (post.uid === currentUserInfo.uid || (!post.uid && post.author === currentUserInfo.nickname));
            const footerHTML = isOwner 
                ? `<div class="post-footer" style="display: flex; gap: 10px;">
                        <button class="edit-btn board-post-edit-btn" data-id="${post.id}" title="게시글 수정">
                            <i class="fa-regular fa-pen-to-square"></i> 수정하기
                        </button>
                        <button class="delete-btn board-post-del-btn" data-id="${post.id}" title="게시글 삭제">
                            <i class="fa-regular fa-trash-can"></i> 삭제하기
                        </button>
                   </div>`
                : '';

            postCard.innerHTML = `
                ${imgHeaderHTML}
                <div class="post-body">
                    <div>
                        <div class="post-meta">
                            <span class="post-author"><i class="fa-solid fa-user-pen"></i> ${escapeHTML(post.author)} (${post.role || '가족 🤍'})</span>
                            <span class="post-date"><i class="fa-regular fa-clock"></i> ${dateStr}</span>
                        </div>
                        <h4 class="post-title">${escapeHTML(post.title)}</h4>
                        <p class="post-text">${escapeHTML(post.content).replace(/\n/g, '<br>')}</p>
                    </div>
                    ${footerHTML}
                </div>
            `;
            boardPostsGrid.appendChild(postCard);
        });

        boardPostsGrid.querySelectorAll('.board-post-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteBoardPost(id);
            });
        });

        boardPostsGrid.querySelectorAll('.board-post-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                startEditBoardPost(id);
            });
        });
    }

    const boardFilterBtns = document.querySelectorAll('.board-filter-btn');
    boardFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            boardFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeBoardFilter = btn.getAttribute('data-filter');
            renderBoardPosts();
        });
    });

    function resetBoardForm() {
        boardForm.reset();
        boardForm.removeAttribute('data-edit-id');
        
        const formTitle = boardForm.parentNode.querySelector('h3');
        if (formTitle) formTitle.textContent = '이야기 등록하기';
        
        const submitBtn = boardForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '등록하기 <i class="fa-solid fa-pen-nib"></i>';
        
        const cancelBtn = document.getElementById('board-edit-cancel-btn');
        if (cancelBtn) cancelBtn.remove();
        
        boardImgPreview.style.display = 'none';
        boardImgPreview.innerHTML = '';
        compressedImageBase64 = '';
    }

    function startEditBoardPost(id) {
        if (!checkAuth()) return;
        
        db.collection('board_posts').doc(id).get()
            .then(doc => {
                if (doc.exists) {
                    const post = doc.data();
                    const isOwner = currentUserInfo && (post.uid === currentUserInfo.uid || (!post.uid && post.author === currentUserInfo.nickname));
                    if (!isOwner) {
                        alert("작성자 본인만 수정할 수 있습니다! 🔐");
                        return;
                    }
                    
                    boardForm.setAttribute('data-edit-id', id);
                    boardTitle.value = post.title || '';
                    boardContent.value = post.content || '';
                    
                    if (post.image) {
                        compressedImageBase64 = post.image;
                        boardImgPreview.innerHTML = `<img src="${compressedImageBase64}" alt="업로드 이미지 미리보기">`;
                        boardImgPreview.style.display = 'block';
                    } else {
                        compressedImageBase64 = '';
                        boardImgPreview.style.display = 'none';
                        boardImgPreview.innerHTML = '';
                    }
                    
                    const formTitle = boardForm.parentNode.querySelector('h3');
                    if (formTitle) formTitle.innerHTML = '이야기 수정하기 ✏️';
                    
                    const submitBtn = boardForm.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.innerHTML = '수정 완료 <i class="fa-solid fa-check"></i>';
                    
                    if (!document.getElementById('board-edit-cancel-btn')) {
                        const cancelBtn = document.createElement('button');
                        cancelBtn.type = 'button';
                        cancelBtn.id = 'board-edit-cancel-btn';
                        cancelBtn.className = 'btn btn-secondary w-100';
                        cancelBtn.style.marginTop = '10px';
                        cancelBtn.innerHTML = '수정 취소 <i class="fa-solid fa-xmark"></i>';
                        cancelBtn.addEventListener('click', resetBoardForm);
                        boardForm.appendChild(cancelBtn);
                    }
                    
                    boardForm.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(err => console.error("Error getting post details:", err));
    }

    boardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkAuth()) return;

        const author = currentUserInfo.nickname;
        const role = currentUserInfo.role;
        const title = boardTitle.value.trim();
        const content = boardContent.value.trim();

        if (!author || !title || !content) return;

        const editId = boardForm.getAttribute('data-edit-id');

        if (editId) {
            db.collection('board_posts').doc(editId).update({
                title,
                content,
                image: compressedImageBase64
            }).then(() => {
                resetBoardForm();
            }).catch(err => {
                console.error("Error updating post: ", err);
                alert("게시글 수정 실패! ⚠️");
            });
        } else {
            const newPost = {
                author,
                role,
                title,
                content,
                image: compressedImageBase64,
                date: new Date().getTime(),
                uid: currentUserInfo.uid
            };

            db.collection('board_posts').add(newPost).then(() => {
                resetBoardForm();
            }).catch(err => {
                console.error("Error adding post: ", err);
                alert("게시글 저장 실패! ⚠️");
            });
        }
    });

    function deleteBoardPost(id) {
        if (!checkAuth()) return;
        if (confirm('이 게시글을 정말로 삭제할까요?')) {
            db.collection('board_posts').doc(id).delete()
                .catch(err => console.error("Error deleting post: ", err));
        }
    }


    // ----------------------------------------------------
    // 8. AI 룰 기반 실시간 자동 타임라인 갱신 엔진 (고도화 추가)
    // ----------------------------------------------------
    const timelineGridDynamic = document.getElementById('timeline-grid-dynamic');

    function updateAutoTimeline() {
        if (!timelineGridDynamic) return;
        timelineGridDynamic.innerHTML = '';

        let combinedTimelineData = [];

        // 1) 캘린더 일정 데이터 파싱 & 병합
        for (const dateKey in familyEvents) {
            const events = familyEvents[dateKey];
            events.forEach(evt => {
                combinedTimelineData.push({
                    title: `달력 일정: ${evt.title}`,
                    content: `${dateKey}에 예정된 DODO 가족의 일정입니다. 작성자: ${evt.author || '가족'}`,
                    date: new Date(dateKey + 'T00:00:00').getTime(),
                    type: 'calendar',
                    rawText: evt.title + ' ' + (evt.author || '')
                });
            });
        }

        // 2) 소식 게시글 데이터 병합
        boardPosts.forEach(post => {
            combinedTimelineData.push({
                title: post.title,
                content: post.content,
                date: post.date,
                type: 'board',
                image: post.image,
                author: post.author,
                rawText: post.title + ' ' + post.content + ' ' + post.author
            });
        });

        // 3) 방명록 메시지 데이터 병합
        messages.forEach(msg => {
            combinedTimelineData.push({
                title: `${msg.author}님의 방명록 한마디 💌`,
                content: msg.message,
                date: msg.date,
                type: 'guestbook',
                sticker: msg.sticker,
                rawText: msg.message + ' ' + msg.author
            });
        });

        // 날짜 역순(최신순) 정렬
        combinedTimelineData.sort((a, b) => b.date - a.date);

        if (combinedTimelineData.length === 0) {
            timelineGridDynamic.innerHTML = '<p class="no-messages" style="padding: 2rem;">타임라인에 등록할 데이터가 아직 없습니다.</p>';
            return;
        }

        // 지능형 AI 텍스트 분석 매핑 규칙
        const travelKeywords = ['여행', '캠핑', '바다', '산', '오두막', '제주', '해외', '나들이', '소풍', '놀러', '비행기', '휴가'];
        const celebKeywords = ['생신', '생일', '결혼', '축하', '기념일', '파티', '돌잔치', '환갑', '칠순', '선물', '주년', '개설', '오픈', '탄생'];
        const petKeywords = ['도도', '고양이', '강아지', '반려묘', '츄르', '야옹', '동물', '산책', '막둥이'];
        const studyKeywords = ['공부', '시험', '합격', '취업', '학교', '입학', '졸업', '자격증', '성적', '상장', 'IT', '코딩', '마스터'];
        const foodKeywords = ['식사', '맛집', '저녁', '만찬', '요리', '외식', '카페', '커피', '베이킹', '디너', '먹'];

        combinedTimelineData.forEach((item, index) => {
            const dateStr = new Date(item.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            // 기본값 설정 (가족 소식)
            let iconClass = 'fa-heart-pulse';
            let bgClass = 'bg-blue';
            let themeText = '가족 소식 🤍';

            // AI 판단 분석 (키워드 매칭)
            const textToAnalyze = item.rawText.toLowerCase();

            if (travelKeywords.some(kw => textToAnalyze.includes(kw))) {
                iconClass = 'fa-campground';
                bgClass = 'bg-orange';
                themeText = '여행 및 추억 🏕️';
            } else if (celebKeywords.some(kw => textToAnalyze.includes(kw))) {
                iconClass = 'fa-cake-candles';
                bgClass = 'bg-pink';
                themeText = '기념일 및 파티 🎉';
            } else if (petKeywords.some(kw => textToAnalyze.includes(kw))) {
                iconClass = 'fa-cat';
                bgClass = 'bg-purple';
                themeText = '반려가족 도도 🐱';
            } else if (studyKeywords.some(kw => textToAnalyze.includes(kw))) {
                iconClass = 'fa-graduation-cap';
                bgClass = 'bg-blue';
                themeText = '학업 및 성취 🎓';
            } else if (foodKeywords.some(kw => textToAnalyze.includes(kw))) {
                iconClass = 'fa-utensils';
                bgClass = 'bg-green';
                themeText = '가족 만찬 🍽️';
            }

            const leftOrRightClass = index % 2 === 0 ? 'left-item' : 'right-item';
            
            // 이미지 배너 HTML
            const imgHTML = item.image ? `<div style="width:100%; height:120px; overflow:hidden; border-radius:10px; margin-bottom:10px;"><img src="${item.image}" style="width:100%; height:100%; object-fit:cover;"></div>` : '';
            
            // 방명록 스티커 HTML
            const stickerHTML = item.sticker ? `<span style="font-size: 1.5rem; float: right; margin-top: -5px;">${item.sticker}</span>` : '';

            const timelineCardHTML = `
                <div class="timeline-item ${leftOrRightClass} show">
                    <div class="timeline-dot ${bgClass}"></div>
                    <div class="timeline-card glass-card">
                        <span class="timeline-date">${dateStr} [${themeText}]</span>
                        ${stickerHTML}
                        <h3 class="timeline-title"><i class="fa-solid ${iconClass}" style="margin-right: 6px; color:var(--primary-color);"></i> ${escapeHTML(item.title)}</h3>
                        ${imgHTML}
                        <p>${escapeHTML(item.content).replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            `;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = timelineCardHTML.trim();
            timelineGridDynamic.appendChild(tempDiv.firstChild);
        });

        // 새로고침 시 관찰자 등록
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('#timeline-grid-dynamic .timeline-item').forEach(item => {
            observer.observe(item);
        });
    }

    // 스크롤 트리거 타임라인 애니메이션 (구버전은 비활성화)
    const timelineItems = document.querySelectorAll('.timeline-item');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const timelineObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });


    // ----------------------------------------------------
    // 9. 가상 방명록 로직
    // ----------------------------------------------------
    const guestbookForm = document.getElementById('guestbook-form');
    const messageInput = document.getElementById('message-input');
    const guestbookList = document.getElementById('guestbook-list');

    let messages = [];
    function initGuestbookListener() {
        db.collection('messages').orderBy('date', 'desc').onSnapshot((snapshot) => {
            messages = [];
            const likedMessages = JSON.parse(localStorage.getItem('dodo-liked-messages')) || [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const msgId = doc.id;
                messages.push({
                    id: msgId,
                    author: data.author,
                    role: data.role || "가족 🤍",
                    message: data.message,
                    sticker: data.sticker,
                    date: data.date,
                    likes: data.likes || 0,
                    liked: likedMessages.includes(msgId),
                    uid: data.uid
                });
            });
            renderMessages();
            updateAutoTimeline(); // 데이터 갱신 시 타임라인 업데이트 트리거
        });
    }

    function renderMessages() {
        if (!guestbookList) return;
        guestbookList.innerHTML = '';

        if (messages.length === 0) {
            guestbookList.innerHTML = `
                <div class="no-messages">
                    <p><i class="fa-regular fa-comment-dots"></i> 아직 남겨진 메시지가 없어요. 첫 번째 메시지를 남겨보세요!</p>
                </div>
            `;
            return;
        }

        messages.forEach((msg) => {
            const card = document.createElement('div');
            card.className = 'guest-card glass-card';

            const dateStr = new Date(msg.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const isOwner = currentUserInfo && (msg.uid === currentUserInfo.uid || (!msg.uid && msg.author === currentUserInfo.nickname));
            const actionsHTML = isOwner 
                ? `<div class="guest-actions" style="display: flex; gap: 8px; margin-left: 10px;">
                        <button class="edit-btn msg-edit-btn" data-id="${msg.id}" title="메시지 수정">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button class="delete-btn msg-del-btn" data-id="${msg.id}" title="메시지 삭제">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                   </div>`
                : '';

            card.innerHTML = `
                <div class="guest-card-header">
                    <span class="guest-author"><i class="fa-solid fa-user-circle"></i> ${escapeHTML(msg.author)} (${msg.role})</span>
                    <span class="guest-date">${dateStr}</span>
                </div>
                <p class="guest-text">${escapeHTML(msg.message).replace(/\n/g, '<br>')}</p>
                <div class="guest-card-footer">
                    <button class="heart-btn ${msg.liked ? 'liked' : ''}" data-id="${msg.id}">
                        <i class="fa-${msg.liked ? 'solid' : 'regular'} fa-heart"></i> 
                        <span class="like-count">${msg.likes || 0}</span>
                    </button>
                    <span class="guest-sticker">${msg.sticker}</span>
                    ${actionsHTML}
                </div>
            `;
            guestbookList.appendChild(card);
        });

        document.querySelectorAll('.heart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                toggleLike(id);
            });
        });

        guestbookList.querySelectorAll('.msg-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteMessage(id);
            });
        });

        guestbookList.querySelectorAll('.msg-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                startEditGuestbookMessage(id);
            });
        });
    }

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

    function resetGuestbookForm() {
        guestbookForm.reset();
        guestbookForm.removeAttribute('data-edit-id');

        const formTitle = guestbookForm.parentNode.querySelector('h3');
        if (formTitle) formTitle.textContent = '메시지 작성하기';

        const submitBtn = guestbookForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '등록하기 <i class="fa-solid fa-paper-plane"></i>';

        const cancelBtn = document.getElementById('guestbook-edit-cancel-btn');
        if (cancelBtn) cancelBtn.remove();

        messageInput.value = '';
        document.getElementById('st-heart').checked = true;
    }

    function startEditGuestbookMessage(id) {
        if (!checkAuth()) return;

        db.collection('messages').doc(id).get()
            .then(doc => {
                if (doc.exists) {
                    const msg = doc.data();
                    const isOwner = currentUserInfo && (msg.uid === currentUserInfo.uid || (!msg.uid && msg.author === currentUserInfo.nickname));
                    if (!isOwner) {
                        alert("작성자 본인만 수정할 수 있습니다! 🔐");
                        return;
                    }

                    guestbookForm.setAttribute('data-edit-id', id);
                    messageInput.value = msg.message || '';

                    const stickerInput = document.querySelector(`input[name="sticker"][value="${msg.sticker}"]`);
                    if (stickerInput) {
                        stickerInput.checked = true;
                    }

                    const formTitle = guestbookForm.parentNode.querySelector('h3');
                    if (formTitle) formTitle.innerHTML = '메시지 수정하기 ✏️';

                    const submitBtn = guestbookForm.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.innerHTML = '수정 완료 <i class="fa-solid fa-check"></i>';

                    if (!document.getElementById('guestbook-edit-cancel-btn')) {
                        const cancelBtn = document.createElement('button');
                        cancelBtn.type = 'button';
                        cancelBtn.id = 'guestbook-edit-cancel-btn';
                        cancelBtn.className = 'btn btn-secondary w-100';
                        cancelBtn.style.marginTop = '10px';
                        cancelBtn.innerHTML = '수정 취소 <i class="fa-solid fa-xmark"></i>';
                        cancelBtn.addEventListener('click', resetGuestbookForm);
                        guestbookForm.appendChild(cancelBtn);
                    }

                    guestbookForm.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(err => console.error("Error getting message details:", err));
    }

    guestbookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkAuth()) return;

        const author = currentUserInfo.nickname;
        const role = currentUserInfo.role;
        const message = messageInput.value.trim();
        const selectedSticker = document.querySelector('input[name="sticker"]:checked').value;

        if (!author || !message) return;

        const editId = guestbookForm.getAttribute('data-edit-id');

        if (editId) {
            db.collection('messages').doc(editId).update({
                message,
                sticker: selectedSticker
            }).then(() => {
                resetGuestbookForm();
            }).catch(err => {
                console.error("Error updating message: ", err);
                alert("방명록 수정 실패! ⚠️");
            });
        } else {
            const newMessage = {
                author,
                role,
                message,
                sticker: selectedSticker,
                date: new Date().getTime(),
                likes: 0,
                uid: currentUserInfo.uid
            };

            db.collection('messages').add(newMessage).then(() => {
                resetGuestbookForm();
            }).catch(err => {
                console.error("Error adding message: ", err);
                alert("방명록 저장 실패! ⚠️");
            });
        }
    });

    function toggleLike(id) {
        if (!checkAuth()) return;
        const likedMessages = JSON.parse(localStorage.getItem('dodo-liked-messages')) || [];
        const msgRef = db.collection('messages').doc(id);

        db.runTransaction((transaction) => {
            return transaction.get(msgRef).then((sfDoc) => {
                if (!sfDoc.exists) {
                    throw "Document does not exist!";
                }

                const currentLikes = sfDoc.data().likes || 0;
                let newLikes = currentLikes;
                let newLikedList = [...likedMessages];

                if (likedMessages.includes(id)) {
                    newLikes = Math.max(0, currentLikes - 1);
                    newLikedList = newLikedList.filter(item => item !== id);
                } else {
                    newLikes = currentLikes + 1;
                    newLikedList.push(id);
                }

                transaction.update(msgRef, { likes: newLikes });
                return newLikedList;
            });
        }).then((newLikedList) => {
            localStorage.setItem('dodo-liked-messages', JSON.stringify(newLikedList));
        }).catch((err) => {
            console.error("Transaction failed: ", err);
        });
    }

    function deleteMessage(id) {
        if (!checkAuth()) return;
        if (confirm('이 방명록 글을 정말 삭제할까요?')) {
            db.collection('messages').doc(id).delete()
                .catch(err => console.error("Error deleting message: ", err));
        }
    }


    // ----------------------------------------------------
    // 13. 모바일 퀵 네비게이션 제어
    // ----------------------------------------------------
    const mobileNavBtn = document.getElementById('mobile-nav-btn');
    const mobileNavDropdown = document.getElementById('mobile-nav-dropdown');

    if (mobileNavBtn && mobileNavDropdown) {
        mobileNavBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileNavDropdown.classList.toggle('hidden');
        });

        mobileNavDropdown.querySelectorAll('.mobile-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = 90;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
                mobileNavDropdown.classList.add('hidden');
            });
        });

        document.addEventListener('click', () => {
            mobileNavDropdown.classList.add('hidden');
        });
    }


    // ----------------------------------------------------
    // 14. 가족 구성원 프로필 Firestore 연동 및 관리
    // ----------------------------------------------------
    const familyGrid = document.getElementById('family-grid');
    const familyModal = document.getElementById('family-modal');
    const familyModalClose = document.getElementById('family-modal-close');
    const familyEditForm = document.getElementById('family-edit-form');
    const dropdownManageFamilyBtn = document.getElementById('dropdown-manage-family-btn');

    const defaultFamilyData = [
        {
            id: "daddy",
            name: "아빠 (DODO-Daddy)",
            role: "든든한 울타리 & IT 마스터",
            iconClass: "fa-user-tie",
            iconBg: "bg-blue",
            hobby: "캠핑, 전자기기 수집",
            comment: "오늘보다 더 나은 내일을 위해!",
            like: "진한 에스프레소",
            order: 1
        },
        {
            id: "mommy",
            name: "엄마 (DODO-Mommy)",
            role: "따뜻한 등대 & 요리 여왕",
            iconClass: "fa-spa",
            iconBg: "bg-pink",
            hobby: "홈가드닝, 베이킹",
            comment: "매 순간을 온전히 감사하며 사랑하기",
            like: "로즈마리 향기",
            order: 2
        },
        {
            id: "junior",
            name: "첫째 (DODO-Junior)",
            role: "호기심 많은 모험가 & 그림 작가",
            iconClass: "fa-graduation-cap",
            iconBg: "bg-orange",
            hobby: "드로잉, 자전거 라이딩",
            comment: "세상은 신나는 탐험으로 가득 차 있어!",
            like: "디지털 드로잉",
            order: 3
        },
        {
            id: "dodo",
            name: "막둥이 도도 (DODO)",
            role: "가족의 비타민 & 잠자는 냥이",
            iconClass: "fa-cat",
            iconBg: "bg-purple",
            hobby: "캣타워 올라가기, 츄르 먹기",
            comment: "야옹~ (츄르 더 줘라냥)",
            like: "햇볕이 드는 따뜻한 바닥",
            order: 4
        }
    ];

    let cachedFamilySnapshot = null;

    function renderFamilyCards(snapshot) {
        if (!familyGrid) return;
        familyGrid.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const memberCard = createMemberCardHTML(doc.id, data);
            familyGrid.appendChild(memberCard);
        });

        bindCardFlipInteractions();
    }

    window.initFamilyMembers = function() {
        const membersRef = db.collection('family_members');

        membersRef.orderBy('order').onSnapshot(snapshot => {
            if (snapshot.empty) {
                const batch = db.batch();
                defaultFamilyData.forEach(item => {
                    const docRef = membersRef.doc(item.id);
                    batch.set(docRef, item);
                });
                batch.commit().then(() => {
                    console.log("기본 가족 구성원 데이터 시딩 완료");
                }).catch(err => console.error("데이터 시딩 오류:", err));
                return;
            }

            cachedFamilySnapshot = snapshot;
            renderFamilyCards(snapshot);
        }, err => console.error("가족 구성원 정보 로드 에러:", err));
    }

    function createMemberCardHTML(id, data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'member-card-wrapper';
        
        const editBtnHTML = currentUserInfo 
            ? `<div class="member-edit-btn" data-id="${id}" title="프로필 수정"><i class="fa-solid fa-pen-to-square"></i></div>` 
            : '';

        wrapper.innerHTML = `
            <div class="member-card">
                <div class="card-front glass-card">
                    ${editBtnHTML}
                    <div class="member-icon ${data.iconBg || 'bg-blue'}">
                        <i class="fa-solid ${data.iconClass || 'fa-user-tie'}"></i>
                    </div>
                    <h3 class="member-name">${data.name || ''}</h3>
                    <p class="member-role">${data.role || ''}</p>
                    <span class="card-flip-hint">클릭해서 더 알아보기 <i class="fa-solid fa-rotate"></i></span>
                </div>
                <div class="card-back glass-card">
                    <h3>${(data.name || '').split(' ')[0]}의 관심사</h3>
                    <ul class="member-details">
                        <li><i class="fa-solid fa-heart text-pink"></i> 취미: ${data.hobby || ''}</li>
                        <li><i class="fa-solid fa-comment-dots text-blue"></i> 한마디: "${data.comment || ''}"</li>
                        <li><i class="fa-solid fa-gift text-purple"></i> 좋아하는 것: ${data.like || ''}</li>
                    </ul>
                </div>
            </div>
        `;

        if (currentUserInfo) {
            const editBtn = wrapper.querySelector('.member-edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    openFamilyEditModal(id, data);
                });
            }
        }

        return wrapper;
    }

    function bindCardFlipInteractions() {
        const cards = document.querySelectorAll('.member-card-wrapper');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });
        });
    }

    function openFamilyEditModal(id, data) {
        if (!checkAuth()) return;
        
        document.getElementById('edit-member-id').value = id;
        document.getElementById('edit-member-name').value = data.name || '';
        document.getElementById('edit-member-role').value = data.role || '';
        document.getElementById('edit-member-hobby').value = data.hobby || '';
        document.getElementById('edit-member-comment').value = data.comment || '';
        document.getElementById('edit-member-like').value = data.like || '';

        const selectIcon = document.getElementById('edit-member-icon');
        if (selectIcon) {
            const iconVal = `${data.iconClass || 'fa-user-tie'}|${data.iconBg || 'bg-blue'}`;
            
            for (let i = 0; i < selectIcon.options.length; i++) {
                if (selectIcon.options[i].value === iconVal) {
                    selectIcon.selectedIndex = i;
                    break;
                }
            }
        }

        if (familyModal) {
            familyModal.classList.add('show');
        }
    }

    if (familyModalClose) {
        familyModalClose.addEventListener('click', () => {
            familyModal.classList.remove('show');
        });
    }
    if (familyModal) {
        familyModal.addEventListener('click', (e) => {
            if (e.target === familyModal) {
                familyModal.classList.remove('show');
            }
        });
    }

    if (dropdownManageFamilyBtn) {
        dropdownManageFamilyBtn.addEventListener('click', () => {
            db.collection('family_members').orderBy('order').limit(1).get()
                .then(querySnapshot => {
                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        openFamilyEditModal(doc.id, doc.data());
                    } else {
                        openFamilyEditModal('daddy', defaultFamilyData[0]);
                    }
                }).catch(err => console.error("가족 정보 로드 실패:", err));
            profileDropdown.classList.add('hidden');
        });
    }

    if (familyEditForm) {
        familyEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!checkAuth()) return;

            const id = document.getElementById('edit-member-id').value;
            const name = document.getElementById('edit-member-name').value.trim();
            const role = document.getElementById('edit-member-role').value.trim();
            const iconVal = document.getElementById('edit-member-icon').value;
            const [iconClass, iconBg] = iconVal.split('|');
            const hobby = document.getElementById('edit-member-hobby').value.trim();
            const comment = document.getElementById('edit-member-comment').value.trim();
            const like = document.getElementById('edit-member-like').value.trim();

            db.collection('family_members').doc(id).update({
                name,
                role,
                iconClass,
                iconBg,
                hobby,
                comment,
                like
            }).then(() => {
                familyModal.classList.remove('show');
            }).catch(err => {
                console.error("가족 프로필 수정 에러:", err);
                alert("수정 정보를 데이터베이스에 저장하는 도중 오류가 발생했습니다.");
            });
        });
    }


    // ----------------------------------------------------
    // 15. 메인 배너 이미지 Firestore 동적 관리 (동기 캐싱 추가)
    // ----------------------------------------------------
    const heroDisplayImg = document.getElementById('hero-display-img');
    const heroEditTrigger = document.getElementById('hero-img-edit-trigger');
    const heroImgFile = document.getElementById('hero-img-file');

    function initSettingsListener() {
        db.collection('settings').doc('main_image').onSnapshot((doc) => {
            if (doc.exists && doc.data().url) {
                const imgUrl = doc.data().url;
                heroDisplayImg.setAttribute('src', imgUrl);
                localStorage.setItem('dodo-hero-image-cache', imgUrl); // 초고속 로드용 로컬스토리지 캐시 최신화
            } else {
                heroDisplayImg.setAttribute('src', './assets/dodo_hero.png');
                localStorage.removeItem('dodo-hero-image-cache');
            }
        }, err => console.error("메인 이미지 설정 로드 에러:", err));
    }

    if (heroEditTrigger && heroImgFile) {
        heroEditTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!checkAuth()) return;
            heroImgFile.click();
        });

        heroImgFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const max_width = 1000;
                    let width = img.width;
                    let height = img.height;

                    if (width > max_width) {
                        height = Math.round((height * max_width) / width);
                        width = max_width;
                    }

                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = tempCanvas.toDataURL('image/jpeg', 0.75);

                    // Firestore 업로드 및 로컬 캐싱 즉시 반영
                    db.collection('settings').doc('main_image').set({
                        url: compressedBase64,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedBy: currentUserInfo ? currentUserInfo.nickname : 'unknown'
                    }).then(() => {
                        localStorage.setItem('dodo-hero-image-cache', compressedBase64); // 캐시 즉시 업데이트
                        alert("메인 이미지가 성공적으로 변경되었습니다! 🎉");
                    }).catch(err => {
                        console.error("메인 이미지 저장 에러:", err);
                        alert("이미지 저장 실패! ⚠️");
                    });

                    heroImgFile.value = '';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    initRealtimeDbListeners();
});
