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
                console.error("로그인 에러 코드:", error.code, error.message);
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

                    // 로그인 상태에 맞춘 가족 구성원 카드 수정 아이콘 활성화를 위해 렌더링 갱신
                    if (cachedFamilySnapshot) {
                        renderFamilyCards(cachedFamilySnapshot);
                    }
                })
                .catch((err) => {
                    console.error("사용자 정보를 불러오는 도중 오류 발생:", err);
                    currentUserInfo = {
                        uid: user.uid,
                        nickname: user.displayName || (user.email ? user.email.split('@')[0] : "가족"),
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
                });
        } else {
            currentUserInfo = null;
            headerUserName.textContent = "Login";
            dropdownLoggedOut.classList.remove('hidden');
            dropdownLoggedIn.classList.add('hidden');

            // 로그아웃 상태에 맞춘 가족 구성원 카드 수정 아이콘 제거를 위해 렌더링 갱신
            if (cachedFamilySnapshot) {
                renderFamilyCards(cachedFamilySnapshot);
            }
        }
    });

    function initRealtimeDbListeners() {
        initEventsListener();
        initBoardListener();
        initGuestbookListener();
        initFamilyMembers();
    }
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
        initParticles(); // 테마 전환 시 파티클 컬러 갱신
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
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

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
    // 5. 구글 스타일 가족 캘린더 엔진 (신규 추가)
    // ----------------------------------------------------
    let currentCalDate = new Date();
    const monthYearText = document.getElementById('calendar-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    // 모달 엘리먼트
    const calendarModal = document.getElementById('calendar-modal');
    const modalDateTitle = document.getElementById('modal-date-title');
    const eventForm = document.getElementById('event-form');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventColorSelect = document.getElementById('event-color-select');
    const modalEventList = document.getElementById('modal-event-list');
    const modalCloseBtn = document.querySelector('.calendar-modal-close');
    
    let activeSelectedDateStr = ''; // YYYY-MM-DD 포맷 저장용

    // Firestore 실시간 일정 로드 및 동기화
    let familyEvents = {};
    function initEventsListener() {
        db.collection('events').onSnapshot((snapshot) => {
            familyEvents = {};
            snapshot.forEach((doc) => {
                familyEvents[doc.id] = doc.data().events || [];
            });
            renderCalendar();
            if (calendarModal.classList.contains('show') && activeSelectedDateStr) {
                renderModalEventList();
            }
        });
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();

        // 헤더 텍스트 설정
        monthYearText.textContent = `${year}년 ${month + 1}월`;

        // 이번 달의 1일 요일 및 마지막 날짜 구하기
        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDayDate = new Date(year, month + 1, 0).getDate();
        
        // 이전 달의 마지막 일자 구하기 (앞부분 공백을 채우기 위함)
        const prevLastDayDate = new Date(year, month, 0).getDate();

        // 1. 이전 달 날짜들 렌더링
        for (let i = firstDayIndex; i > 0; i--) {
            const dayNum = prevLastDayDate - i + 1;
            const prevMonthDate = new Date(year, month - 1, dayNum);
            createDayCell(prevMonthDate, false);
        }

        // 2. 이번 달 날짜들 렌더링
        for (let i = 1; i <= lastDayDate; i++) {
            const currentDayDate = new Date(year, month, i);
            createDayCell(currentDayDate, true);
        }

        // 3. 다음 달 날짜들 렌더링 (그리드가 7 * 6 = 42 칸을 채우도록 함)
        const totalCells = 42;
        const currentCellsCount = firstDayIndex + lastDayDate;
        const nextMonthDaysCount = totalCells - currentCellsCount;

        for (let i = 1; i <= nextMonthDaysCount; i++) {
            const nextMonthDate = new Date(year, month + 1, i);
            createDayCell(nextMonthDate, false);
        }
    }

    // 날짜 셀 생성 헬퍼
    function createDayCell(dateObj, isCurrentMonth) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const date = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${date}`;

        if (!isCurrentMonth) {
            dayCell.classList.add('other-month');
        }

        // 요일 구분
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0) dayCell.classList.add('sun');
        if (dayOfWeek === 6) dayCell.classList.add('sat');

        // 오늘 날짜 하이라이트
        const today = new Date();
        if (dateObj.getFullYear() === today.getFullYear() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getDate() === today.getDate()) {
            dayCell.classList.add('today');
        }

        // 일자 텍스트 생성
        dayCell.innerHTML = `<span class="day-number">${dateObj.getDate()}</span>`;

        // 이 날짜에 등록된 일정 닷 배지 추가
        if (familyEvents[dateStr] && familyEvents[dateStr].length > 0) {
            const dotsWrapper = document.createElement('div');
            dotsWrapper.className = 'day-dots';
            
            familyEvents[dateStr].forEach(event => {
                const dot = document.createElement('span');
                dot.className = 'day-dot';
                dot.style.backgroundColor = event.color;
                dotsWrapper.appendChild(dot);
            });
            dayCell.appendChild(dotsWrapper);
        }

        // 셀 클릭 시 일정 모달 활성화
        dayCell.addEventListener('click', () => {
            openEventModal(dateStr);
        });

        calendarGrid.appendChild(dayCell);
    }

    // 이전 달, 다음 달 이동
    prevMonthBtn.addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderCalendar();
    });

    // 일정 관리 모달 열기
    function openEventModal(dateStr) {
        activeSelectedDateStr = dateStr;
        
        // 모달 타이틀 가독성 있게 변환 (예: 2026년 05월 24일 일정)
        const parts = dateStr.split('-');
        modalDateTitle.textContent = `${parts[0]}년 ${parts[1]}월 ${parts[2]}일 일정 🗓️`;
        
        renderModalEventList();
        calendarModal.classList.add('show');
    }

    // 모달 닫기
    modalCloseBtn.addEventListener('click', () => {
        calendarModal.classList.remove('show');
    });

    calendarModal.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            calendarModal.classList.remove('show');
        }
    });

    // 모달 내부 일정 리스트 출력
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
            item.innerHTML = `
                <span class="event-item-title">${escapeHTML(evt.title)}</span>
                <button class="event-del-btn" data-index="${idx}"><i class="fa-regular fa-trash-can"></i></button>
            `;
            modalEventList.appendChild(item);
        });

        // 삭제 이벤트 연결
        modalEventList.querySelectorAll('.event-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                deleteEvent(index);
            });
        });
    }

    // 일정 추가 등록 처리
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkAuth()) return;
        const title = eventTitleInput.value.trim();
        const color = eventColorSelect.value;

        if (!title) return;

        const currentEvents = familyEvents[activeSelectedDateStr] || [];
        const newEvents = [...currentEvents, { title, color }];

        db.collection('events').doc(activeSelectedDateStr).set({
            events: newEvents
        }).then(() => {
            eventTitleInput.value = ''; // 작성폼 초기화
        }).catch(err => {
            console.error("Error adding event: ", err);
            alert("일정 저장에 실패했습니다. 데이터베이스 권한을 확인해주세요! ⚠️\n에러: " + err.message);
        });
    });

    // 일정 삭제 처리
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

    renderCalendar();


    // ----------------------------------------------------
    // 6. 추억 갤러리 필터링 & 라이트박스
    // ----------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
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
    const boardAuthor = document.getElementById('board-author');
    const boardTitle = document.getElementById('board-title');
    const boardFile = document.getElementById('board-file');
    const boardContent = document.getElementById('board-content');
    const boardImgPreview = document.getElementById('board-img-preview');
    const boardPostsGrid = document.getElementById('board-posts-grid');

    let compressedImageBase64 = ''; // 압축된 이미지 캐시 변수

    // 이미지 파일을 읽고 Canvas를 이용해 다운스케일링 압축하는 헬퍼 함수
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
                // 이미지 리사이징 (최대 너비 600px 기준 종횡비 계산)
                const max_width = 600;
                let width = img.width;
                let height = img.height;

                if (width > max_width) {
                    height = Math.round((height * max_width) / width);
                    width = max_width;
                }

                // 메모리에 캔버스를 임시 생성하여 리사이즈 드로잉
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0, width, height);

                // JPEG 포맷에 70% 퀄리티로 압축하여 base64 획득
                compressedImageBase64 = tempCanvas.toDataURL('image/jpeg', 0.7);

                // 화면에 미리보기 업데이트
                boardImgPreview.innerHTML = `<img src="${compressedImageBase64}" alt="업로드 이미지 미리보기">`;
                boardImgPreview.style.display = 'block';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Firestore 실시간 게시글 동기화
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
        });
    }

    // 게시글 목록 렌더링 함수
    function renderBoardPosts() {
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

            // 이미지가 존재하는 경우 상단 배너 추가, 없는 경우 기본 심볼 추가
            const imgHeaderHTML = post.image 
                ? `<div class="post-img-header"><img src="${post.image}" alt="게시글 대표 사진"></div>`
                : `<div class="post-img-header"><div class="post-no-img"><i class="fa-regular fa-image"></i></div></div>`;

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
                    <div class="post-footer">
                        <button class="delete-btn board-post-del-btn" data-id="${post.id}" title="게시글 삭제">
                            <i class="fa-regular fa-trash-can"></i> 삭제하기
                        </button>
                    </div>
                </div>
            `;
            boardPostsGrid.appendChild(postCard);
        });

        // 게시판 삭제 이벤트 위임
        boardPostsGrid.querySelectorAll('.board-post-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteBoardPost(id);
            });
        });
    }

    // 게시판 필터 버튼 이벤트 바인딩
    const boardFilterBtns = document.querySelectorAll('.board-filter-btn');
    boardFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            boardFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeBoardFilter = btn.getAttribute('data-filter');
            renderBoardPosts();
        });
    });

    // 게시글 등록
    boardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkAuth()) return;

        const author = currentUserInfo.nickname;
        const role = currentUserInfo.role;
        const title = boardTitle.value.trim();
        const content = boardContent.value.trim();

        if (!author || !title || !content) return;

        const newPost = {
            author,
            role,
            title,
            content,
            image: compressedImageBase64, // 압축된 이미지 (없으면 빈 문자열)
            date: new Date().getTime()
        };

        db.collection('board_posts').add(newPost).then(() => {
            // 폼 리셋 및 썸네일 박스 감추기
            boardForm.reset();
            boardImgPreview.style.display = 'none';
            boardImgPreview.innerHTML = '';
            compressedImageBase64 = '';
        }).catch(err => {
            console.error("Error adding post: ", err);
            alert("게시글 저장에 실패했습니다. 데이터베이스 권한을 확인해주세요! ⚠️\n에러: " + err.message);
        });
    });

    // 게시글 삭제
    function deleteBoardPost(id) {
        if (!checkAuth()) return;
        if (confirm('이 게시글을 정말로 삭제할까요?')) {
            db.collection('board_posts').doc(id).delete()
                .catch(err => console.error("Error deleting post: ", err));
        }
    }

    // 초기 게시판 출력
    renderBoardPosts();


    // ----------------------------------------------------
    // 8. 스크롤 트리거 타임라인 애니메이션 (Intersection Observer)
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
    const authorInput = document.getElementById('author-input');
    const messageInput = document.getElementById('message-input');
    const guestbookList = document.getElementById('guestbook-list');

    // Firestore 실시간 방명록 동기화
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
                    liked: likedMessages.includes(msgId)
                });
            });
            renderMessages();
        });
    }

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
                    <button class="delete-btn" data-id="${msg.id}" title="메시지 삭제">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
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

        document.querySelectorAll('.delete-btn:not(.board-post-del-btn)').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteMessage(id);
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

    guestbookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkAuth()) return;

        const author = currentUserInfo.nickname;
        const role = currentUserInfo.role;
        const message = messageInput.value.trim();
        const selectedSticker = document.querySelector('input[name="sticker"]:checked').value;

        if (!author || !message) return;

        const newMessage = {
            author,
            role,
            message,
            sticker: selectedSticker,
            date: new Date().getTime(),
            likes: 0
        };

        db.collection('messages').add(newMessage).then(() => {
            messageInput.value = '';
            document.getElementById('st-heart').checked = true;
        }).catch(err => {
            console.error("Error adding message: ", err);
            alert("방명록 저장에 실패했습니다. 데이터베이스 권한을 확인해주세요! ⚠️\n에러: " + err.message);
        });
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
    // 13. 모바일 퀵 네비게이션 제어 (신규 추가)
    // ----------------------------------------------------
    const mobileNavBtn = document.getElementById('mobile-nav-btn');
    const mobileNavDropdown = document.getElementById('mobile-nav-dropdown');

    if (mobileNavBtn && mobileNavDropdown) {
        mobileNavBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileNavDropdown.classList.toggle('hidden');
        });

        // 퀵 메뉴 링크 클릭 시 부드럽게 이동하고 닫기
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

        // 바깥 영역 클릭 시 자동으로 닫기
        document.addEventListener('click', () => {
            mobileNavDropdown.classList.add('hidden');
        });
    }

    // ----------------------------------------------------
    // 14. 가족 구성원 프로필 Firestore 연동 및 관리 (신규 추가)
    // ----------------------------------------------------
    const familyGrid = document.getElementById('family-grid');
    const familyModal = document.getElementById('family-modal');
    const familyModalClose = document.getElementById('family-modal-close');
    const familyEditForm = document.getElementById('family-edit-form');
    const dropdownManageFamilyBtn = document.getElementById('dropdown-manage-family-btn');

    // 기본 시딩(Seeding) 데이터 정의
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

        // 카드 클릭 시 뒤집기 기능 바인딩
        bindCardFlipInteractions();
    }

    window.initFamilyMembers = function() {
        const membersRef = db.collection('family_members');

        membersRef.orderBy('order').onSnapshot(snapshot => {
            // 1. 만약 Firestore에 데이터가 아예 없다면 기본값 시딩 수행
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

            // 스냅샷 캐시 저장
            cachedFamilySnapshot = snapshot;

            // 2. 받아온 실시간 데이터로 카드 렌더링
            renderFamilyCards(snapshot);
        }, err => console.error("가족 구성원 정보 로드 에러:", err));
    }

    // 카드 HTML 엘리먼트 생성 헬퍼
    function createMemberCardHTML(id, data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'member-card-wrapper';
        
        // 로그인 시에만 연필 모양 수정 버튼 렌더링
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

        // 수정 버튼 클릭 이벤트 처리
        if (currentUserInfo) {
            const editBtn = wrapper.querySelector('.member-edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 카드 뒤집기 방지
                    openFamilyEditModal(id, data);
                });
            }
        }

        return wrapper;
    }

    // 카드 플립 인터랙션 바인딩
    function bindCardFlipInteractions() {
        const cards = document.querySelectorAll('.member-card-wrapper');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });
        });
    }

    // 수정 모달 제어
    function openFamilyEditModal(id, data) {
        if (!checkAuth()) return;
        
        document.getElementById('edit-member-id').value = id;
        document.getElementById('edit-member-name').value = data.name || '';
        document.getElementById('edit-member-role').value = data.role || '';
        document.getElementById('edit-member-hobby').value = data.hobby || '';
        document.getElementById('edit-member-comment').value = data.comment || '';
        document.getElementById('edit-member-like').value = data.like || '';

        // 아이콘 선택 매핑 설정 (iconClass와 iconBg를 합친 밸류 매칭)
        const selectIcon = document.getElementById('edit-member-icon');
        if (selectIcon) {
            const iconVal = `${data.iconClass || 'fa-user-tie'}|${data.iconBg || 'bg-blue'}`;
            
            // 옵션 순회하여 매칭
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

    // 가족 모달 닫기
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

    // 드롭다운 [가족 관리] 클릭 시 아빠(첫 번째 구성원)의 편집 창을 디폴트로 열어 줍니다.
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

    // 가족 프로필 수정 폼 제출
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

    renderMessages();

    // 실시간 Firestore 데이터베이스 리스너 등록
    initRealtimeDbListeners();
});
