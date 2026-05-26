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
            const mobDropdown = document.getElementById('mobile-nav-dropdown');
            if (mobDropdown) {
                mobDropdown.classList.add('hidden');
            }
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

    // 바깥 클릭 시 드롭다운 자동으로 닫기 & 락 카드의 로그인 유도 클릭 위임
    document.addEventListener('click', (e) => {
        if (profileDropdown) {
            profileDropdown.classList.add('hidden');
        }

        // 락 카드 내 로그인 버튼 클릭 시
        const lockLoginBtn = e.target.closest('.btn-lock-login');
        if (lockLoginBtn) {
            e.preventDefault();
            e.stopPropagation();
            showLoginScreen();
            if (authContainer) authContainer.classList.remove('hidden');
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

    // 비로그인 시 UI 패널 락/언락 제어 헬퍼 함수
    function toggleUIPanelLocks(isLoggedIn) {
        const calendarInner = document.getElementById('calendar-inner');
        const calendarLock = document.getElementById('calendar-lock');
        const boardFormInner = document.getElementById('board-form-inner');
        const boardFormLock = document.getElementById('board-form-lock');
        const galleryFormInner = document.getElementById('gallery-form-inner');
        const galleryFormLock = document.getElementById('gallery-form-lock');
        const guestbookAuthorGroup = document.getElementById('guestbook-author-group');
        const guestbookAuthorInput = document.getElementById('guestbook-author-input');

        if (isLoggedIn) {
            if (calendarInner) calendarInner.classList.remove('hidden');
            if (calendarLock) calendarLock.classList.add('hidden');
            if (boardFormInner) boardFormInner.classList.remove('hidden');
            if (boardFormLock) boardFormLock.classList.add('hidden');
            if (galleryFormInner) galleryFormInner.classList.remove('hidden');
            if (galleryFormLock) galleryFormLock.classList.add('hidden');
            if (guestbookAuthorGroup) {
                guestbookAuthorGroup.classList.add('hidden');
                guestbookAuthorInput.removeAttribute('required');
            }
        } else {
            if (calendarInner) calendarInner.classList.add('hidden');
            if (calendarLock) calendarLock.classList.remove('hidden');
            if (boardFormInner) boardFormInner.classList.add('hidden');
            if (boardFormLock) boardFormLock.classList.remove('hidden');
            if (galleryFormInner) galleryFormInner.classList.add('hidden');
            if (galleryFormLock) galleryFormLock.classList.remove('hidden');
            if (guestbookAuthorGroup) {
                guestbookAuthorGroup.classList.remove('hidden');
                guestbookAuthorInput.setAttribute('required', 'true');
            }
        }
    }

    // 로그인 세션 상태 변경 시 UI 컴포넌트 전체 재생성 헬퍼
    function refreshUIComponents() {
        if (typeof renderGallery === 'function') renderGallery();
        if (typeof renderBoardPosts === 'function') renderBoardPosts();
        if (typeof renderMessages === 'function') renderMessages();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof updateAutoTimeline === 'function') updateAutoTimeline();
    }

    // 인증 상태 감시자
    let userGoogleCalendarListener = null;

    auth.onAuthStateChanged((user) => {
        const headerUserName = document.getElementById('header-user-name');
        const dropdownLoggedOut = document.getElementById('dropdown-logged-out');
        const dropdownLoggedIn = document.getElementById('dropdown-logged-in');
        const dropdownUserNickname = document.getElementById('dropdown-user-nickname');
        const dropdownUserRole = document.getElementById('dropdown-user-role');
        const galleryUploadContainer = document.getElementById('gallery-upload-container');

        if (user) {
            toggleUIPanelLocks(true);
            
            // 로그인 시 스마트 단어장 관련 요소 노출
            const authElements = document.querySelectorAll('.auth-only-wordbook, .auth-only-calendar');
            authElements.forEach(el => {
                if (el.classList.contains('auth-only-wordbook')) {
                    el.classList.remove('hidden');
                } else {
                    el.style.display = '';
                }
            });

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

                    // 구성원 카드 렌더링 갱신
                    if (cachedFamilySnapshot) {
                        renderFamilyCards(cachedFamilySnapshot);
                    }

                    // 메인 이미지 수정 배지 활성화
                    const heroEditBadge = document.getElementById('hero-img-edit-trigger');
                    if (heroEditBadge) heroEditBadge.classList.remove('hidden');

                    // UI 리스트들 즉시 새로고침
                    refreshUIComponents();

                    // 개인 구글 캘린더 연동 설정 수신 (다중 캘린더)
                    if (userGoogleCalendarListener) userGoogleCalendarListener(); // 기존 리스너 해제
                    userGoogleCalendarListener = db.collection('users').doc(user.uid).onSnapshot((uDoc) => {
                        if (uDoc.exists && uDoc.data().googleCalendarUrls && Array.isArray(uDoc.data().googleCalendarUrls)) {
                            googleCalendarUrls = uDoc.data().googleCalendarUrls;
                            renderGcalList();
                            fetchGoogleCalendarEvents();
                        } else if (uDoc.exists && uDoc.data().googleCalendarUrl) {
                            // 기존 단일 URL 호환: 배열로 변환
                            googleCalendarUrls = [{ name: '내 캘린더', url: uDoc.data().googleCalendarUrl }];
                            renderGcalList();
                            fetchGoogleCalendarEvents();
                        } else {
                            googleCalendarUrls = [];
                            googleEvents = {};
                            renderGcalList();
                            renderCalendar();
                        }
                    });
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

                    if (cachedFamilySnapshot) {
                        renderFamilyCards(cachedFamilySnapshot);
                    }

                    // UI 리스트들 즉시 새로고침
                    refreshUIComponents();
                });
        } else {
            currentUserInfo = null;
            toggleUIPanelLocks(false);
            
            // 로그아웃 시 스마트 단어장 관련 요소 숨김
            const authElements = document.querySelectorAll('.auth-only-wordbook, .auth-only-calendar');
            authElements.forEach(el => {
                if (el.classList.contains('auth-only-wordbook')) {
                    el.classList.add('hidden');
                } else {
                    el.style.display = 'none';
                }
            });

            headerUserName.textContent = "Login";
            dropdownLoggedOut.classList.remove('hidden');
            dropdownLoggedIn.classList.add('hidden');

            // 로그아웃 시 여행 갤러리 등록 폼 감춤
            if (galleryUploadContainer) galleryUploadContainer.classList.add('hidden');

            if (cachedFamilySnapshot) {
                renderFamilyCards(cachedFamilySnapshot);
            }

            // 개인 구글 캘린더 데이터 초기화
            if (userGoogleCalendarListener) {
                userGoogleCalendarListener();
                userGoogleCalendarListener = null;
            }
            googleCalendarUrls = [];
            googleEvents = {};
            renderGcalList();
            if (typeof renderCalendar === 'function') renderCalendar();

            // 메인 이미지 수정 배지 숨김
            const heroEditBadge = document.getElementById('hero-img-edit-trigger');
            if (heroEditBadge) heroEditBadge.classList.add('hidden');

            // UI 리스트들 즉시 새로고침 (비로그인 제한 모드로 전환)
            refreshUIComponents();
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
    const prevYearBtn = document.getElementById('prev-year-btn');
    const nextYearBtn = document.getElementById('next-year-btn');

    const calendarModal = document.getElementById('calendar-modal');
    const modalDateTitle = document.getElementById('modal-date-title');
    const eventForm = document.getElementById('event-form');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventColorSelect = document.getElementById('event-color-select');
    const modalEventList = document.getElementById('modal-event-list');
    const modalCloseBtn = document.querySelector('.calendar-modal-close');
    
    let activeSelectedDateStr = ''; 

    let familyEvents = {};
    let googleCalendarUrls = []; // [{name: '멜로', url: 'https://...'}, ...]
    let googleEvents = {};

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

        let combinedEvents = [];
        if (familyEvents[dateStr]) combinedEvents = combinedEvents.concat(familyEvents[dateStr]);
        if (googleEvents[dateStr]) combinedEvents = combinedEvents.concat(googleEvents[dateStr]);

        if (combinedEvents.length > 0) {
            const eventsWrapper = document.createElement('div');
            eventsWrapper.className = 'day-events-list';
            
            const maxVisibleEvents = 2; 
            const eventsToShow = combinedEvents.slice(0, maxVisibleEvents);
            
            eventsToShow.forEach(event => {
                const eventBar = document.createElement('div');
                eventBar.className = 'calendar-event-bar';
                eventBar.style.backgroundColor = event.color;
                eventBar.innerHTML = (event.isGoogle ? '<i class="fa-brands fa-google"></i> ' : '') + escapeHTML(event.title);
                eventBar.title = event.title; 
                eventsWrapper.appendChild(eventBar);
            });
            
            if (combinedEvents.length > maxVisibleEvents) {
                const moreText = document.createElement('div');
                moreText.className = 'calendar-event-more';
                moreText.textContent = `+${combinedEvents.length - maxVisibleEvents}`;
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

    if (prevYearBtn) {
        prevYearBtn.addEventListener('click', () => {
            currentCalDate.setFullYear(currentCalDate.getFullYear() - 1);
            renderCalendar();
        });
    }

    if (nextYearBtn) {
        nextYearBtn.addEventListener('click', () => {
            currentCalDate.setFullYear(currentCalDate.getFullYear() + 1);
            renderCalendar();
        });
    }

    // 페이지 로드 직후 달력 최초 1회 즉시 렌더링 (데이터 오기 전에 틀 노출)
    renderCalendar();

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
        let combinedEvents = [];
        if (familyEvents[activeSelectedDateStr]) combinedEvents = combinedEvents.concat(familyEvents[activeSelectedDateStr]);
        if (googleEvents[activeSelectedDateStr]) combinedEvents = combinedEvents.concat(googleEvents[activeSelectedDateStr]);

        if (combinedEvents.length === 0) {
            modalEventList.innerHTML = '<p class="no-messages" style="padding:1rem;">등록된 일정이 없습니다.</p>';
            return;
        }

        combinedEvents.forEach((evt, idx) => {
            const item = document.createElement('div');
            item.className = 'event-item';
            
            // 일정 종류 색상에 맞는 파스텔톤 배경색(10% 투명도)과 보더 칼라 매칭
            const baseColor = evt.color || '#6c5ce7';
            item.style.backgroundColor = `${baseColor}1a`; 
            item.style.borderLeftColor = baseColor;

            const isOwner = !evt.isGoogle && (!evt.uid || (currentUserInfo && (evt.uid === currentUserInfo.uid || evt.author === currentUserInfo.nickname)));
            const delBtnHTML = isOwner 
                ? `<button class="event-del-btn" data-index="${idx}"><i class="fa-regular fa-trash-can"></i></button>`
                : '';
                
            const titleHTML = evt.isGoogle 
                ? `<i class="fa-brands fa-google" style="margin-right: 5px; color: #4285F4;"></i>${escapeHTML(evt.title)}` 
                : escapeHTML(evt.title);

            item.innerHTML = `
                <span class="event-item-title">${titleHTML}</span>
                ${delBtnHTML}
            `;
            modalEventList.appendChild(item);
        });

        modalEventList.querySelectorAll('.event-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                // Google 이벤트는 삭제 불가능하므로, 실제 familyEvents 상의 인덱스를 찾아서 삭제해야 함
                // 하지만 현재 UI 구조상 인덱스가 어긋날 수 있으므로 타이틀과 컬러로 매칭하여 삭제
                const targetEvent = combinedEvents[index];
                if (targetEvent.isGoogle) return;
                
                const realIndex = familyEvents[activeSelectedDateStr].findIndex(e => e.title === targetEvent.title && e.color === targetEvent.color);
                if (realIndex > -1) {
                    deleteEvent(realIndex);
                }
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
    const galleryDate = document.getElementById('gallery-date');
    const galleryDesc = document.getElementById('gallery-desc');
    const galleryCategory = document.getElementById('gallery-category');
    const galleryFiles = document.getElementById('gallery-files');
    const galleryImgPreviews = document.getElementById('gallery-img-previews');
    const galleryGrid = document.getElementById('gallery-grid');

    let compressedGalleryImages = []; // 다중 업로드용 압축 이미지 캐시 배열

    // 갤러리 파일 다중 업로드 & 리사이징 압축 (Firestore 1MB 제한 대응)
    let galleryProcessingCount = 0; // 현재 압축 진행 중인 이미지 수
    if (galleryFiles) {
        galleryFiles.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            galleryImgPreviews.innerHTML = '';
            compressedGalleryImages = [];
            galleryProcessingCount = 0;

            if (files.length === 0) return;
            // 최대 장수 제한 해제 (이미지 분할 저장 덕분)
            // 브라우저 멈춤 방지를 위해 한 번에 50장 정도로 넉넉하게 제한을 걸 수도 있지만, 우선 요청대로 해제합니다.
            if (files.length > 50) {
                alert("한 번에 너무 많은 사진(50장 초과)을 올리면 기기가 느려질 수 있습니다! 📷\n나누어서 올려주세요.");
                galleryFiles.value = '';
                return;
            }

            galleryProcessingCount = files.length;
            // 제출 버튼 비활성화 (압축 완료까지)
            const submitBtn = galleryForm ? galleryForm.querySelector('button[type="submit"]') : null;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 사진 처리 중... (0/${files.length})`;
            }

            files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        // Firestore 문서 크기 제한 대응: 가로 최대 800px, 70% 압축으로 화질 개선
                        const max_width = 800;
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

                        const base64Str = canvasTemp.toDataURL('image/jpeg', 0.70);
                        compressedGalleryImages.push(base64Str);
                        console.log(`[갤러리] 이미지 압축 완료: ${compressedGalleryImages.length}/${files.length}, 크기: ${Math.round(base64Str.length / 1024)}KB`);

                        // 미리보기 썸네일 노출
                        const previewItem = document.createElement('div');
                        previewItem.className = 'gallery-preview-item';
                        previewItem.innerHTML = `
                            <img src="${base64Str}" alt="미리보기">
                            <button type="button" class="del-btn">&times;</button>
                        `;
                        
                        // 미리보기 삭제 버튼 바인딩 (base64 참조로 정확히 삭제)
                        const capturedBase64 = base64Str;
                        previewItem.querySelector('.del-btn').addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            previewItem.remove();
                            const idx = compressedGalleryImages.indexOf(capturedBase64);
                            if (idx > -1) compressedGalleryImages.splice(idx, 1);
                        });

                        galleryImgPreviews.appendChild(previewItem);

                        // 모든 이미지 압축 완료 시 버튼 활성화
                        galleryProcessingCount--;
                        if (submitBtn) {
                            if (galleryProcessingCount <= 0) {
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = '추억 등록하기 <i class="fa-solid fa-check"></i>';
                                const totalSize = compressedGalleryImages.reduce((s, str) => s + str.length, 0);
                                console.log(`[갤러리] 전체 압축 완료: ${compressedGalleryImages.length}장, 총 ${Math.round(totalSize / 1024)}KB`);
                            } else {
                                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 사진 처리 중... (${compressedGalleryImages.length}/${files.length})`;
                            }
                        }
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
            const isPrivate = document.getElementById('gallery-is-private').checked;

            if (!title || !desc || compressedGalleryImages.length === 0) {
                alert("제목, 설명 및 사진을 등록해주세요! 📷");
                return;
            }

            // 개별 사진 용량 사전 체크 (사진 1장당 약 900KB 이하로 제한)
            const oversizedImages = compressedGalleryImages.filter(str => str.length > 900000);
            if (oversizedImages.length > 0) {
                alert(`일부 사진의 용량이 너무 큽니다! 📦\n더 작게 압축된 사진을 사용해주세요.`);
                return;
            }

            // 저장 중 버튼 비활성화
            const submitBtn = galleryForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';
            }

            let postDateStr = galleryDate ? galleryDate.value : '';
            let postDateMs = new Date().getTime(); // 기본값은 현재 시간
            
            if (postDateStr) {
                const parts = postDateStr.split('-');
                if (parts.length === 3) {
                    const selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    const now = new Date();
                    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                    postDateMs = selectedDate.getTime();
                }
            }

            const newAlbum = {
                title,
                desc,
                category,
                author: currentUserInfo.nickname,
                uid: currentUserInfo.uid,
                isPrivate: isPrivate,
                date: postDateMs
            };

            const editId = galleryForm.getAttribute('data-edit-id');
            if (editId) {
                // 수정
                db.collection('gallery_posts').doc(editId).update(newAlbum).then(async () => {
                    try {
                        // 기존 이미지들 일괄 삭제
                        const oldImagesSnapshot = await db.collection('gallery_images').where('postId', '==', editId).get();
                        const deletePromises = [];
                        oldImagesSnapshot.forEach(doc => deletePromises.push(doc.ref.delete()));
                        await Promise.all(deletePromises);

                        // 새 이미지 분할 저장
                        for (let i = 0; i < compressedGalleryImages.length; i++) {
                            await db.collection('gallery_images').add({
                                postId: editId,
                                base64: compressedGalleryImages[i],
                                index: i,
                                date: new Date().getTime() + i
                            });
                        }

                        resetGalleryForm();
                        alert("소중한 추억 앨범이 성공적으로 수정되었습니다! ✏️");
                    } catch (err) {
                        console.error("이미지 업데이트 에러:", err);
                        alert("사진 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
                    }
                }).catch(err => {
                    console.error("갤러리 수정 에러:", err);
                    alert("갤러리 수정 실패! ⚠️ " + err.message);
                }).finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '추억 등록하기 <i class="fa-solid fa-check"></i>';
                    }
                });
            } else {
                // 신규 등록
                db.collection('gallery_posts').add(newAlbum).then(async (docRef) => {
                    const postId = docRef.id;
                    try {
                        // 새 이미지 분할 저장
                        for (let i = 0; i < compressedGalleryImages.length; i++) {
                            await db.collection('gallery_images').add({
                                postId: postId,
                                base64: compressedGalleryImages[i],
                                index: i,
                                date: new Date().getTime() + i
                            });
                        }
                        galleryForm.reset();
                        galleryImgPreviews.innerHTML = '';
                        compressedGalleryImages = [];
                        alert("소중한 추억 앨범이 성공적으로 등록되었습니다! ✈️");
                    } catch (err) {
                        console.error("이미지 저장 에러:", err);
                        alert("사진 저장 중 오류가 발생했습니다. 앨범을 삭제 후 다시 시도해주세요.");
                    }
                }).catch(err => {
                    console.error("갤러리 저장 에러:", err);
                    alert("갤러리 저장 실패! ⚠️ " + err.message);
                }).finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '추억 등록하기 <i class="fa-solid fa-check"></i>';
                    }
                });
            }
        });
    }

    // 갤러리 수정 폼 초기화
    function resetGalleryForm() {
        if (!galleryForm) return;
        galleryForm.removeAttribute('data-edit-id');
        galleryForm.reset();
        
        const formTitle = galleryForm.parentNode.querySelector('h3');
        if (formTitle) formTitle.innerHTML = '추억 앨범 만들기 📸';
        
        const submitBtn = galleryForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '추억 등록하기 <i class="fa-solid fa-check"></i>';
        
        const cancelBtn = document.getElementById('gallery-edit-cancel-btn');
        if (cancelBtn) cancelBtn.remove();
        
        galleryImgPreviews.innerHTML = '';
        compressedGalleryImages = [];
        
        // 오늘 날짜로 초기화 (YYYY-MM-DD)
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        if (galleryDate) galleryDate.value = `${yyyy}-${mm}-${dd}`;
    }

    // 갤러리 수정 모드 시작
    function startEditGalleryPost(id) {
        if (!checkAuth()) return;
        
        db.collection('gallery_posts').doc(id).get()
            .then(async doc => {
                if (doc.exists) {
                    const post = doc.data();
                    const isOwner = currentUserInfo && (post.uid === currentUserInfo.uid);
                    if (!isOwner) {
                        alert("작성자 본인만 수정할 수 있습니다! 🔐");
                        return;
                    }
                    
                    galleryForm.setAttribute('data-edit-id', id);
                    galleryTitle.value = post.title || '';
                    galleryDesc.value = post.desc || '';
                    galleryCategory.value = post.category || 'daily';
                    document.getElementById('gallery-is-private').checked = post.isPrivate !== false;
                    
                    if (galleryDate && post.date) {
                        const d = new Date(post.date);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        galleryDate.value = `${yyyy}-${mm}-${dd}`;
                    }
                    
                    galleryImgPreviews.innerHTML = '';
                    
                    try {
                        const imagesSnapshot = await db.collection('gallery_images').where('postId', '==', id).orderBy('index', 'asc').get();
                        let postImages = [];
                        imagesSnapshot.forEach(imgDoc => postImages.push(imgDoc.data().base64));
                        
                        if (postImages.length === 0 && post.images) {
                            postImages = [...post.images];
                        }
                        compressedGalleryImages = postImages;
                    } catch (err) {
                        console.error("수정 이미지 로드 에러:", err);
                        compressedGalleryImages = post.images ? [...post.images] : [];
                    }
                    
                    compressedGalleryImages.forEach((base64Str, index) => {
                        const previewItem = document.createElement('div');
                        previewItem.className = 'gallery-preview-item';
                        previewItem.innerHTML = `
                            <img src="${base64Str}" alt="미리보기">
                            <button type="button" class="del-btn" data-index="${index}">&times;</button>
                        `;

                        previewItem.querySelector('.del-btn').addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            previewItem.remove();
                            const exactIdx = compressedGalleryImages.indexOf(base64Str);
                            if (exactIdx > -1) compressedGalleryImages.splice(exactIdx, 1);
                        });
                        galleryImgPreviews.appendChild(previewItem);
                    });
                    
                    const formTitle = galleryForm.parentNode.querySelector('h3');
                    if (formTitle) formTitle.innerHTML = '추억 앨범 수정하기 ✏️';
                    
                    const submitBtn = galleryForm.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.innerHTML = '수정 완료 <i class="fa-solid fa-check"></i>';
                    
                    if (!document.getElementById('gallery-edit-cancel-btn')) {
                        const cancelBtn = document.createElement('button');
                        cancelBtn.type = 'button';
                        cancelBtn.id = 'gallery-edit-cancel-btn';
                        cancelBtn.className = 'btn btn-secondary w-100';
                        cancelBtn.style.marginTop = '10px';
                        cancelBtn.innerHTML = '수정 취소 <i class="fa-solid fa-xmark"></i>';
                        cancelBtn.addEventListener('click', resetGalleryForm);
                        galleryForm.appendChild(cancelBtn);
                    }
                    
                    galleryForm.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(err => console.error("갤러리 수정 로드 에러:", err));
    }

    // 기본 정적 앨범 2개 삭제됨
    const defaultGalleryPosts = [];

    let galleryPostsList = [];
    let galleryImagesList = [];
    let galleryPosts = [];

    function initGalleryListener() {
        db.collection('gallery_posts').orderBy('date', 'desc').onSnapshot(snapshot => {
            const dbPosts = [];
            snapshot.forEach(doc => {
                dbPosts.push({ id: doc.id, ...doc.data() });
            });
            galleryPostsList = dbPosts;
            updateGalleryPosts();
        }, err => console.error("갤러리 로드 에러:", err));

        db.collection('gallery_images').orderBy('date', 'desc').onSnapshot(snapshot => {
            const dbImages = [];
            snapshot.forEach(doc => {
                dbImages.push({ id: doc.id, ...doc.data() });
            });
            galleryImagesList = dbImages;
            updateGalleryPosts();
        }, err => console.error("갤러리 이미지 로드 에러:", err));
    }

    function updateGalleryPosts() {
        galleryPosts = galleryPostsList.map(post => {
            const postImages = galleryImagesList
                .filter(img => img.postId === post.id)
                .sort((a, b) => a.index - b.index)
                .map(img => img.base64);
            return { ...post, images: postImages.length > 0 ? postImages : (post.images || []) };
        });
        renderGallery();
    }

    // 갤러리 카드 그리기
    function renderGallery() {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = '';

        // 비로그인 상태일 때는 공개(isPrivate === false) 글만 노출
        const visibleGalleryPosts = currentUserInfo
            ? galleryPosts
            : galleryPosts.filter(post => post.isPrivate === false);

        if (visibleGalleryPosts.length === 0) {
            if (!currentUserInfo) {
                galleryGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; position: relative; width: 100%; min-height: 450px; border-radius: 20px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; padding: 1rem; opacity: 0.15; filter: blur(4px); pointer-events: none;">
                            <div class="glass-card" style="height: 350px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;"></div>
                            <div class="glass-card hide-on-mobile" style="height: 350px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;"></div>
                            <div class="glass-card hide-on-tablet" style="height: 350px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;"></div>
                            <div class="glass-card hide-on-tablet" style="height: 350px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;"></div>
                        </div>
                        <div class="glass-card login-prompt-card" style="position: relative; width: 90%; max-width: 450px; text-align: center; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; background: rgba(30, 30, 45, 0.75); backdrop-filter: blur(12px); box-shadow: 0 15px 50px rgba(0,0,0,0.5); z-index: 10;">
                            <i class="fa-solid fa-lock" style="font-size: 3.5rem; color: var(--primary-color); animation: floating 6s ease-in-out infinite;"></i>
                            <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0;">추억 갤러리는 로그인 후 이용 가능합니다 🔐</h3>
                            <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 340px; line-height: 1.6; margin: 0;">DODO 가족의 소중한 여행 사진과 따뜻한 일상 모습은 가족 인증을 마친 멤버들에게만 안전하게 공개됩니다.</p>
                            <button class="btn btn-primary" onclick="document.getElementById('auth-menu-btn').click();" style="padding: 0.8rem 2rem;"><i class="fa-solid fa-right-to-bracket"></i> 가족 로그인하기</button>
                        </div>
                    </div>
                `;
            } else {
                galleryGrid.innerHTML = `
                    <div class="glass-card login-prompt-card" style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; border: 1px solid var(--card-border); border-radius: 20px;">
                        <i class="fa-regular fa-images" style="font-size: 3.5rem; color: var(--primary-color); animation: floating 6s ease-in-out infinite;"></i>
                        <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0;">등록된 사진이 없습니다 📸</h3>
                        <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 340px; line-height: 1.6; margin: 0;">새로운 추억을 가장 먼저 공유해 보세요!</p>
                    </div>
                `;
            }
            return;
        }

        visibleGalleryPosts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'gallery-item glass-card';
            item.setAttribute('data-category', post.category);
            
            // 사진이 여러 장일 경우 상단 배지 노출
            const multiBadgeHTML = post.images && post.images.length > 1
                ? `<div class="gallery-multi-badge"><i class="fa-regular fa-images"></i> +${post.images.length}장</div>`
                : '';

            // 첫 번째 대표 사진 설정
            const firstImg = post.images && post.images.length > 0 ? post.images[0] : './assets/dodo_hero.png';

            // 액션 버튼 (수정/삭제 - 본인 글만 노출)
            const isOwner = currentUserInfo && (post.uid === currentUserInfo.uid);
            const actionBtnsHTML = isOwner
                ? `<div style="position: absolute; bottom: 15px; right: 15px; display: flex; gap: 8px; z-index: 5;">
                       <button class="edit-btn gallery-edit-btn" data-id="${post.id}" style="font-size: 0.8rem; background: var(--primary-gradient); padding: 5px 12px; border-radius: 8px; border: none; color: white; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-weight: 600;"><i class="fa-solid fa-pen-to-square"></i> 수정</button>
                       <button class="delete-btn gallery-del-btn" data-id="${post.id}" style="font-size: 0.8rem; background: rgba(255, 71, 87, 0.9); padding: 5px 12px; border-radius: 8px; border: none; color: white; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-weight: 600;"><i class="fa-regular fa-trash-can"></i> 삭제</button>
                   </div>`
                : '';

            item.innerHTML = `
                <div class="gallery-img-container" style="position: relative;">
                    ${multiBadgeHTML}
                    ${post.images && post.images.length > 1 ? `
                    <div class="card-image-slider">
                        <div class="card-image-track">
                            ${post.images.map(src => `<div class="card-image-slide"><img src="${src}" alt="${post.title}"></div>`).join('')}
                        </div>
                        <button class="card-slider-prev">&#x2039;</button>
                        <button class="card-slider-next">&#x203A;</button>
                        <div class="card-slider-dots">
                            ${post.images.map((_, i) => `<span class="card-slider-dot${i === 0 ? ' active' : ''}"></span>`).join('')}
                        </div>
                    </div>` : `<img src="${firstImg}" alt="${post.title}">`}
                </div>
                <div class="gallery-content" style="position: relative; padding-bottom: 3.5rem;">
                    <span class="gallery-tag">${post.category === 'travel' ? '가족 여행 ✈️' : '소소한 일상 ☕'}</span>
                    <h3 class="gallery-item-title">${escapeHTML(post.title)}</h3>
                    <p class="gallery-item-desc">${escapeHTML(post.desc)}</p>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; font-weight: 600;">
                        <i class="fa-solid fa-user"></i> ${escapeHTML(post.author)}
                        <span style="margin-left: 10px;"><i class="fa-regular fa-calendar-days"></i> ${post.date ? new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}</span>
                    </p>
                    ${actionBtnsHTML}
                </div>
            `;

            // 이미지 영역 클릭 시 전체화면 라이트박스 열기
            const imgContainer = item.querySelector('.gallery-img-container');
            if (imgContainer) {
                imgContainer.addEventListener('click', (e) => {
                    // 슬라이더 좌우 버튼이나 하단 인디케이터 클릭 시 라이트박스가 열리지 않도록 방지
                    if (e.target.closest('.card-slider-prev') || e.target.closest('.card-slider-next') || e.target.closest('.card-slider-dots')) return;
                    
                    const imagesToView = post.images && post.images.length > 0 ? post.images : [firstImg];
                    openLightboxSlider(imagesToView, post.title);
                });
            }

            // 액션 이벤트 연결
            if (isOwner) {
                const editBtn = item.querySelector('.gallery-edit-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        startEditGalleryPost(post.id);
                    });
                }
                
                const delBtn = item.querySelector('.gallery-del-btn');
                if (delBtn) {
                    delBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        if (confirm("이 앨범을 삭제하시겠습니까?")) {
                            db.collection('gallery_posts').doc(post.id).delete()
                                .then(async () => {
                                    try {
                                        const oldImagesSnapshot = await db.collection('gallery_images').where('postId', '==', post.id).get();
                                        const deletePromises = [];
                                        oldImagesSnapshot.forEach(doc => deletePromises.push(doc.ref.delete()));
                                        await Promise.all(deletePromises);
                                    } catch (err) {
                                        console.error("이미지 삭제 에러:", err);
                                    }
                                })
                                .catch(err => console.error("갤러리 삭제 에러:", err));
                        }
                    });
                }
            }

            galleryGrid.appendChild(item);
        });
        // 슬라이더 초기화 호출
        initCardSliders(galleryGrid);

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
    
    // 라이트박스 터치 스와이프 제스처 이벤트 장착
    let lightboxTouchStartX = 0;
    if (lightboxModal) {
        lightboxModal.addEventListener('touchstart', (e) => {
            lightboxTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightboxModal.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diffX = lightboxTouchStartX - touchEndX;
            if (activeSliderImages.length <= 1) return;

            if (diffX > 50) {
                // 오른쪽에서 왼쪽 스와이프: 다음 사진
                activeSliderIndex = (activeSliderIndex + 1) % activeSliderImages.length;
                lightboxImg.setAttribute('src', activeSliderImages[activeSliderIndex]);
                updateSliderIndicator();
            } else if (diffX < -50) {
                // 왼쪽에서 오른쪽 스와이프: 이전 사진
                activeSliderIndex = (activeSliderIndex - 1 + activeSliderImages.length) % activeSliderImages.length;
                lightboxImg.setAttribute('src', activeSliderImages[activeSliderIndex]);
                updateSliderIndicator();
            }
        }, { passive: true });
    }

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
    const boardDate = document.getElementById('board-date');
    const boardFile = document.getElementById('board-file');
    const boardContent = document.getElementById('board-content');
    const boardImgPreview = document.getElementById('board-img-preview');
    const boardPostsGrid = document.getElementById('board-posts-grid');

    const boardImgPreviews = document.getElementById('board-img-previews');
    let compressedImageBase64 = []; // 다중 base64 이미지 캐시 배열로 전환

    boardFile.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        boardImgPreviews.innerHTML = '';
        compressedImageBase64 = [];

        if (files.length === 0) return;

        files.forEach((file, index) => {
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

                    const base64Str = tempCanvas.toDataURL('image/jpeg', 0.65);
                    compressedImageBase64.push(base64Str);

                    // 미리보기 썸네일 생성 및 삭제 핸들러 연동
                    const previewItem = document.createElement('div');
                    previewItem.className = 'gallery-preview-item';
                    previewItem.innerHTML = `
                        <img src="${base64Str}" alt="미리보기">
                        <button type="button" class="del-btn" data-index="${index}">&times;</button>
                    `;

                    previewItem.querySelector('.del-btn').addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        previewItem.remove();
                        compressedImageBase64.splice(index, 1);
                    });

                    boardImgPreviews.appendChild(previewItem);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
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

        // 비로그인 상태일 때는 공개(isPrivate === false) 글만 조회 가능
        const visiblePosts = currentUserInfo
            ? boardPosts
            : boardPosts.filter(post => post.isPrivate === false);

        const filteredPosts = activeBoardFilter === 'all'
            ? visiblePosts
            : visiblePosts.filter(post => post.role === activeBoardFilter);

        if (filteredPosts.length === 0) {
            if (!currentUserInfo) {
                boardPostsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; position: relative; width: 100%; min-height: 450px; border-radius: 20px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; padding: 1rem; opacity: 0.15; filter: blur(4px); pointer-events: none;">
                            <div class="glass-card" style="height: 280px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;"></div>
                            <div class="glass-card hide-on-mobile" style="height: 280px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;"></div>
                            <div class="glass-card hide-on-tablet" style="height: 280px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;"></div>
                        </div>
                        <div class="glass-card login-prompt-card" style="position: relative; width: 90%; max-width: 450px; text-align: center; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; background: rgba(30, 30, 45, 0.75); backdrop-filter: blur(12px); box-shadow: 0 15px 50px rgba(0,0,0,0.5); z-index: 10;">
                            <i class="fa-solid fa-user-lock" style="font-size: 3.5rem; color: var(--primary-color); animation: floating 6s ease-in-out infinite;"></i>
                            <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0;">가족 소식은 로그인 후 볼 수 있습니다 📝</h3>
                            <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 340px; line-height: 1.6; margin: 0;">우리들만의 스마트 비밀 아지트 게시판입니다. 로그인하셔서 새로운 이야기와 소중한 안부를 등록해 보세요!</p>
                            <button class="btn btn-primary" onclick="document.getElementById('auth-menu-btn').click();" style="padding: 0.8rem 2rem;"><i class="fa-solid fa-right-to-bracket"></i> 가족 로그인하기</button>
                        </div>
                    </div>
                `;
            } else {
                boardPostsGrid.innerHTML = `
                    <div class="glass-card login-prompt-card" style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; border: 1px solid var(--card-border); border-radius: 20px;">
                        <i class="fa-solid fa-pen-to-square" style="font-size: 3.5rem; color: var(--primary-color); animation: floating 6s ease-in-out infinite;"></i>
                        <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0;">아직 등록된 이야기가 없습니다 📝</h3>
                        <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 340px; line-height: 1.6; margin: 0;">가장 먼저 소중한 가족 이야기를 등록해 보세요!</p>
                    </div>
                `;
            }
            return;
        }

        filteredPosts.forEach((post) => {
            const postCard = document.createElement('div');
            
            // 첫 번째 대표 이미지 설정
            const hasImages = (post.images && post.images.length > 0) || post.image;
            postCard.className = `board-post-card glass-card${hasImages ? '' : ' no-image-card'}`;

            const dateStr = new Date(post.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            const firstImg = post.images && post.images.length > 0 ? post.images[0] : post.image;
            const multiBadgeHTML = post.images && post.images.length > 1
                ? `<div class="board-multi-badge"><i class="fa-regular fa-images"></i> +${post.images.length}장</div>`
                : '';

            const hasMultiple = post.images && post.images.length > 1;
            const sliderHTML = hasMultiple ? `
                <div class="card-image-slider">
                    <div class="card-image-track">
                        ${post.images.map(src => `<div class="card-image-slide"><img src="${src}" alt="${post.title}"></div>`).join('')}
                    </div>
                    <button class="card-slider-prev"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="card-slider-next"><i class="fa-solid fa-chevron-right"></i></button>
                    <div class="card-slider-dots">
                        ${post.images.map(() => `<span class="card-slider-dot"></span>`).join('')}
                    </div>
                </div>` : `<img src="${firstImg}" alt="게시글 대표 사진" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
            const imgHeaderHTML = `<div class="post-img-header">${multiBadgeHTML}${sliderHTML}</div>`;

            const isOwner = currentUserInfo && (post.uid === currentUserInfo.uid || (!post.uid && post.author === currentUserInfo.nickname));
            const footerHTML = isOwner 
                ? `<div class="post-footer">
                        <button class="edit-btn board-post-edit-btn" data-id="${post.id}" title="게시글 수정">
                            <i class="fa-regular fa-pen-to-square"></i> 수정
                        </button>
                        <button class="delete-btn board-post-del-btn" data-id="${post.id}" title="게시글 삭제">
                            <i class="fa-regular fa-trash-can"></i> 삭제
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

            // 게시판 사진 클릭 시 라이트박스 호출 (갤러리와 동일하게)
            const imagesToView = post.images && post.images.length > 0 ? post.images : (post.image ? [post.image] : []);
            if (imagesToView.length > 0) {
                const imgEls = postCard.querySelectorAll('.post-img-header img');
                imgEls.forEach(imgEl => {
                    imgEl.style.cursor = 'pointer';
                    imgEl.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        openLightboxSlider(imagesToView, post.title);
                    });
                });
            }

            boardPostsGrid.appendChild(postCard);
        });
        // 슬라이더 초기화 호출
        initCardSliders(boardPostsGrid);

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

function initCardSliders(container) {
    const sliders = container.querySelectorAll('.card-image-slider');
    sliders.forEach(slider => {
        const track = slider.querySelector('.card-image-track');
        const slides = slider.querySelectorAll('.card-image-slide');
        const prevBtn = slider.querySelector('.card-slider-prev');
        const nextBtn = slider.querySelector('.card-slider-next');
        const dots = slider.querySelectorAll('.card-slider-dot');
        let current = 0;
        const total = slides.length;
        if (total === 0) return;

        // 트랙 너비를 슬라이드 수 × 100%로 설정하고 각 슬라이드를 1/total로 설정
        track.style.width = `${total * 100}%`;
        slides.forEach(sl => { sl.style.width = `${100 / total}%`; sl.style.flexShrink = '0'; });

        // 한 슬라이드당 이동 퍼센트 (트랙 전체 기준)
        const slidePercent = 100 / total;

        const goTo = (idx) => {
            current = idx;
            track.style.transform = `translateX(-${current * slidePercent}%)`;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
        };

        if (prevBtn) prevBtn.addEventListener('click', e => { e.stopPropagation(); goTo((current - 1 + total) % total); });
        if (nextBtn) nextBtn.addEventListener('click', e => { e.stopPropagation(); goTo((current + 1) % total); });
        dots.forEach((dot, i) => {
            dot.addEventListener('click', e => { e.stopPropagation(); goTo(i); });
        });

        // 터치 스와이프 (모바일)
        let touchStartX = 0;
        let touchStartY = 0;
        let isDragging = false;
        let startTime = 0;

        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isDragging = true;
            startTime = Date.now();
            track.style.transition = 'none';
        }, { passive: true });

        slider.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const dx = e.touches[0].clientX - touchStartX;
            const dy = e.touches[0].clientY - touchStartY;
            // 가로 이동이 세로보다 크면 수평 스크롤로 판단
            if (Math.abs(dx) > Math.abs(dy)) {
                e.preventDefault();
                // 드래그 거리를 슬라이더 너비 기준 → 트랙 % 변환
                const dragPercent = (dx / slider.offsetWidth) * slidePercent;
                const offset = -(current * slidePercent) + dragPercent;
                track.style.transform = `translateX(${offset}%)`;
            }
        }, { passive: false });

        slider.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            const dx = e.changedTouches[0].clientX - touchStartX;
            const elapsed = Date.now() - startTime;
            // 빠른 스와이프 또는 30% 이상 이동 시 슬라이드 전환
            const threshold = elapsed < 250 ? 30 : slider.offsetWidth * 0.3;
            if (Math.abs(dx) > threshold) {
                if (dx > 0 && current > 0) {
                    goTo(current - 1);
                } else if (dx < 0 && current < total - 1) {
                    goTo(current + 1);
                } else {
                    goTo(current);
                }
            } else {
                goTo(current);
            }
        });

        // 마우스 드래그 (데스크톱)
        let mouseStartX = 0;
        let mouseDown = false;
        slider.addEventListener('mousedown', e => { mouseStartX = e.clientX; mouseDown = true; e.preventDefault(); });
        slider.addEventListener('mouseup', e => {
            if (!mouseDown) return;
            mouseDown = false;
            const diff = e.clientX - mouseStartX;
            if (Math.abs(diff) > 40) {
                if (diff > 0 && current > 0) goTo(current - 1);
                else if (diff < 0 && current < total - 1) goTo(current + 1);
            }
        });
        slider.addEventListener('mouseleave', () => { mouseDown = false; });

        // 초기 상태
        goTo(0);
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
        
        boardImgPreviews.innerHTML = '';
        compressedImageBase64 = [];
        
        // 오늘 날짜로 초기화 (YYYY-MM-DD)
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        if (boardDate) boardDate.value = `${yyyy}-${mm}-${dd}`;
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
                    document.getElementById('board-is-private').checked = post.isPrivate !== false;
                    
                    if (boardDate && post.date) {
                        const d = new Date(post.date);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        boardDate.value = `${yyyy}-${mm}-${dd}`;
                    }
                    
                    boardImgPreviews.innerHTML = '';
                    // 기존 images 배열이 있거나 단일 image 필드가 있는 경우 병합 수집
                    compressedImageBase64 = post.images || (post.image ? [post.image] : []);
                    
                    compressedImageBase64.forEach((base64Str, index) => {
                        const previewItem = document.createElement('div');
                        previewItem.className = 'gallery-preview-item';
                        previewItem.innerHTML = `
                            <img src="${base64Str}" alt="미리보기">
                            <button type="button" class="del-btn" data-index="${index}">&times;</button>
                        `;

                        previewItem.querySelector('.del-btn').addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            previewItem.remove();
                            compressedImageBase64.splice(index, 1);
                        });
                        boardImgPreviews.appendChild(previewItem);
                    });
                    
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
        const isPrivate = document.getElementById('board-is-private').checked;

        if (!author || !title || !content) return;

        const editId = boardForm.getAttribute('data-edit-id');
        
        let postDateStr = boardDate ? boardDate.value : '';
        let postDateMs = new Date().getTime(); // 기본값은 현재 시간
        
        if (postDateStr) {
            const parts = postDateStr.split('-');
            if (parts.length === 3) {
                const selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                const now = new Date();
                selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                postDateMs = selectedDate.getTime();
            }
        }

        if (editId) {
            db.collection('board_posts').doc(editId).update({
                title,
                content,
                image: compressedImageBase64[0] || '', // 하위 호환성용 첫 사진
                images: compressedImageBase64, // 다중 이미지 배열 필드
                isPrivate: isPrivate,
                date: postDateMs
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
                image: compressedImageBase64[0] || '', // 하위 호환성용 첫 사진
                images: compressedImageBase64, // 다중 이미지 배열 필드
                date: postDateMs,
                uid: currentUserInfo.uid,
                isPrivate: isPrivate
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

        // 1) 캘린더 일정 데이터 파싱 & 병합 (일정은 로그인 한 사람만 조회 가능)
        if (currentUserInfo) {
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
        }

        // 2) 소식 게시글 데이터 병합 (비로그인은 공개글만)
        boardPosts.forEach(post => {
            if (currentUserInfo || post.isPrivate === false) {
                combinedTimelineData.push({
                    title: post.title,
                    content: post.content,
                    date: post.date,
                    type: 'board',
                    image: post.image,
                    author: post.author,
                    rawText: post.title + ' ' + post.content + ' ' + post.author
                });
            }
        });

        // 3) 방명록 메시지 데이터 병합 (방명록은 로그인 한 사람만 조회 가능)
        if (currentUserInfo) {
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
        }

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

        // 로그인 상태면 닉네임을 사용하고, 비로그인이면 입력한 닉네임을 수집
        const author = currentUserInfo 
            ? currentUserInfo.nickname 
            : (document.getElementById('guestbook-author-input').value.trim() || "손님");
        const role = currentUserInfo 
            ? currentUserInfo.role 
            : "손님 👤";
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
                uid: currentUserInfo ? currentUserInfo.uid : null
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
        // 좋아요는 비로그인도 누를 수 있도록 checkAuth() 검사를 생략하고 로컬스토리지 캐시 기반으로 처리
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
            if (profileDropdown) {
                profileDropdown.classList.add('hidden');
            }
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
    // 15. 메인 배너 이미지 10장 슬라이더 & 관리자 모달 (고도화)
    // ----------------------------------------------------
    const heroSliderTrack = document.getElementById('hero-slider-track');
    const heroSliderDots = document.getElementById('hero-slider-dots');
    const heroPrevBtn = document.getElementById('hero-prev-btn');
    const heroNextBtn = document.getElementById('hero-next-btn');
    const heroEditTrigger = document.getElementById('hero-img-edit-trigger');
    
    // 관리 모달 요소들
    const heroManagerModal = document.getElementById('hero-manager-modal');
    const heroManagerClose = document.getElementById('hero-manager-close');
    const heroImagesGrid = document.getElementById('hero-images-grid');
    const heroUploadDropzone = document.getElementById('hero-upload-dropzone');
    const heroSliderFileInput = document.getElementById('hero-slider-file-input');

    let heroImages = ["./assets/dodo_hero.png"]; // 메모리 내 이미지 목록
    let heroSliderIndex = 0;
    let heroSliderInterval = null;

    function initSettingsListener() {
        // 메인 이미지 목록을 settings/main_image 문서 내 images 배열에서 실시간 수신
        db.collection('settings').doc('main_image').onSnapshot((doc) => {
            if (doc.exists && doc.data().images && doc.data().images.length > 0) {
                heroImages = doc.data().images;
            } else {
                heroImages = ["./assets/dodo_hero.png"];
            }
            // 캐시 최신화
            localStorage.setItem('dodo-hero-images-cache', JSON.stringify(heroImages));
            
            renderHeroSlider();
            if (heroManagerModal.classList.contains('show')) {
                renderHeroManagerGrid();
            }
        }, err => console.error("메인 슬라이더 로드 에러:", err));
    }

    // 구글 캘린더 이벤트 가져오기 함수
    // iCal 텍스트를 파싱하여 이벤트 객체 배열 반환
    function parseICalText(text) {
        const events = [];
        const unfoldedText = text.replace(/\r?\n[ \t]/g, '');
        const lines = unfoldedText.split(/\r?\n/);
        let currentEvent = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('BEGIN:VEVENT')) {
                currentEvent = {};
            } else if (line.startsWith('END:VEVENT')) {
                if (currentEvent && currentEvent.title && currentEvent.dateStr) {
                    events.push(currentEvent);
                }
                currentEvent = null;
            } else if (currentEvent) {
                if (line.startsWith('SUMMARY:')) {
                    currentEvent.title = line.substring(8).trim();
                } else if (line.startsWith('DTSTART')) {
                    const colonIdx = line.indexOf(':');
                    if (colonIdx !== -1) {
                        const dStr = line.substring(colonIdx + 1).trim();
                        if (dStr.length >= 8) {
                            currentEvent.dateStr = `${dStr.substring(0,4)}-${dStr.substring(4,6)}-${dStr.substring(6,8)}`;
                        }
                    }
                }
            }
        }
        return events;
    }

    // 등록된 캘린더 목록 UI 렌더링
    function renderGcalList() {
        const listEl = document.getElementById('gcal-list');
        if (!listEl) return;
        if (!googleCalendarUrls || googleCalendarUrls.length === 0) {
            listEl.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding: 8px 0;">등록된 캘린더가 없습니다.</p>';
            return;
        }
        listEl.innerHTML = '';
        googleCalendarUrls.forEach((cal, idx) => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; background:var(--input-bg); border:1px solid var(--input-border); border-radius:10px; padding:8px 12px;';
            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                    <i class="fa-brands fa-google" style="color:#4285F4; font-size:1rem;"></i>
                    <span style="font-weight:600; font-size:0.9rem; white-space:nowrap;">${cal.name || '캘린더'}</span>
                </div>
                <button class="gcal-del-btn" data-idx="${idx}" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; padding:4px 6px;" title="삭제"><i class="fa-solid fa-trash-can"></i></button>
            `;
            item.querySelector('.gcal-del-btn').addEventListener('click', () => {
                if (!confirm(`'${cal.name}' 캘린더를 삭제할까요?`)) return;
                googleCalendarUrls.splice(idx, 1);
                db.collection('users').doc(currentUserInfo.uid).set({ googleCalendarUrls }, { merge: true }).then(() => {
                    renderGcalList();
                    fetchGoogleCalendarEvents();
                });
            });
            listEl.appendChild(item);
        });
    }

    // 다중 캘린더 동시 fetch
    function fetchGoogleCalendarEvents() {
        if (!googleCalendarUrls || googleCalendarUrls.length === 0) return;
        const syncIcon = document.querySelector('#calendar-sync-btn i');
        if (syncIcon) syncIcon.classList.add('fa-spin');

        const fetches = googleCalendarUrls.map(cal => {
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(cal.url);
            return fetch(proxyUrl)
                .then(res => res.text())
                .then(text => ({ name: cal.name, events: parseICalText(text) }))
                .catch(err => {
                    console.error(`[${cal.name}] iCal 동기화 에러:`, err);
                    return { name: cal.name, events: [] };
                });
        });

        Promise.all(fetches).then(results => {
            googleEvents = {};
            results.forEach(result => {
                result.events.forEach(ev => {
                    if (!googleEvents[ev.dateStr]) googleEvents[ev.dateStr] = [];
                    googleEvents[ev.dateStr].push({
                        title: ev.title,
                        color: '#4285F4',
                        isGoogle: true
                    });
                });
            });
            renderCalendar();
            if (calendarModal && calendarModal.classList.contains('show')) {
                renderModalEventList();
            }
        }).finally(() => {
            if (syncIcon) syncIcon.classList.remove('fa-spin');
        });
    }

    // 구글 캘린더 UI 팝업 및 기능
    const calendarSettingsBtn = document.getElementById('calendar-settings-btn');
    const calendarSyncBtn = document.getElementById('calendar-sync-btn');
    const calendarSettingsModal = document.getElementById('calendar-settings-modal');
    const calendarSettingsClose = document.getElementById('calendar-settings-close');
    const calendarSettingsForm = document.getElementById('calendar-settings-form');

    if (calendarSettingsBtn) {
        calendarSettingsBtn.addEventListener('click', () => {
            if (calendarSettingsModal) calendarSettingsModal.classList.add('show');
        });
    }
    if (calendarSyncBtn) {
        calendarSyncBtn.addEventListener('click', () => {
            fetchGoogleCalendarEvents();
        });
    }
    if (calendarSettingsClose) {
        calendarSettingsClose.addEventListener('click', () => {
            if (calendarSettingsModal) calendarSettingsModal.classList.remove('show');
        });
    }
    if (calendarSettingsModal) {
        calendarSettingsModal.addEventListener('click', (e) => {
            if (e.target === calendarSettingsModal) {
                calendarSettingsModal.classList.remove('show');
            }
        });
    }
    if (calendarSettingsForm) {
        calendarSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!checkAuth()) return;
            const nameInput = document.getElementById('gcal-name-input');
            const urlInput = document.getElementById('calendar-gas-url');
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            if (!name || !url) return;

            const submitBtn = calendarSettingsForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 추가 중...';
            }

            // 기존 배열에 추가
            const newList = [...googleCalendarUrls, { name, url }];

            db.collection('users').doc(currentUserInfo.uid).set({
                googleCalendarUrls: newList
            }, { merge: true }).then(() => {
                nameInput.value = '';
                urlInput.value = '';
            }).catch(err => {
                console.error(err);
                alert("저장 중 오류가 발생했습니다.");
            }).finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> 캘린더 추가';
                }
            });
        });
    }

    // 슬라이더 렌더링
    function renderHeroSlider() {
        if (!heroSliderTrack) return;
        heroSliderTrack.innerHTML = '';
        heroSliderDots.innerHTML = '';

        heroImages.forEach((imgUrl, idx) => {
            const slide = document.createElement('div');
            slide.className = 'hero-slide';
            slide.innerHTML = `<img src="${imgUrl}" alt="DODO 가족 배경 사진 ${idx+1}">`;
            heroSliderTrack.appendChild(slide);

            const dot = document.createElement('div');
            dot.className = `hero-slider-dot ${idx === heroSliderIndex ? 'active' : ''}`;
            dot.addEventListener('click', () => {
                goToSlide(idx);
            });
            heroSliderDots.appendChild(dot);
        });

        goToSlide(heroSliderIndex);
        resetHeroSliderTimer();
    }

    function goToSlide(index) {
        if (heroImages.length === 0) return;
        // 인덱스 범위 순환 처리
        heroSliderIndex = (index + heroImages.length) % heroImages.length;
        
        // 트랙 이동
        heroSliderTrack.style.transform = `translateX(-${heroSliderIndex * 100}%)`;

        // 닷 갱신
        const dots = document.querySelectorAll('.hero-slider-dot');
        dots.forEach((dot, idx) => {
            if (idx === heroSliderIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        goToSlide(heroSliderIndex + 1);
    }

    function prevSlide() {
        goToSlide(heroSliderIndex - 1);
    }

    function resetHeroSliderTimer() {
        if (heroSliderInterval) clearInterval(heroSliderInterval);
        if (heroImages.length > 1) {
            heroSliderInterval = setInterval(nextSlide, 5000); // 5초 간격 전환
        }
    }

    // 슬라이더 수동 제어 버튼 및 모바일 터치 제스처 연동
    if (heroPrevBtn && heroNextBtn) {
        heroPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            prevSlide();
            resetHeroSliderTimer();
        });
        heroNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nextSlide();
            resetHeroSliderTimer();
        });
        
        // 메인 이미지 슬라이더 컨테이너 터치 제스처 장착
        const heroSliderContainer = document.querySelector('.hero-slider-container');
        if (heroSliderContainer) {
            let heroTouchStartX = 0;
            heroSliderContainer.addEventListener('touchstart', (e) => {
                heroTouchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            heroSliderContainer.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].screenX;
                const diffX = heroTouchStartX - touchEndX;
                if (heroImages.length <= 1) return;

                if (diffX > 50) {
                    nextSlide();
                    resetHeroSliderTimer();
                } else if (diffX < -50) {
                    prevSlide();
                    resetHeroSliderTimer();
                }
            }, { passive: true });
        }
    }

    // 배경 사진 관리 모달창 기능
    if (heroEditTrigger && heroManagerModal && heroManagerClose) {
        heroEditTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!checkAuth()) return;
            renderHeroManagerGrid();
            heroManagerModal.classList.add('show');
        });

        heroManagerClose.addEventListener('click', () => {
            heroManagerModal.classList.remove('show');
        });

        heroManagerModal.addEventListener('click', (e) => {
            if (e.target === heroManagerModal) {
                heroManagerModal.classList.remove('show');
            }
        });
    }

    // 모달창 내 이미지 목록 렌더링
    function renderHeroManagerGrid() {
        if (!heroImagesGrid) return;
        heroImagesGrid.innerHTML = '';

        if (heroImages.length === 0 || (heroImages.length === 1 && heroImages[0] === "./assets/dodo_hero.png")) {
            heroImagesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 1.5rem; color:var(--text-muted); font-size:0.85rem;">등록된 배경 사진이 없습니다.</p>';
            return;
        }

        heroImages.forEach((imgUrl, idx) => {
            // 예비 이미지는 삭제 불가
            if (imgUrl === "./assets/dodo_hero.png") return;

            const thumb = document.createElement('div');
            thumb.className = 'hero-thumbnail-item';
            thumb.innerHTML = `
                <img src="${imgUrl}" alt="배경사진">
                <button type="button" class="del-btn" data-index="${idx}">&times;</button>
            `;

            thumb.querySelector('.del-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHeroImage(idx);
            });

            heroImagesGrid.appendChild(thumb);
        });
    }

    // 배경 사진 추가 업로드 핸들러
    if (heroUploadDropzone && heroSliderFileInput) {
        heroUploadDropzone.addEventListener('click', () => {
            if (heroImages.length >= 10 && heroImages[0] !== "./assets/dodo_hero.png") {
                alert("배경 사진은 최대 10장까지만 업로드할 수 있습니다! ⚠️");
                return;
            }
            heroSliderFileInput.click();
        });

        heroSliderFileInput.addEventListener('change', (e) => {
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

                    const compressedBase64 = tempCanvas.toDataURL('image/jpeg', 0.7);

                    // 기존 예비 이미지만 있을 때는 덮어쓰고, 아니면 배열에 추가
                    let newImagesList = [];
                    if (heroImages.length === 1 && heroImages[0] === "./assets/dodo_hero.png") {
                        newImagesList = [compressedBase64];
                    } else {
                        newImagesList = [...heroImages, compressedBase64];
                    }

                    db.collection('settings').doc('main_image').set({
                        images: newImagesList,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedBy: currentUserInfo ? currentUserInfo.nickname : 'unknown'
                    }).then(() => {
                        alert("새로운 배경 사진이 성공적으로 추가되었습니다! 🎉");
                    }).catch(err => {
                        console.error("배경 사진 업로드 에러:", err);
                        alert("배경 사진 저장 실패! ⚠️");
                    });

                    heroSliderFileInput.value = '';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 배경 사진 삭제
    function deleteHeroImage(index) {
        if (!confirm("이 배경 사진을 슬라이더에서 삭제하시겠습니까?")) return;
        
        const updatedImages = [...heroImages];
        updatedImages.splice(index, 1);

        // 사진이 하나도 남지 않았다면 기본 리스트로 복구
        const finalImages = updatedImages.length === 0 ? ["./assets/dodo_hero.png"] : updatedImages;

        db.collection('settings').doc('main_image').set({
            images: finalImages,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUserInfo ? currentUserInfo.nickname : 'unknown'
        }).then(() => {
            alert("선택하신 배경 사진이 삭제되었습니다.");
            if (heroSliderIndex >= finalImages.length) {
                heroSliderIndex = 0;
            }
        }).catch(err => {
            console.error("배경 사진 삭제 에러:", err);
            alert("사진 삭제 실패! ⚠️");
        });
    }

    // 페이지 로딩 시 날짜 입력칸을 오늘 날짜로 기본 세팅
    const initToday = new Date();
    const initYyyy = initToday.getFullYear();
    const initMm = String(initToday.getMonth() + 1).padStart(2, '0');
    const initDd = String(initToday.getDate()).padStart(2, '0');
    const todayStr = `${initYyyy}-${initMm}-${initDd}`;
    if (document.getElementById('gallery-date')) document.getElementById('gallery-date').value = todayStr;
    if (document.getElementById('board-date')) document.getElementById('board-date').value = todayStr;

    initRealtimeDbListeners();
});
