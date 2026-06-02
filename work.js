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
 
    if (themeToggleBtn) {
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
    }

    // ----------------------------------------------------
    // 모바일 퀵 내비게이션 (Tabs Dropdown)
    // ----------------------------------------------------
    const mobileNavBtn = document.getElementById('work-mobile-nav-btn');
    const mobileNavDropdown = document.getElementById('work-mobile-nav-dropdown');

    if (mobileNavBtn && mobileNavDropdown) {
        mobileNavBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileNavDropdown.classList.toggle('hidden');
        });

        // 화면 바깥을 클릭하면 모바일 메뉴 닫기
        document.addEventListener('click', (e) => {
            if (!mobileNavBtn.contains(e.target) && !mobileNavDropdown.contains(e.target)) {
                mobileNavDropdown.classList.add('hidden');
            }
        });
        
        // 탭 메뉴 항목을 클릭하면 모바일 메뉴 닫기
        mobileNavDropdown.addEventListener('click', (e) => {
            if (e.target.closest('.work-tab')) {
                mobileNavDropdown.classList.add('hidden');
            }
        });
    }

    // ----------------------------------------------------
    // 인증 및 승인 관리 (workUsers)
    // ----------------------------------------------------
    let currentUser = null;
    let currentUserDoc = null;
    let workUserListener = null;

    const authStatusHeader = document.getElementById('auth-status-header');
    const btnClaimMaster = document.getElementById('btn-claim-master');
    const btnWorkLogin = document.getElementById('btn-work-login');
    const userProfileIcon = document.getElementById('user-profile-icon');
    const userProfileImg = document.getElementById('user-profile-img');
    const btnMasterAdmin = document.getElementById('btn-master-admin');
    
    // 모달들 (로그인 안 된 경우 보여주던 기존 모달들)
    const loginRequiredModal = document.getElementById('login-required-modal');

    btnWorkLogin.addEventListener('click', () => {
        window.location.href = 'index.html?login=true';
    });

    const btnMasterLogout = document.getElementById('btn-master-logout');
    
    if (userProfileIcon) {
        userProfileIcon.style.cursor = 'pointer';
        userProfileIcon.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                auth.signOut().then(() => location.reload());
            }
        });
    }

    if (btnMasterLogout) {
        btnMasterLogout.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                auth.signOut().then(() => location.reload());
            }
        });
    }

    // 보안 영역 처리 함수
    function showAuthRequiredMessage(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div style="text-align:center; padding: 100px 50px; color: var(--text-muted);">
                <i class="fa-solid fa-lock" style="font-size: 3rem; margin-bottom: 20px; color: #ff4757;"></i>
                <h3 style="font-size: 1.5rem; margin-bottom: 10px;">접근 권한이 없습니다</h3>
                <p>내용을 보려면 로그인 및 마스터의 승인이 필요합니다.</p>
            </div>`;
        }
    }

    function renderRestrictedContent() {
        const psApp = document.querySelector('.ps-desktop-app');
        const psLock = document.getElementById('ps-auth-lock');

        if (!currentUser || !currentUserDoc || !currentUserDoc.isApproved) {
            showAuthRequiredMessage('work-content-container');
            showAuthRequiredMessage('schedule-content-container');
            showAuthRequiredMessage('performance-content-container');
            showAuthRequiredMessage('members-content-container');
            
            // 프로젝트 탭은 .ps-desktop-app을 숨기고, #ps-auth-lock을 노출
            if (psApp) psApp.style.setProperty('display', 'none', 'important');
            if (psLock) {
                psLock.classList.remove('hidden');
                psLock.innerHTML = `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:300px; color: var(--text-muted);">
                    <i class="fa-solid fa-lock" style="font-size: 3rem; margin-bottom: 20px; color: #ff4757;"></i>
                    <h3 style="font-size: 1.5rem; margin-bottom: 10px;">접근 권한이 없습니다</h3>
                    <p>내용을 보려면 로그인 및 마스터의 승인이 필요합니다.</p>
                </div>`;
            }
            return;
        }

        // 로그인 및 승인됨 -> 정상 렌더링 복구
        if (psApp) psApp.style.display = ''; // 원래 display로 복귀
        if (psLock) {
            psLock.classList.add('hidden');
            psLock.innerHTML = '';
        }

        // 로그인 및 승인됨 -> 정상 렌더링
        const workHeroEditTrigger = document.getElementById('work-hero-img-edit-trigger');
        if (workHeroEditTrigger) {
            if (currentUserDoc && currentUserDoc.isMaster) {
                workHeroEditTrigger.classList.remove('hidden');
            } else {
                workHeroEditTrigger.classList.add('hidden');
            }
        }
        
        const btnWriteNotice = document.getElementById('btn-write-notice');
        if (btnWriteNotice) {
            if (currentUserDoc && currentUserDoc.isMaster) {
                btnWriteNotice.classList.remove('hidden');
            } else {
                btnWriteNotice.classList.add('hidden');
            }
        }

        // 프로젝트 탭 복구는 페이지 새로고침 필요하므로 일단 UI 초기화 (간단히 하기 위해 페이지 강제 리로드하거나 기존 렌더 함수 호출)
        renderWorkLinks();
        renderSchedules();
        renderPerformances();
        if (window.renderWorkMembers) window.renderWorkMembers();
        if (typeof renderPsScheduler === 'function') renderPsScheduler();
        if (typeof renderNotices === 'function') renderNotices();
    }

    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (workUserListener) {
            workUserListener(); // Unsubscribe previous listener
            workUserListener = null;
        }

        if (user) {
            // Check workCalendarUrls in users collection
            if (userGoogleCalendarListener) {
                userGoogleCalendarListener();
                userGoogleCalendarListener = null;
            }
            userGoogleCalendarListener = db.collection('users').doc(user.uid).onSnapshot((uDoc) => {
                if (uDoc.exists && uDoc.data().workCalendarUrls && Array.isArray(uDoc.data().workCalendarUrls)) {
                    googleCalendarUrls = uDoc.data().workCalendarUrls;
                } else {
                    googleCalendarUrls = [];
                }
                fillGcalSlots();
                renderGoogleCalendarFilters();
                fetchGoogleCalendarEvents();
            }, err => console.error("DODO.work 구글 캘린더 리스너 에러:", err));

            // Check workUsers collection
            const userRef = db.collection('workUsers').doc(user.uid);
            
            workUserListener = userRef.onSnapshot(doc => {
                if (!doc.exists) {
                    // 신규 유저 등록 (기본 승인 안 됨)
                    userRef.set({
                        uid: user.uid,
                        email: user.email,
                        nickname: user.displayName || user.email.split('@')[0],
                        photoURL: user.photoURL,
                        isApproved: false,
                        isMaster: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    return;
                }
                
                currentUserDoc = doc.data();
                checkMasterAvailability();
                
                if (currentUserDoc.isApproved) {
                    // 승인됨 -> 화면 표시
                    authStatusHeader.style.display = 'none';
                    btnWorkLogin.style.display = 'none';
                    
                    if (currentUserDoc.isMaster) {
                        btnMasterAdmin.style.display = 'inline-block';
                        if (userProfileIcon) userProfileIcon.style.display = 'none';
                    } else {
                        btnMasterAdmin.style.display = 'none';
                        if (userProfileIcon) {
                            userProfileIcon.style.display = 'block';
                            let pUrl = currentUserDoc.photoURL;
                            const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2IwYmVjNSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
                            userProfileImg.src = (pUrl && pUrl !== 'null' && pUrl.trim() !== '') ? pUrl : DEFAULT_AVATAR;
                        }
                    }
 
                    renderRestrictedContent();
                    if (typeof renderPsScheduler === 'function') renderPsScheduler();
                } else {
                    // 승인 대기중 -> 화면 가림
                    authStatusHeader.style.display = 'inline-block';
                    btnWorkLogin.style.display = 'none';
                    if (userProfileIcon) {
                        userProfileIcon.style.display = 'block';
                        let pUrl = currentUserDoc.photoURL;
                        const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2IwYmVjNSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
                        userProfileImg.src = (pUrl && pUrl !== 'null' && pUrl.trim() !== '') ? pUrl : DEFAULT_AVATAR;
                    }
                    if (btnMasterAdmin) btnMasterAdmin.style.display = 'none';
                    
                    renderRestrictedContent();
                }
            });
        } else {
            // 로그아웃 됨
            currentUserDoc = null;
            authStatusHeader.style.display = 'none';
            btnWorkLogin.style.display = 'inline-block';
            btnClaimMaster.style.display = 'none';
            
            if (userProfileIcon) userProfileIcon.style.display = 'none';
            if (btnMasterAdmin) btnMasterAdmin.style.display = 'none';
 
            if (userGoogleCalendarListener) {
                userGoogleCalendarListener();
                userGoogleCalendarListener = null;
            }
            googleCalendarUrls = [];
            googleEvents = {};
            fillGcalSlots();
            renderGoogleCalendarFilters();
            if (typeof renderWorkCalendar === 'function') {
                renderWorkCalendar();
            }

            // 로그아웃 상태일 때도 restricted message 렌더링
            renderRestrictedContent();
        }
    });

    // 마스터 권한 획득 가능 여부 확인
    function checkMasterAvailability() {
        if (!currentUser || !currentUserDoc) return;
        
        db.collection('workUsers').where('isMaster', '==', true).get().then(snapshot => {
            if (snapshot.empty && !currentUserDoc.isMaster) {
                // 마스터가 아무도 없으면 획득 버튼 표시
                btnClaimMaster.style.display = 'inline-block';
            } else {
                btnClaimMaster.style.display = 'none';
            }
        });
    }

    // 마스터 권한 획득 버튼
    btnClaimMaster.addEventListener('click', () => {
        if (!currentUser) return;
        db.collection('workUsers').where('isMaster', '==', true).get().then(snapshot => {
            if (snapshot.empty) {
                db.collection('workUsers').doc(currentUser.uid).update({
                    isMaster: true,
                    isApproved: true
                }).then(() => {
                    alert("최초 마스터 권한을 획득하셨습니다!");
                });
            } else {
                alert("이미 다른 마스터가 존재합니다.");
                btnClaimMaster.style.display = 'none';
            }
        });
    });

    // ----------------------------------------------------
    // 마스터 회원 관리 로직
    // ----------------------------------------------------
    const masterAdminModal = document.getElementById('master-admin-modal');
    const masterApprovalList = document.getElementById('master-approval-list');
    
    if (btnMasterAdmin) {
        btnMasterAdmin.addEventListener('click', () => {
            masterAdminModal.classList.remove('hidden');
            loadMasterApprovalList();
        });
    }

    function loadMasterApprovalList() {
        if (!masterApprovalList) return;
        masterApprovalList.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">로딩 중...</p>';
        
        db.collection('workUsers').get()
            .then(snapshot => {
                masterApprovalList.innerHTML = '';
                if (snapshot.empty) {
                    masterApprovalList.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">가입된 회원이 없습니다.</p>';
                    return;
                }
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.isMaster) return; // 마스터 본인은 리스트에서 제외
                    
                    const item = document.createElement('div');
                    item.style.cssText = 'display: flex; flex-direction: column; gap: 10px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid var(--card-border); margin-bottom: 10px;';
                    
                    const isApproved = data.isApproved === true;
                    const isUserMaster = data.isMaster === true;
                    
                    const statusBadge = isApproved 
                        ? `<span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(46, 213, 115, 0.2); color: #2ed573;">승인됨</span>`
                        : `<span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(255, 71, 87, 0.2); color: #ff4757;">대기중</span>`;

                    const roleBadge = isUserMaster
                        ? `<span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(255, 165, 2, 0.2); color: #ffa502; margin-left: 5px;">마스터</span>`
                        : `<span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: rgba(148, 163, 184, 0.2); color: #94a3b8; margin-left: 5px;">일반</span>`;

                    const actionBtn = isApproved
                        ? `<button class="btn btn-secondary" onclick="window.workToggleApproval('${doc.id}', false)" style="padding: 6px 10px; font-size: 0.8rem; border-color: #ff4757; color: #ff4757; flex: 1;">승인 취소</button>`
                        : `<button class="btn btn-primary" onclick="window.workToggleApproval('${doc.id}', true)" style="padding: 6px 10px; font-size: 0.8rem; flex: 1;">가입 승인</button>`;

                    const roleBtn = isUserMaster
                        ? `<button class="btn btn-secondary" onclick="window.workToggleMaster('${doc.id}', false)" style="padding: 6px 10px; font-size: 0.8rem; border-color: #ffa502; color: #ffa502; flex: 1;">일반으로 강등</button>`
                        : `<button class="btn btn-secondary" onclick="window.workToggleMaster('${doc.id}', true)" style="padding: 6px 10px; font-size: 0.8rem; border-color: #2ed573; color: #2ed573; flex: 1;">마스터 임명</button>`;

                    item.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <p style="margin: 0; font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 5px;">${data.nickname} ${statusBadge} ${roleBadge}</p>
                                <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${data.email}</p>
                            </div>
                            <button class="btn btn-secondary" onclick="window.workRejectUser('${doc.id}')" style="padding: 6px 12px; font-size: 0.8rem; border-color: #ff4757; color: #ff4757;" title="계정 완전 삭제"><i class="fa-solid fa-user-xmark"></i> 강제 탈퇴</button>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 5px;">
                            ${actionBtn}
                            ${roleBtn}
                        </div>
                    `;
                    masterApprovalList.appendChild(item);
                });
            })
            .catch(err => {
                console.error("회원 리스트 로드 실패:", err);
                masterApprovalList.innerHTML = '<p style="text-align: center; color: #ff4757; font-size: 0.9rem;">리스트를 불러오는 중 오류가 발생했습니다.</p>';
            });
    }

    window.workToggleApproval = function(userId, approve) {
        const actionStr = approve ? "승인" : "승인 해제";
        if (confirm(`이 회원을 ${actionStr} 처리하시겠습니까?`)) {
            db.collection('workUsers').doc(userId).update({ isApproved: approve })
                .then(() => {
                    alert(`${actionStr} 완료되었습니다.`);
                    loadMasterApprovalList();
                })
                .catch(err => {
                    console.error("승인/해제 실패:", err);
                    alert("처리 중 오류가 발생했습니다.");
                });
        }
    };

    window.workToggleMaster = function(userId, makeMaster) {
        const actionStr = makeMaster ? "마스터로 임명" : "일반 계정으로 강등";
        if (confirm(`이 회원을 ${actionStr}하시겠습니까?`)) {
            db.collection('workUsers').doc(userId).update({ isMaster: makeMaster })
                .then(() => {
                    alert(`${actionStr} 처리되었습니다.`);
                    loadMasterApprovalList();
                })
                .catch(err => {
                    console.error("권한 설정 실패:", err);
                    alert("처리 중 오류가 발생했습니다.");
                });
        }
    };

    window.workRejectUser = function(userId) {
        if (confirm("이 회원의 가입을 거절하시겠습니까? 기록이 삭제됩니다.")) {
            db.collection('workUsers').doc(userId).delete()
                .then(() => {
                    alert("거절 및 삭제되었습니다.");
                    loadMasterApprovalList();
                })
                .catch(err => {
                    alert("오류가 발생했습니다.");
                });
        }
    };

    const btnResignMaster = document.getElementById('btn-resign-master');
    if (btnResignMaster) {
        btnResignMaster.addEventListener('click', () => {
            if (confirm("정말 마스터 권한을 포기하시겠습니까? 권한을 포기하면 다른 회원이 마스터가 될 수 있습니다.")) {
                db.collection('workUsers').doc(currentUser.uid).update({
                    isMaster: false
                }).then(() => {
                    alert("마스터 권한을 포기하셨습니다.");
                    masterAdminModal.classList.add('hidden');
                });
            }
        });
    }

    // ----------------------------------------------------
    // 탭 네비게이션
    // ----------------------------------------------------
    let currentTab = 'main';
    const tabs = document.querySelectorAll('.work-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            tab.classList.add('active');
            currentTab = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(`tab-${currentTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }
            
            const btnOpenModal = document.getElementById('btn-open-modal');
            if (btnOpenModal) {
                if (currentTab === 'main' || currentTab === 'members' || currentTab === 'projects') {
                    btnOpenModal.style.display = 'none';
                } else {
                    btnOpenModal.style.display = 'flex';
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
                
                // 도메인 추출 및 파비콘 이미지 적용
                let domain = '';
                try {
                    let targetUrl = link.url;
                    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                        targetUrl = 'https://' + targetUrl;
                    }
                    const urlObj = new URL(targetUrl);
                    domain = urlObj.hostname;
                } catch (e) {}

                const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
                const iconHtml = faviconUrl 
                    ? `<img src="${faviconUrl}" style="width: 24px; height: 24px; border-radius: 6px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';"><i class="${iconClass}" style="display:none;"></i>`
                    : `<i class="${iconClass}"></i>`;

                grid.insertAdjacentHTML('beforeend', `
                    <a href="${link.url}" target="_blank" class="work-card glass-card">
                        <div class="work-icon-wrap" style="display: flex; align-items: center; justify-content: center; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid var(--card-border); border-radius: 8px; width: 42px; height: 42px; padding: 0;">
                            ${iconHtml}
                        </div>
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
    // 공지사항 (Notices)
    // ====================================================
    const noticeContainer = document.getElementById('notice-list-container');
    const noticeWriteModal = document.getElementById('notice-write-modal');
    const noticeWriteClose = document.getElementById('notice-write-close');
    const btnSubmitNotice = document.getElementById('btn-submit-notice');
    
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#btn-write-notice')) {
            document.getElementById('notice-write-title').value = '';
            document.getElementById('notice-write-content').value = '';
            noticeWriteModal.classList.remove('hidden');
        }
    });
    
    if (noticeWriteClose) {
        noticeWriteClose.addEventListener('click', () => noticeWriteModal.classList.add('hidden'));
    }
    
    if (btnSubmitNotice) {
        btnSubmitNotice.addEventListener('click', () => {
            const title = document.getElementById('notice-write-title').value.trim();
            const content = document.getElementById('notice-write-content').value.trim();
            if (!title || !content) return alert("제목과 내용을 입력하세요.");
            
            db.collection('workNotices').add({
                title,
                content,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUserDoc?.nickname || '관리자',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                noticeWriteModal.classList.add('hidden');
                alert("공지사항이 등록되었습니다.");
            }).catch(e => {
                alert("공지 등록 실패: " + e.message);
            });
        });
    }

    let noticesData = [];
    db.collection('workNotices').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        noticesData = [];
        snapshot.forEach(doc => noticesData.push({ id: doc.id, ...doc.data() }));
        if (typeof renderNotices === 'function') renderNotices();
    });

    window.renderNotices = function() {
        if (!noticeContainer) return;
        noticeContainer.innerHTML = '';
        if (noticesData.length === 0) {
            noticeContainer.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);"><i class="fa-solid fa-bullhorn"></i> 등록된 공지사항이 없습니다.</div>';
            return;
        }
        
        noticesData.forEach(notice => {
            const div = document.createElement('div');
            div.style.cssText = "padding: 1rem; border-bottom: 1px solid var(--card-border); position: relative;";
            
            const dateStr = notice.createdAt ? new Date(notice.createdAt.toDate()).toLocaleDateString() : '';
            
            let delBtn = '';
            if (currentUserDoc && currentUserDoc.isMaster) {
                delBtn = `<button onclick="deleteNotice('${notice.id}')" style="position:absolute; right:10px; top:10px; background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`;
            }
            
            div.innerHTML = `
                <div style="font-weight:700; color:var(--primary-color); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem; padding-right: 30px;">
                    <i class="fa-solid fa-thumbtack"></i> ${notice.title}
                </div>
                <div style="font-size:0.9rem; color:var(--text-color); margin-bottom:0.5rem; white-space:pre-wrap;">${notice.content}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">작성자: ${notice.authorName} | ${dateStr}</div>
                ${delBtn}
            `;
            noticeContainer.appendChild(div);
        });
    }

    window.deleteNotice = function(id) {
        if(confirm("정말 공지사항을 삭제하시겠습니까?")) {
            db.collection('workNotices').doc(id).delete().then(() => {
                alert("삭제되었습니다.");
            }).catch(e => alert("삭제 실패: " + e.message));
        }
    }

    // ====================================================
    // 일정관리 (Schedule Calendar)
    // ====================================================
    let schedulesData = [];
    const workCalendarGrid = document.getElementById('work-calendar-grid');
    const workCalendarMonthYear = document.getElementById('work-calendar-month-year');
    
    let workCurrentDate = new Date();
    let workCurrentYear = workCurrentDate.getFullYear();
    let workCurrentMonth = workCurrentDate.getMonth();

    // 구글 캘린더 연동 변수
    let googleCalendarUrls = [];
    let googleEvents = {};
    let userGoogleCalendarListener = null;

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

    // webcal 및 다중 프록시를 적용해 캘린더 데이터를 가져오는 헬퍼 함수
    async function fetchWithProxy(url, proxyIndexOffset = 0) {
        let targetUrl = url.trim();
        if (targetUrl.startsWith('webcal://')) {
            targetUrl = 'https://' + targetUrl.substring(9);
        }

        const proxies = [
            (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
        ];

        let lastError = null;
        for (let i = 0; i < proxies.length; i++) {
            const idx = (i + proxyIndexOffset) % proxies.length;
            const getProxyUrl = proxies[idx];
            try {
                const proxyUrl = getProxyUrl(targetUrl);
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error(`HTTP 에러! 상태코드: ${res.status}`);
                const text = await res.text();
                if (text && (text.includes('BEGIN:VCALENDAR') || text.includes('begin:vcalendar'))) {
                    return text;
                } else {
                    throw new Error('올바른 iCal(ICS) 형식이 아닙니다.');
                }
            } catch (err) {
                console.warn(`프록시 실패 (${getProxyUrl(targetUrl)}): ${err.message}`);
                lastError = err;
            }
        }
        throw lastError || new Error('모든 프록시 서버 연결 실패');
    }

    // 다중 캘린더 동시 fetch
    async function fetchGoogleCalendarEvents() {
        if (!googleCalendarUrls || googleCalendarUrls.length === 0) {
            googleEvents = {};
            if (typeof renderWorkCalendar === 'function') renderWorkCalendar();
            return;
        }
        const syncIcon = document.querySelector('#work-calendar-sync-btn i');
        if (syncIcon) syncIcon.classList.add('fa-spin');

        const results = [];
        for (let i = 0; i < googleCalendarUrls.length; i++) {
            const cal = googleCalendarUrls[i];
            
            // 비활성화된 것은 페치를 건너뜁니다
            if (cal.enabled === false) {
                continue;
            }
            
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            try {
                const text = await fetchWithProxy(cal.url, i);
                const events = parseICalText(text);
                console.log(`[DODO.work - ${cal.name}] 구글 캘린더 동기화 완료: ${events.length}개 일정`);
                results.push({ name: cal.name, events: events, success: true, index: i });
            } catch (err) {
                console.error(`[DODO.work - ${cal.name}] 구글 캘린더 동기화 실패:`, err);
                results.push({ name: cal.name, events: [], success: false, error: err.message, index: i });
            }
        }

        try {
            googleEvents = {};
            let failedList = [];
            const googleCalendarColors = ['#4285F4', '#34A853', '#E67C73', '#F7CB4D', '#7986CB'];

            results.forEach(result => {
                if (!result.success) failedList.push(result.name);
                const calColor = googleCalendarColors[result.index % googleCalendarColors.length] || '#4285F4';
                result.events.forEach(ev => {
                    if (!googleEvents[ev.dateStr]) googleEvents[ev.dateStr] = [];
                    googleEvents[ev.dateStr].push({
                        title: ev.title,
                        color: calColor,
                        isGoogle: true
                    });
                });
            });
            if (typeof renderWorkCalendar === 'function') renderWorkCalendar();
            if (failedList.length > 0) {
                console.warn(`일부 캘린더 동기화 실패: ${failedList.join(', ')}`);
            }
        } catch (e) {
            console.error("구글 캘린더 통합 렌더링 중 오류:", e);
        } finally {
            if (syncIcon) syncIcon.classList.remove('fa-spin');
        }
    }

    // 5칸 고정 입력필드에 저장된 데이터 채우기
    function fillGcalSlots() {
        for (let i = 0; i < 5; i++) {
            const nameEl = document.getElementById(`work-gcal-name-${i}`);
            const urlEl = document.getElementById(`work-gcal-url-${i}`);
            const enableEl = document.getElementById(`work-gcal-enable-${i}`);
            if (nameEl) nameEl.value = (googleCalendarUrls[i] && googleCalendarUrls[i].name) || '';
            if (urlEl) urlEl.value = (googleCalendarUrls[i] && googleCalendarUrls[i].url) || '';
            if (enableEl) {
                enableEl.checked = !(googleCalendarUrls[i] && googleCalendarUrls[i].enabled === false);
            }
        }
    }

    // 구글 캘린더 개별 표시 필터 렌더링
    function renderGoogleCalendarFilters() {
        const filterContainer = document.getElementById('work-gcal-filter-container');
        if (!filterContainer) return;

        const activeCals = googleCalendarUrls.filter(cal => cal && cal.url && cal.name);
        if (activeCals.length === 0) {
            filterContainer.innerHTML = '';
            filterContainer.classList.add('hidden');
            return;
        }

        filterContainer.classList.remove('hidden');

        // 5가지 구글 캘린더 테마 파스텔톤 색상 지정
        const googleCalendarColors = [
            '#4285F4', // 1번: 블루
            '#34A853', // 2번: 그린
            '#E67C73', // 3번: 레드/자몽
            '#F7CB4D', // 4번: 옐로우/바나나
            '#7986CB'  // 5번: 라벤더/퍼플
        ];

        let html = '<span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-right: 5px;"><i class="fa-solid fa-filter"></i> 캘린더 필터:</span>';
        
        googleCalendarUrls.forEach((cal, index) => {
            if (!cal || !cal.url || !cal.name) return;

            const calColor = googleCalendarColors[index % googleCalendarColors.length] || '#4285F4';
            const isChecked = cal.enabled !== false;

            html += `
                <label class="gcal-filter-item" style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 12px; border-radius: 20px; background: rgba(255,255,255,0.04); font-size: 0.85rem; border: 1px solid var(--card-border); user-select: none; transition: all 0.2s ease;">
                    <input type="checkbox" data-index="${index}" ${isChecked ? 'checked' : ''} style="width: 14px; height: 14px; cursor: pointer; accent-color: ${calColor}; margin: 0;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${calColor};"></span>
                    <span style="color: ${isChecked ? 'var(--text-color)' : 'var(--text-muted)'}; font-weight: ${isChecked ? '600' : '400'};">${cal.name}</span>
                </label>
            `;
        });

        filterContainer.innerHTML = html;

        // 이벤트 바인딩
        const checkboxes = filterContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(chk => {
            chk.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                const isChecked = e.target.checked;
                
                if (googleCalendarUrls[idx]) {
                    googleCalendarUrls[idx].enabled = isChecked;
                    
                    // 로컬 슬롯 체크박스 UI도 즉시 반영
                    fillGcalSlots();

                    // Firestore에 실시간 저장
                    if (currentUser && currentUser.uid) {
                        db.collection('users').doc(currentUser.uid).set({
                            workCalendarUrls: googleCalendarUrls
                        }, { merge: true }).catch(err => {
                            console.error("Firestore 필터 동기화 실패:", err);
                        });
                    }

                    // 캘린더 표시 갱신
                    fetchGoogleCalendarEvents();
                }
            });
        });
    }

    db.collection('workSchedules').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        schedulesData = [];
        snapshot.forEach(doc => schedulesData.push({ id: doc.id, ...doc.data() }));
        if (typeof renderWorkCalendar === 'function') {
            renderWorkCalendar();
        }
    });

    document.getElementById('work-prev-year-btn')?.addEventListener('click', () => { workCurrentYear--; renderWorkCalendar(); });
    document.getElementById('work-next-year-btn')?.addEventListener('click', () => { workCurrentYear++; renderWorkCalendar(); });
    document.getElementById('work-prev-month-btn')?.addEventListener('click', () => {
        workCurrentMonth--;
        if (workCurrentMonth < 0) { workCurrentMonth = 11; workCurrentYear--; }
        renderWorkCalendar();
    });
    document.getElementById('work-next-month-btn')?.addEventListener('click', () => {
        workCurrentMonth++;
        if (workCurrentMonth > 11) { workCurrentMonth = 0; workCurrentYear++; }
        renderWorkCalendar();
    });

    // 구글 캘린더 UI 연동
    document.getElementById('work-calendar-sync-btn')?.addEventListener('click', () => {
        fetchGoogleCalendarEvents();
    });
    document.getElementById('work-calendar-settings-btn')?.addEventListener('click', () => {
        document.getElementById('work-calendar-settings-modal')?.classList.remove('hidden');
    });
    document.getElementById('work-calendar-settings-close')?.addEventListener('click', () => {
        document.getElementById('work-calendar-settings-modal')?.classList.add('hidden');
    });
    document.getElementById('work-calendar-settings-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) return;
        
        const newList = [];
        for (let i = 0; i < 5; i++) {
            const nameVal = document.getElementById(`work-gcal-name-${i}`).value.trim();
            const urlVal = document.getElementById(`work-gcal-url-${i}`).value.trim();
            const enableEl = document.getElementById(`work-gcal-enable-${i}`);
            const enabled = enableEl ? enableEl.checked : true;
            if (urlVal) {
                newList.push({
                    name: nameVal || `캘린더 ${i+1}`,
                    url: urlVal,
                    enabled: enabled
                });
            }
        }
        
        db.collection('users').doc(currentUser.uid).set({
            workCalendarUrls: newList
        }, { merge: true }).then(() => {
            alert("구글 캘린더 설정이 저장되었습니다.");
            document.getElementById('work-calendar-settings-modal')?.classList.add('hidden');
        }).catch(err => {
            console.error("캘린더 설정 저장 오류:", err);
            alert("설정 저장 중 오류가 발생했습니다.");
        });
    });

    window.renderWorkCalendar = function() {
        if (!workCalendarGrid) return;
        workCalendarGrid.innerHTML = '';
        
        if (workCalendarMonthYear) {
            workCalendarMonthYear.innerText = `${workCurrentYear}년 ${workCurrentMonth + 1}월`;
        }
        
        const firstDay = new Date(workCurrentYear, workCurrentMonth, 1).getDay();
        const daysInMonth = new Date(workCurrentYear, workCurrentMonth + 1, 0).getDate();
        
        for (let i = 0; i < firstDay; i++) {
            const blankCell = document.createElement('div');
            blankCell.className = 'calendar-day empty';
            blankCell.style.cssText = "min-height: 80px; background: rgba(255,255,255,0.02); border-radius: 8px;";
            workCalendarGrid.appendChild(blankCell);
        }
        
        const today = new Date();
        const isCurrentMonth = (workCurrentYear === today.getFullYear() && workCurrentMonth === today.getMonth());
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.style.cssText = "min-height: 80px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; padding: 5px; position: relative; cursor: pointer; display: flex; flex-direction: column; gap: 4px;";
            
            const dayStr = String(d).padStart(2, '0');
            const monthStr = String(workCurrentMonth + 1).padStart(2, '0');
            const dateString = `${workCurrentYear}-${monthStr}-${dayStr}`;
            
            let dateColor = "var(--text-color)";
            const dayOfWeek = new Date(workCurrentYear, workCurrentMonth, d).getDay();
            if (dayOfWeek === 0) dateColor = "#ff4757"; // Sunday
            if (dayOfWeek === 6) dateColor = "#3742fa"; // Saturday
            if (isCurrentMonth && d === today.getDate()) {
                dateColor = "var(--primary-color)";
                dayCell.style.border = "2px solid var(--primary-color)";
            }
            
            const dateSpan = document.createElement('span');
            dateSpan.style.cssText = `font-size: 0.85rem; font-weight: bold; color: ${dateColor}; align-self: flex-start;`;
            dateSpan.innerText = d;
            dayCell.appendChild(dateSpan);
            
            dayCell.onclick = (e) => {
                if (e.target.closest('.schedule-item')) return; // Ignore if clicked on a schedule
                if (!currentUser) {
                    const reqModal = document.getElementById('login-required-modal');
                    if(reqModal) reqModal.classList.remove('hidden');
                    return;
                }
                const dateInput = document.getElementById('sch-date');
                if (dateInput) dateInput.value = dateString;
                const titleInput = document.getElementById('sch-title');
                if (titleInput) titleInput.value = '';
                const modal = document.getElementById('modal-schedule');
                if (modal) modal.classList.remove('hidden');
            };
            
            let combinedEvents = [];
            
            // 기존 Firestore 일정 데이터를 combinedEvents 형태로 변환
            const daySchedules = schedulesData.filter(sch => sch.date === dateString);
            daySchedules.forEach(sch => {
                combinedEvents.push({
                    id: sch.id,
                    title: sch.title,
                    completed: sch.completed,
                    isGoogle: false
                });
            });
            
            // 구글 캘린더 일정 추가
            if (googleEvents[dateString]) {
                googleEvents[dateString].forEach(gev => {
                    combinedEvents.push({
                        title: gev.title,
                        color: gev.color,
                        isGoogle: true
                    });
                });
            }
            
            combinedEvents.forEach(evt => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'schedule-item';
                
                if (evt.isGoogle) {
                    itemDiv.style.cssText = `font-size: 0.75rem; padding: 4px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: ${evt.color || '#4285F4'}40; color: ${evt.color || '#4285F4'}; cursor: default; border-left: 3px solid ${evt.color || '#4285F4'};`;
                    itemDiv.innerHTML = `<i class="fa-brands fa-google"></i> ${evt.title}`;
                    itemDiv.onclick = (e) => {
                        e.stopPropagation();
                        alert(`[구글 일정] ${evt.title}`);
                    };
                } else {
                    itemDiv.style.cssText = `font-size: 0.75rem; padding: 4px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: ${evt.completed ? 'rgba(255,255,255,0.05)' : 'rgba(0, 206, 201, 0.2)'}; color: ${evt.completed ? 'var(--text-muted)' : '#00cec9'}; text-decoration: ${evt.completed ? 'line-through' : 'none'}; cursor: pointer;`;
                    itemDiv.innerText = evt.title;
                    itemDiv.onclick = (e) => {
                        e.stopPropagation();
                        if (!currentUser) return;
                        if (confirm(`'${evt.title}' 일정을 삭제하시겠습니까?`)) {
                            window.deleteItem('workSchedules', evt.id);
                        } else if (confirm(`'${evt.title}' 일정의 완료 상태를 변경하시겠습니까?`)) {
                            window.toggleSchedule(evt.id, evt.completed);
                        }
                    };
                }
                itemDiv.title = evt.title;
                dayCell.appendChild(itemDiv);
            });
            
            workCalendarGrid.appendChild(dayCell);
        }
    }

    const formSchedule = document.getElementById('form-schedule');
    if (formSchedule) {
        formSchedule.addEventListener('submit', (e) => {
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
    }

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
    // 구성원 소개 (Members)
    // ====================================================
    const membersContainer = document.getElementById('members-content-container');
    let membersData = [];

    db.collection('workMembers').orderBy('createdAt', 'asc').onSnapshot((snapshot) => {
        membersData = [];
        snapshot.forEach(doc => membersData.push({ id: doc.id, ...doc.data() }));
        if (currentUser && currentUserDoc && currentUserDoc.isApproved) {
            if (window.renderWorkMembers) window.renderWorkMembers();
        }
    });

    window.renderWorkMembers = function() {
        if (!membersContainer) return;
        membersContainer.innerHTML = '';
        if (membersData.length === 0) {
            membersContainer.innerHTML = '<div style="text-align:center; padding: 50px; color: var(--text-muted); grid-column: 1 / -1;"><i class="fa-solid fa-users"></i> 등록된 구성원이 없습니다.</div>';
            return;
        }

        membersData.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'member-card-wrapper';
            
            const deleteBtnHtml = (currentUser && currentUserDoc && currentUserDoc.isMaster) 
                ? `<div class="member-edit-btn" onclick="event.stopPropagation(); window.deleteItem('workMembers', '${item.id}')" style="background:#ff4757;" title="구성원 삭제"><i class="fa-solid fa-trash"></i></div>` 
                : '';

            const iconHtml = item.photoBase64 
                ? `<img src="${item.photoBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
                : `<i class="fa-solid fa-user-tie"></i>`;

            wrapper.innerHTML = `
                <div class="member-card">
                    <div class="card-front glass-card">
                        ${deleteBtnHtml}
                        <div class="member-icon bg-blue" style="overflow:hidden; padding:0;">
                            ${iconHtml}
                        </div>
                        <h3 class="member-name">${item.name}</h3>
                        <p class="member-role">${item.role}</p>
                        <span class="card-flip-hint">클릭해서 더 알아보기 <i class="fa-solid fa-rotate"></i></span>
                    </div>
                    <div class="card-back glass-card">
                        <h3>${item.name.split(' ')[0]}의 프로필</h3>
                        <ul class="member-details">
                            <li><i class="fa-solid fa-heart text-pink"></i> 취미: ${item.hobby || '-'}</li>
                            <li><i class="fa-solid fa-comment-dots text-blue"></i> 한마디: "${item.comment || '-'}"</li>
                            <li><i class="fa-solid fa-gift text-purple"></i> 좋아하는 것: ${item.like || '-'}</li>
                        </ul>
                    </div>
                </div>
            `;

            wrapper.addEventListener('click', () => {
                wrapper.classList.toggle('flipped');
            });

            membersContainer.appendChild(wrapper);
        });
    };

    document.getElementById('form-members')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('mem-photo');
        const name = document.getElementById('mem-name').value.trim();
        const role = document.getElementById('mem-role').value.trim();
        const hobby = document.getElementById('mem-hobby').value.trim();
        const comment = document.getElementById('mem-comment').value.trim();
        const like = document.getElementById('mem-like').value.trim();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';
        submitBtn.disabled = true;

        const saveToDb = (base64Str) => {
            db.collection('workMembers').add({
                name, role, hobby, comment, like,
                photoBase64: base64Str,
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                e.target.reset();
                document.getElementById('modal-members').classList.add('hidden');
            }).catch(err => {
                console.error(err);
                alert("저장 중 오류가 발생했습니다.");
            }).finally(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            });
        };

        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 400;

                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64Str = canvas.toDataURL('image/jpeg', 0.8);
                    saveToDb(base64Str);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            saveToDb(null);
        }
    });

    // ====================================================
    // 프로젝트 스케줄러 (Projects Scheduler - Desktop Replica)
    // ====================================================
    let psData = [];
    let psYear = new Date().getFullYear();
    let psDayWidth = 30; // DAY_WIDTH from python
    let psSelectedId = null;
    let psRowIndexMap = []; // Maps Y-index to Task ID
    
    // Display date range (auto-calculated from tasks)
    let psDisplayStartYear = psYear;
    let psDisplayStartMonth = 0;
    let psDisplayEndYear = psYear;
    let psDisplayEndMonth = 11;
    let psSearchFilter = '';

    db.collection('workProjects').orderBy('order', 'asc').onSnapshot((snapshot) => {
        psData = [];
        snapshot.forEach(doc => psData.push({ id: doc.id, ...doc.data() }));
        updateSearchDropdown();
        renderPsScheduler();
    });

    function updateSearchDropdown() {
        const searchSelect = document.getElementById('ps-search');
        if (!searchSelect) return;

        const currentVal = searchSelect.value || 'all';

        let html = '<option value="all">🔍 전체보기 (필터)</option>';
        html += '<optgroup label="진행 상태">';
        html += '<option value="status:대기중">상태: 대기중</option>';
        html += '<option value="status:진행중">상태: 진행중</option>';
        html += '<option value="status:완료">상태: 완료</option>';
        html += '</optgroup>';

        const assignees = [...new Set(psData.map(p => p.assignee ? p.assignee.trim() : '').filter(name => name !== ''))];
        if (assignees.length > 0) {
            html += '<optgroup label="담당자별 필터">';
            assignees.forEach(name => {
                html += `<option value="assignee:${name}">${name}</option>`;
            });
            html += '</optgroup>';
        }

        // Project name quick-jump list
        if (psData.length > 0) {
            html += '<optgroup label="프로젝트 이동">';
            psData.forEach(p => {
                const displayName = (p.name || '(무제)') + (p.parentId ? ' (하위)' : '');
                html += `<option value="goto:${p.id}">${displayName}</option>`;
            });
            html += '</optgroup>';
        }

        searchSelect.innerHTML = html;

        if (searchSelect.querySelector(`option[value="${currentVal}"]`)) {
            searchSelect.value = currentVal;
        } else {
            searchSelect.value = 'all';
        }
    }

    document.getElementById('ps-search')?.addEventListener('change', (e) => {
        const val = e.target.value || 'all';
        if (val.startsWith('goto:')) {
            const id = val.split(':')[1];
            // Clear name filter and render so DOM rows exist
            psSearchFilter = '';
            renderPsScheduler();
            // After render, scroll to the target row if present
            setTimeout(() => {
                const row = Array.from(document.querySelectorAll('.ps-tree-row')).find(r => r.dataset && r.dataset.taskId === id);
                const container = document.getElementById('ps-gantt-container');
                if (row && container) {
                    // scroll tree area to show the row
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 80);
        } else {
            renderPsScheduler();
        }
    });

    document.getElementById('ps-search-input')?.addEventListener('input', (e) => {
        psSearchFilter = e.target.value.trim();
        renderPsScheduler();
    });

    document.getElementById('ps-year')?.addEventListener('change', (e) => { psYear = parseInt(e.target.value); renderPsScheduler(); });
    document.getElementById('ps-btn-today')?.addEventListener('click', () => { 
        psYear = new Date().getFullYear(); 
        if (document.getElementById('ps-year')) {
            document.getElementById('ps-year').value = psYear;
        }
        renderPsScheduler(); 
        
        // 오늘 날짜 위치로 가로 스크롤 부드럽게 이동
        const container = document.getElementById('ps-gantt-container');
        if (container) {
            const today = new Date();
            const yStart = new Date(psDisplayStartYear, psDisplayStartMonth, 1);
            const diffDays = Math.floor((today - yStart) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) {
                const todayX = diffDays * psDayWidth;
                container.scrollTo({
                    left: todayX - (container.clientWidth / 2),
                    behavior: 'smooth'
                });
            }
        }
    });
    
    document.getElementById('ps-btn-fit-screen')?.addEventListener('click', () => {
        // 화면 맞춤: 전체 날짜 범위를 한 화면에 맞춥니다
        const container = document.getElementById('ps-gantt-container');
        if (!container) return;
        const displayStart = new Date(psDisplayStartYear, psDisplayStartMonth, 1);
        const displayEnd = new Date(psDisplayEndYear, psDisplayEndMonth + 1, 0);
        const msPerDay = 1000 * 60 * 60 * 24;
        const totalDays = Math.floor((displayEnd - displayStart) / msPerDay) + 1;
        if (totalDays <= 0) return;
        const targetWidth = container.clientWidth - 40; // leave some margin
        let newDayWidth = targetWidth / totalDays;
        newDayWidth = Math.max(1, newDayWidth); // 1년 전체를 볼 수 있도록 최소폭을 1px로 완화
        psDayWidth = newDayWidth;
        renderPsScheduler();
        // scroll to start of timeline
        container.scrollTo({ left: 0, behavior: 'smooth' });
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
        }).then(() => {
            alert('새 프로젝트가 추가되었습니다. 목록 맨 아래를 확인해주세요.');
        }).catch(err => alert("추가 실패: " + err.message));
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
        }).catch(err => alert("추가 실패: " + err.message));
        
        // 부모 태스크가 닫혀있다면 열어주기
        if (parentTask.expanded === false) {
            window.psUpdateField(parentId, 'expanded', true);
        }
    });
    
    document.getElementById('ps-btn-delete')?.addEventListener('click', () => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        if(!psSelectedId) return alert('삭제할 항목을 선택하세요.');
        if(confirm('선택한 항목을 삭제하시겠습니까? (하위 태스크가 있다면 함께 삭제되지 않을 수 있습니다)')) {
            db.collection('workProjects').doc(psSelectedId).delete().catch(err => alert("삭제 실패: " + err.message));
            psSelectedId = null;
        }
    });

    let psCopiedTask = null;

    document.getElementById('ps-btn-copy')?.addEventListener('click', () => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        if(!psSelectedId) return alert('복사할 항목을 선택하세요.');
        const task = psData.find(p => p.id === psSelectedId);
        if(task) {
            psCopiedTask = { ...task };
            delete psCopiedTask.id; 
            alert(`'${task.name}' 복사되었습니다. 원하는 위치를 선택하고 붙여넣기 하세요.`);
        }
    });

    document.getElementById('ps-btn-paste')?.addEventListener('click', () => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        if(!psCopiedTask) return alert('먼저 복사할 항목을 선택하세요.');
        
        let parentId = null;
        if (psSelectedId) {
            const parentTask = psData.find(p => p.id === psSelectedId);
            if (parentTask) {
                parentId = parentTask.parentId ? parentTask.parentId : parentTask.id;
            }
        }
        
        const newTask = { ...psCopiedTask };
        newTask.parentId = parentId;
        newTask.name = newTask.name + ' (복사본)';
        newTask.order = Date.now();
        newTask.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        db.collection('workProjects').add(newTask).catch(err => alert("붙여넣기 실패: " + err.message));
    });

    document.getElementById('ps-btn-color')?.addEventListener('click', () => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        if(!psSelectedId) return alert('항목을 선택하세요.');
        const task = psData.find(p => p.id === psSelectedId);
        if(!task) return;
        
        // 숨겨진 color input 생성 또는 재사용
        let colorInput = document.getElementById('ps-hidden-color-input');
        if (!colorInput) {
            colorInput = document.createElement('input');
            colorInput.id = 'ps-hidden-color-input';
            colorInput.type = 'color';
            colorInput.style.display = 'none';
            document.body.appendChild(colorInput);
        }
        
        // 현재 색상을 HEX로 변환
        const currentColor = task.color || '#fffacd';
        colorInput.value = currentColor.startsWith('#') ? currentColor : '#fffacd';
        
        // color input 변경 이벤트
        colorInput.onchange = (e) => {
            const selectedColor = e.target.value;
            window.psUpdateField(psSelectedId, 'color', selectedColor);
        };
        
        // 색상 선택 창 열기
        colorInput.click();
    });

    window.psUpdateField = (id, field, value) => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        db.collection('workProjects').doc(id).update({ [field]: value }).catch(e => console.error(e));
    };

    window.psUpdateFields = (id, fieldsObj) => {
        if(!currentUser) return alert('로그인이 필요합니다.');
        db.collection('workProjects').doc(id).update(fieldsObj).catch(e => console.error(e));
    };

    function renderPsScheduler() {
        const treeBody = document.getElementById('ps-tree-body');
        const ganttHeader = document.getElementById('ps-gantt-header');
        const ganttBody = document.getElementById('ps-gantt-body');
        const bgGrid = document.getElementById('ps-gantt-bg-grid');
        const bgHlines = document.getElementById('ps-gantt-horizontal-lines');
        const ganttBlocks = document.getElementById('ps-gantt-blocks');

        if(!treeBody || !ganttHeader || !ganttBody) return;

        // --- 0. Calculate date range from tasks ---
        let minDate = null;
        let maxDate = null;
        
        if (psData.length > 0) {
            const validDates = psData
                .filter(task => task.startDate && task.endDate)
                .map(task => ({
                    start: new Date(task.startDate),
                    end: new Date(task.endDate)
                }));
            
            if (validDates.length > 0) {
                minDate = new Date(Math.min(...validDates.map(d => d.start.getTime())));
                maxDate = new Date(Math.max(...validDates.map(d => d.end.getTime())));
                
                psDisplayStartYear = minDate.getFullYear();
                psDisplayStartMonth = minDate.getMonth();
                psDisplayEndYear = maxDate.getFullYear();
                psDisplayEndMonth = maxDate.getMonth();
            }
        }
        
        const displayStartYear = psDisplayStartYear;
        const displayStartMonth = psDisplayStartMonth;
        const displayEndYear = psDisplayEndYear;
        const displayEndMonth = psDisplayEndMonth;

        // --- 1. Gantt Header & Grid ---
        const isLeapYear = (displayStartYear % 4 === 0 && displayStartYear % 100 !== 0) || (displayStartYear % 400 === 0);
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
        
        // Generate months and days based on date range
        const daysInMonthFunc = (year, month) => {
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            return [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        };
        
        let currentYear = displayStartYear;
        let currentMonth = displayStartMonth;
        
        while (currentYear < displayEndYear || (currentYear === displayEndYear && currentMonth <= displayEndMonth)) {
            const mDays = daysInMonthFunc(currentYear, currentMonth);
            
            // Month
            const mDiv = document.createElement('div');
            mDiv.className = 'ps-gh-cell';
            mDiv.style.width = `${mDays * psDayWidth}px`;
            mDiv.style.minWidth = `${mDays * psDayWidth}px`;
            mDiv.innerText = `${currentMonth + 1}월`;
            ghMonths.appendChild(mDiv);
            
            for (let d = 1; d <= mDays; d++) {
                const dayDate = new Date(currentYear, currentMonth, d);
                const dayOfWeek = dayDate.getDay();
                const isToday = (dayDate.getFullYear() === today.getFullYear() && dayDate.getMonth() === today.getMonth() && dayDate.getDate() === today.getDate());
                
                // Day number
                const dDiv = document.createElement('div');
                dDiv.className = 'ps-gh-cell';
                dDiv.style.width = `${psDayWidth}px`;
                dDiv.style.minWidth = `${psDayWidth}px`;
                dDiv.innerText = d;
                if (isToday) dDiv.classList.add('today');
                ghDays.appendChild(dDiv);
                
                // Weekday
                const wdDiv = document.createElement('div');
                wdDiv.className = 'ps-gh-cell';
                wdDiv.style.width = `${psDayWidth}px`;
                wdDiv.style.minWidth = `${psDayWidth}px`;
                wdDiv.innerText = weekdaysStr[dayOfWeek];
                if(dayOfWeek === 0) wdDiv.classList.add('weekend-sun');
                if(dayOfWeek === 6) wdDiv.classList.add('weekend-sat');
                if (isToday) wdDiv.classList.add('today');
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
                totalDays++;
                
                // Weeks calculation
                daysInCurrentWeek++;
                if (dayOfWeek === 0 || (currentMonth === displayEndMonth && currentYear === displayEndYear && d === daysInMonthFunc(currentYear, currentMonth))) {
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
            
            // Move to next month
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }

        // 헤더와 바디의 가로 폭을 전체 스케줄 너비로 명시적으로 설정하여 가로 스크롤 가능 범위를 확보합니다.
        ganttHeader.style.width = `${totalDays * psDayWidth}px`;
        ganttBody.style.width = `${totalDays * psDayWidth}px`;

        // --- 2. Tree Body & Gantt Blocks ---
        treeBody.innerHTML = '';
        bgHlines.innerHTML = '';
        ganttBlocks.innerHTML = '';

        psRowIndexMap = []; // Reset map

        // Apply select-based filters and name search before rendering
        let dataToRender = psData.slice();
        const searchSelect = document.getElementById('ps-search');
        if (searchSelect) {
            const val = searchSelect.value || 'all';
            if (val.startsWith('status:')) {
                const st = val.split(':')[1];
                dataToRender = dataToRender.filter(p => p.status === st);
            } else if (val.startsWith('assignee:')) {
                const a = val.split(':')[1];
                dataToRender = dataToRender.filter(p => (p.assignee || '').trim() === a);
            }
        }
        if (psSearchFilter && psSearchFilter.length > 0) {
            const q = psSearchFilter.toLowerCase();
            dataToRender = dataToRender.filter(p => (p.name || '').toLowerCase().includes(q));
        }

        const rootTasks = dataToRender.filter(p => !p.parentId).sort((a,b) => a.order - b.order);
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
            tr.dataset.taskId = task.id;
            tr.onclick = (e) => { 
                if (psSelectedId === task.id) return;
                psSelectedId = task.id; 
                document.querySelectorAll('.ps-tree-row').forEach(r => r.classList.remove('selected'));
                tr.classList.add('selected');
            };
            
            const disabledAttr = !currentUser ? 'disabled' : '';

            tr.innerHTML = `
                <div class="ps-col-0">${globalIndex}</div>
                <div class="ps-col-1" style="padding-left: ${10 + level * 20}px;">
                    ${hasChildren ? `<span style="cursor:pointer; width:15px; display:inline-block; font-weight:bold; color:#555;" onclick="event.stopPropagation(); window.psUpdateField('${task.id}', 'expanded', ${!isExpanded})">${isExpanded ? '▼' : '▶'}</span>` : '<span style="width:15px; display:inline-block;"></span>'}
                    <span style="margin-right:5px; color:#666; font-size:11px; display:inline-block; min-width:35px; white-space:nowrap;">${prefix}</span>
                    <input class="ps-tree-input" value="${task.name || ''}" onchange="window.psUpdateField('${task.id}', 'name', this.value)" ${disabledAttr}>
                </div>
                <div class="ps-col-2">
                    <input class="ps-tree-input" value="${task.assignee || ''}" onchange="window.psUpdateField('${task.id}', 'assignee', this.value)" ${disabledAttr}>
                </div>
                <div class="ps-col-3">
                    <select class="ps-tree-combo" onchange="window.psUpdateField('${task.id}', 'status', this.value)" ${disabledAttr} style="color: ${task.status === '완료' ? '#10b981' : task.status === '진행중' ? '#3b82f6' : '#6b7280'}; font-weight: bold;">
                        <option value="대기중" ${task.status === '대기중' ? 'selected' : ''} style="color: #6b7280;">대기중</option>
                        <option value="진행중" ${task.status === '진행중' ? 'selected' : ''} style="color: #3b82f6;">진행중</option>
                        <option value="완료" ${task.status === '완료' ? 'selected' : ''} style="color: #10b981;">완료</option>
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
            
            // Gantt Block (based on display range)
            if (task.startDate && task.endDate) {
                const sDate = new Date(task.startDate);
                const eDate = new Date(task.endDate);

                const displayStart = new Date(displayStartYear, displayStartMonth, 1);
                const displayEnd = new Date(displayEndYear, displayEndMonth + 1, 0); // last day

                let drawStart = sDate < displayStart ? displayStart : sDate;
                let drawEnd = eDate > displayEnd ? displayEnd : eDate;

                const msPerDay = 1000 * 60 * 60 * 24;
                const daysFromStart = Math.floor((drawStart - displayStart) / msPerDay);
                const durationDays = Math.floor((drawEnd - drawStart) / msPerDay) + 1;

                if (durationDays > 0 && daysFromStart + durationDays > 0) {
                    const block = document.createElement('div');
                    block.className = `ps-block ${isSelected ? 'selected' : ''}`;
                    block.dataset.taskId = task.id;
                    block.style.left = `${Math.max(0, daysFromStart) * psDayWidth}px`;
                    block.style.width = `${Math.max(0, durationDays) * psDayWidth}px`;
                    block.style.top = `${(globalIndex - 1) * 30 + 5}px`;
                    block.style.background = task.color || '#fffacd';
                    if (task.memo) {
                        block.innerHTML = `${task.name} <i class="fa-solid fa-note-sticky" style="margin-left:5px; font-size:11px; opacity:0.8;"></i>`;
                        block.title = task.memo; // Hover to see memo
                    } else {
                        block.innerText = task.name;
                    }

                    block.onclick = (e) => {
                        e.stopPropagation();
                        psSelectedId = task.id;
                        renderPsScheduler();
                    };

                    block.ondblclick = (e) => {
                        e.stopPropagation();
                        if (window.openMemoModal) {
                            window.openMemoModal(task, e.clientX, e.clientY);
                        }
                    };
                    ganttBlocks.appendChild(block);
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

        // 오른쪽 갠트 차트 배경 높이를 왼쪽 트리 아이템 총 높이와 정확히 맞춤 + 하단 20px 여백 추가
        // (Math.max를 사용하면 스크롤바 높이 차이로 인해 내부 세로 오버플로우가 발생하여 어긋날 수 있음)
        ganttBody.style.height = `${globalIndex * 30 + 20}px`;

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

        // 왼쪽 트리 스크롤바가 숨겨져 있으므로 마우스 휠 이벤트로 우측 스크롤 조작
        treeBody.addEventListener('wheel', (e) => {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                ganttContainer.scrollTop += e.deltaY;
                treeBody.scrollLeft += e.deltaX;
            }
        });
    }

    // --- 4. Drag to Draw, Move, Resize Block ---
    let isDrawing = false;
    let isMoving = false;
    let isResizingLeft = false;
    let isResizingRight = false;
    let isPanning = false;
    let panPending = false;
    let panStartX = null;
    let panStartY = null;
    let panScrollLeft = 0;
    let panScrollTop = 0;


    let actionTaskId = null;
    let actionBlock = null;
    
    let drawStartDayIndex = 0;
    let originalStartDay = 0;
    let originalEndDay = 0;
    let dragStartX = 0;
    let dragStartDayIndex = 0;

    function getDayIndexFromX(x) {
        return Math.floor(x / psDayWidth);
    }
    function getDateFromDayIndex(dayIndex) {
        const startDate = new Date(psDisplayStartYear, psDisplayStartMonth, 1);
        const d = new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function getDayIndexFromDateStr(dateStr) {
        if(!dateStr) return 0;
        const d = new Date(dateStr);
        const startDate = new Date(psDisplayStartYear, psDisplayStartMonth, 1);
        return Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
    }

    document.addEventListener('mousedown', (e) => {
        const ganttBody = document.getElementById('ps-gantt-body');
        if (!ganttBody || !ganttBody.contains(e.target)) return;
        if (!currentUser) { alert('로그인이 필요합니다.'); return; }
        
        const container = document.getElementById('ps-gantt-container');
        const rect = ganttBody.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dayIndex = getDayIndexFromX(x);
        const rowIndex = Math.floor(y / 30);
        
        const blockEl = e.target.closest('.ps-block');
        
        if (blockEl) {
            const task = psData.find(p => p.id === blockEl.dataset.taskId);
            if (!task) return;

            // 커맨드 키 없이 블럭 클릭 시에는 이동/선택 대신 팬 동작만 허용합니다.
            if (!e.ctrlKey && !e.metaKey) {
                isPanning = false;
                panPending = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                panScrollLeft = container.scrollLeft;
                panScrollTop = container.scrollTop;
                e.preventDefault();
                return;
            }

            actionTaskId = blockEl.dataset.taskId;
            psSelectedId = actionTaskId;
            
            // 드래그 시작 전 DOM을 전면 리빌드(renderPsScheduler)하면 포커스가 날아가고 스크롤 튕김 오류가 발생하므로 클래스명만 수동 제어합니다.
            document.querySelectorAll('.ps-block, .ps-tree-row').forEach(el => el.classList.remove('selected'));
            blockEl.classList.add('selected');
            
            const targetRowIndex = psRowIndexMap.indexOf(actionTaskId);
            if (targetRowIndex !== -1) {
                const treeRows = document.querySelectorAll('.ps-tree-row');
                if (treeRows[targetRowIndex]) treeRows[targetRowIndex].classList.add('selected');
            }
            
            if(task.startDate && task.endDate) {
                originalStartDay = getDayIndexFromDateStr(task.startDate);
                originalEndDay = getDayIndexFromDateStr(task.endDate);
                dragStartX = x;
                dragStartDayIndex = dayIndex;
                actionBlock = blockEl;
                
                const blockRect = blockEl.getBoundingClientRect();
                const mouseXInBlock = e.clientX - blockRect.left;
                
                // Ctrl/Meta(Cmd) 키를 누른 채 가장자리를 잡았을 때만 늘리기/줄이기(Resize)가 작동하도록 조건을 제한합니다
                if ((e.ctrlKey || e.metaKey) && mouseXInBlock <= 12) {
                    isResizingLeft = true;
                } else if ((e.ctrlKey || e.metaKey) && mouseXInBlock >= blockRect.width - 12) {
                    isResizingRight = true;
                } else {
                    isMoving = true;
                }
                
                actionBlock.classList.add('dragging');
                
                // 들리는 입체적인 입체 효과 부여 (스케일 업 및 부드러운 하이라이트 그림자)
                actionBlock.style.transform = 'translateY(-3px) scale(1.02)';
                actionBlock.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.45)';
                actionBlock.style.zIndex = '999';
                actionBlock.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';

                e.preventDefault();
                return;
            }
        }
        
        if(rowIndex >= 0 && rowIndex < psRowIndexMap.length) {
            const taskId = psRowIndexMap[rowIndex];
            psSelectedId = taskId;
            
            document.querySelectorAll('.ps-tree-row').forEach(r => r.classList.remove('selected'));
            const treeRows = document.querySelectorAll('.ps-tree-row');
            if (treeRows[rowIndex]) treeRows[rowIndex].classList.add('selected');
            
            document.querySelectorAll('.ps-gantt-row').forEach(r => r.classList.remove('selected'));
            const ganttRows = document.querySelectorAll('.ps-gantt-row');
            if (ganttRows[rowIndex]) ganttRows[rowIndex].classList.add('selected');
            
            const task = psData.find(p => p.id === taskId);
            
            if (!e.ctrlKey && !e.metaKey) {
                // Just select row and prepare for panning
                isPanning = false;
                panPending = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                panScrollLeft = container.scrollLeft;
                panScrollTop = container.scrollTop;
                e.preventDefault();
                return;
            }
            
            // Draw new block
            isDrawing = true;
            drawStartDayIndex = dayIndex;
            actionTaskId = taskId;
            
            if (task.startDate && task.endDate) {
                originalStartDay = getDayIndexFromDateStr(task.startDate);
                originalEndDay = getDayIndexFromDateStr(task.endDate);
            } else {
                originalStartDay = null;
                originalEndDay = null;
            }
            
            actionBlock = document.createElement('div');
            actionBlock.className = 'ps-block selected dragging';
            actionBlock.style.left = `${dayIndex * psDayWidth}px`;
            actionBlock.style.width = `${psDayWidth}px`;
            actionBlock.style.top = `${rowIndex * 30 + 5}px`;
            actionBlock.style.background = 'rgba(255, 107, 129, 0.7)';
            actionBlock.innerText = '설정 중...';
            document.getElementById('ps-gantt-blocks').appendChild(actionBlock);
            e.preventDefault();
        }
        
        // Empty space - only allow panning
        if (rowIndex < 0 || rowIndex >= psRowIndexMap.length) {
            isPanning = false;
            panPending = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panScrollLeft = container.scrollLeft;
            panScrollTop = container.scrollTop;
            e.preventDefault();
            return;
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const container = document.getElementById('ps-gantt-container');
            if (container) {
                container.scrollLeft = panScrollLeft - (e.clientX - panStartX);
                container.scrollTop = panScrollTop - (e.clientY - panStartY);
                container.style.cursor = 'grabbing';
            }
            return;
        }

        const ganttBody = document.getElementById('ps-gantt-body');
        if(!ganttBody) return;
        
        const blockEl = e.target.closest('.ps-block');
        if(blockEl && !isDrawing && !isMoving && !isResizingLeft && !isResizingRight) {
            const blockRect = blockEl.getBoundingClientRect();
            const mouseXInBlock = e.clientX - blockRect.left;
            
            // Ctrl/Meta(Cmd) 키를 누른 채 가장자리에 올렸을 때만 늘리기/줄이기(ew-resize) 커서를 표시합니다
            if ((e.ctrlKey || e.metaKey) && (mouseXInBlock <= 12 || mouseXInBlock >= blockRect.width - 12)) {
                blockEl.style.cursor = 'ew-resize';
            } else {
                blockEl.style.cursor = 'grab';
            }
        }
        
        if (!isDrawing && !isMoving && !isResizingLeft && !isResizingRight) {
            // Check for panning initiation
            if (e.buttons === 1 && !e.ctrlKey && !e.metaKey && panStartX !== null) {
                const deltaX = e.clientX - panStartX;
                const deltaY = e.clientY - panStartY;
                if (panPending && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
                    isPanning = true;
                    panPending = false;
                    isClickExtendCandidate = false; // Cancel extend if panning
                }
                if (isPanning) {
                    const container = document.getElementById('ps-gantt-container');
                    if (container) {
                        container.scrollLeft = panScrollLeft - deltaX;
                        container.scrollTop = panScrollTop - deltaY;
                        container.style.cursor = 'grabbing';
                    }
                }
            }
            return;
        }
        
        const container = document.getElementById('ps-gantt-container');
        const rect = ganttBody.getBoundingClientRect();
        let x = e.clientX - rect.left;
        if(x < 0) x = 0;
        const dayIndex = getDayIndexFromX(x);
        
        if (isDrawing && actionBlock) {
            let minDay = Math.min(drawStartDayIndex, dayIndex);
            let maxDay = Math.max(drawStartDayIndex, dayIndex);
            
            if (originalStartDay !== null && originalEndDay !== null) {
                minDay = Math.min(minDay, originalStartDay);
                maxDay = Math.max(maxDay, originalEndDay);
            }
            
            actionBlock.style.left = `${minDay * psDayWidth}px`;
            actionBlock.style.width = `${(maxDay - minDay + 1) * psDayWidth}px`;
        }
        else if (isResizingLeft && actionBlock) {
            const minDay = Math.min(dayIndex, originalEndDay);
            const maxDay = originalEndDay;
            actionBlock.style.left = `${minDay * psDayWidth}px`;
            actionBlock.style.width = `${(maxDay - minDay + 1) * psDayWidth}px`;
        }
        else if (isResizingRight && actionBlock) {
            const minDay = originalStartDay;
            const maxDay = Math.max(dayIndex, originalStartDay);
            actionBlock.style.left = `${minDay * psDayWidth}px`;
            actionBlock.style.width = `${(maxDay - minDay + 1) * psDayWidth}px`;
        }
        else if (isMoving && actionBlock) {
            const deltaDays = dayIndex - dragStartDayIndex;
            const newStartDay = originalStartDay + deltaDays;
            actionBlock.style.left = `${newStartDay * psDayWidth}px`;
            actionBlock.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mouseup', (e) => {
        if (isPanning) {
            isPanning = false;
            panPending = false;
            const container = document.getElementById('ps-gantt-container');
            if (container) {
                container.style.cursor = '';
                const dx = e.clientX - panStartX;
                const dy = e.clientY - panStartY;
                container.scrollLeft = panScrollLeft - dx;
                container.scrollTop = panScrollTop - dy;
            }
            panStartX = null;
            panStartY = null;
            e.preventDefault();
            return;
        }
        
        if (!isDrawing && !isMoving && !isResizingLeft && !isResizingRight) {
            panPending = false;
            panStartX = null;
            panStartY = null;
            return;
        }
        
        const ganttBody = document.getElementById('ps-gantt-body');
        const container = document.getElementById('ps-gantt-container');
        if(!ganttBody || !container || !actionTaskId) return;
        
        const rect = ganttBody.getBoundingClientRect();
        let x = e.clientX - rect.left;
        if (x < 0) x = 0;
        const dayIndex = getDayIndexFromX(x);
        
        let finalStartDay = originalStartDay;
        let finalEndDay = originalEndDay;

        if (isDrawing) {
            let minDay = Math.min(drawStartDayIndex, dayIndex);
            let maxDay = Math.max(drawStartDayIndex, dayIndex);
            
            if (originalStartDay !== null && originalEndDay !== null) {
                minDay = Math.min(minDay, originalStartDay);
                maxDay = Math.max(maxDay, originalEndDay);
            }
            finalStartDay = minDay;
            finalEndDay = maxDay;
        } else if (isResizingLeft) {
            finalStartDay = Math.min(dayIndex, originalEndDay);
            finalEndDay = originalEndDay;
        } else if (isResizingRight) {
            finalStartDay = originalStartDay;
            finalEndDay = Math.max(dayIndex, originalStartDay);
        } else if (isMoving) {
            const deltaDays = dayIndex - dragStartDayIndex;
            finalStartDay = originalStartDay + deltaDays;
            finalEndDay = originalEndDay + deltaDays;
        }
        
        window.psUpdateFields(actionTaskId, {
            startDate: getDateFromDayIndex(finalStartDay),
            endDate: getDateFromDayIndex(finalEndDay)
        });
        
        if (isDrawing && actionBlock) {
            actionBlock.remove();
        } else if (actionBlock) {
            actionBlock.style.cursor = '';
            actionBlock.style.transform = '';
            actionBlock.style.boxShadow = '';
            actionBlock.style.zIndex = '';
            actionBlock.style.transition = '';
            actionBlock.classList.remove('dragging');
        }
        
        isDrawing = false;
        isMoving = false;
        isResizingLeft = false;
        isResizingRight = false;
        actionBlock = null;
        actionTaskId = null;
    });

    // Gantt Container Wheel Zoom (Ctrl + Mouse Wheel)
    const ganttContainerEl = document.getElementById('ps-gantt-container');
    if (ganttContainerEl) {
        ganttContainerEl.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    psDayWidth = Math.min(psDayWidth + 5, 100);
                } else {
                    psDayWidth = Math.max(psDayWidth - 5, 10);
                }
                renderPsScheduler();
            }
        }, { passive: false });
    }

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

    // ====================================================
    // Work Hero 배경 사진 (Slider & Manager)
    // ====================================================
    const workHeroSliderTrack = document.getElementById('work-hero-slider-track');
    const workHeroSliderDots = document.getElementById('work-hero-slider-dots');
    const workHeroPrevBtn = document.getElementById('work-hero-prev-btn');
    const workHeroNextBtn = document.getElementById('work-hero-next-btn');
    const workHeroEditTrigger = document.getElementById('work-hero-img-edit-trigger');

    const workHeroManagerModal = document.getElementById('work-hero-manager-modal');
    const workHeroManagerClose = document.getElementById('work-hero-manager-close');
    const workHeroImagesGrid = document.getElementById('work-hero-images-grid');
    const workHeroUploadDropzone = document.getElementById('work-hero-upload-dropzone');
    const workHeroSliderFileInput = document.getElementById('work-hero-slider-file-input');

    let workHeroImages = [];
    let workHeroSliderIndex = 0;
    let workHeroSliderInterval = null;

    db.collection('workSiteSettings').doc('heroImages').onSnapshot(doc => {
        if (doc.exists) {
            workHeroImages = doc.data().images || [];
        }
        if (!workHeroImages || workHeroImages.length === 0) {
            workHeroImages = ['./assets/dodo_hero.png'];
        }
        localStorage.setItem('dodo-work-hero-images-cache', JSON.stringify(workHeroImages));
        renderWorkHeroSlider();
        if (workHeroManagerModal && !workHeroManagerModal.classList.contains('hidden')) {
            renderWorkHeroManager();
        }
    });

    function renderWorkHeroSlider() {
        if (!workHeroSliderTrack) return;
        workHeroSliderTrack.innerHTML = '';
        if (workHeroSliderDots) workHeroSliderDots.innerHTML = '';

        workHeroImages.forEach((imgUrl, idx) => {
            const slide = document.createElement('div');
            slide.className = 'hero-slide';
            slide.style.width = '100%';
            slide.style.height = '100%';
            slide.style.flexShrink = '0';
            slide.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:16px; display:block;">`;
            workHeroSliderTrack.appendChild(slide);

            if (workHeroSliderDots) {
                const dot = document.createElement('div');
                dot.className = `hero-slider-dot ${idx === workHeroSliderIndex ? 'active' : ''}`;
                dot.addEventListener('click', () => goWorkHeroSlide(idx));
                workHeroSliderDots.appendChild(dot);
            }
        });
        
        if (workHeroSliderIndex >= workHeroImages.length) {
            workHeroSliderIndex = 0;
        }
        updateWorkHeroSliderPosition();
        startWorkHeroAutoSlide();
    }

    function updateWorkHeroSliderPosition() {
        if (!workHeroSliderTrack) return;
        workHeroSliderTrack.style.transform = `translateX(-${workHeroSliderIndex * 100}%)`;
        
        if (workHeroSliderDots) {
            const dots = workHeroSliderDots.querySelectorAll('.hero-slider-dot');
            dots.forEach((dot, idx) => {
                if (idx === workHeroSliderIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }
    }

    function goWorkHeroSlide(index) {
        workHeroSliderIndex = index;
        if (workHeroSliderIndex >= workHeroImages.length) workHeroSliderIndex = 0;
        if (workHeroSliderIndex < 0) workHeroSliderIndex = workHeroImages.length - 1;
        updateWorkHeroSliderPosition();
        startWorkHeroAutoSlide();
    }

    if (workHeroPrevBtn) workHeroPrevBtn.addEventListener('click', () => goWorkHeroSlide(workHeroSliderIndex - 1));
    if (workHeroNextBtn) workHeroNextBtn.addEventListener('click', () => goWorkHeroSlide(workHeroSliderIndex + 1));

    function startWorkHeroAutoSlide() {
        if (workHeroSliderInterval) clearInterval(workHeroSliderInterval);
        workHeroSliderInterval = setInterval(() => {
            goWorkHeroSlide(workHeroSliderIndex + 1);
        }, 5000);
    }

    if (workHeroEditTrigger) {
        workHeroEditTrigger.addEventListener('click', () => {
            renderWorkHeroManager();
            if (workHeroManagerModal) workHeroManagerModal.classList.remove('hidden');
        });
    }

    if (workHeroManagerClose) {
        workHeroManagerClose.addEventListener('click', () => {
            if (workHeroManagerModal) workHeroManagerModal.classList.add('hidden');
        });
    }

    function renderWorkHeroManager() {
        if (!workHeroImagesGrid) return;
        workHeroImagesGrid.innerHTML = '';
        
        workHeroImages.forEach((imgUrl, idx) => {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.aspectRatio = '16/9';
            wrapper.style.borderRadius = '8px';
            wrapper.style.overflow = 'hidden';
            wrapper.style.border = '1px solid var(--input-border)';
            
            const img = document.createElement('img');
            img.src = imgUrl;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            delBtn.style.position = 'absolute';
            delBtn.style.top = '5px';
            delBtn.style.right = '5px';
            delBtn.style.background = 'rgba(255, 71, 87, 0.9)';
            delBtn.style.color = 'white';
            delBtn.style.border = 'none';
            delBtn.style.borderRadius = '50%';
            delBtn.style.width = '24px';
            delBtn.style.height = '24px';
            delBtn.style.cursor = 'pointer';
            delBtn.style.display = 'flex';
            delBtn.style.alignItems = 'center';
            delBtn.style.justifyContent = 'center';
            delBtn.style.fontSize = '0.7rem';
            
            delBtn.addEventListener('click', () => {
                if(confirm("이 배경 사진을 삭제하시겠습니까?")) {
                    const newImages = [...workHeroImages];
                    newImages.splice(idx, 1);
                    db.collection('workSiteSettings').doc('heroImages').set({
                        images: newImages,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
            
            wrapper.appendChild(img);
            if (workHeroImages.length > 1) {
                wrapper.appendChild(delBtn);
            }
            workHeroImagesGrid.appendChild(wrapper);
        });
    }

    if (workHeroUploadDropzone) {
        workHeroUploadDropzone.addEventListener('click', () => {
            if (workHeroSliderFileInput) workHeroSliderFileInput.click();
        });
    }

    if (workHeroSliderFileInput) {
        workHeroSliderFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const originalHtml = workHeroUploadDropzone.innerHTML;
            workHeroUploadDropzone.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i><p style="margin-top:10px; font-weight:bold;">업로드 중...</p>';
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 1200;
                    
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    
                    const newImages = [...workHeroImages, compressedBase64];
                    db.collection('workSiteSettings').doc('heroImages').set({
                        images: newImages,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        workHeroUploadDropzone.innerHTML = originalHtml;
                        e.target.value = '';
                    }).catch(err => {
                        console.error(err);
                        alert("업로드 실패");
                        workHeroUploadDropzone.innerHTML = originalHtml;
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ====================================================
    // 프로젝트 데이터 내보내기 / 불러오기
    // ====================================================
    const psExportBtn = document.getElementById('ps-btn-export-file');
    const psImportBtn = document.getElementById('ps-btn-import-file');
    const psFileInput = document.getElementById('ps-file-input');

    if (psExportBtn) {
        psExportBtn.addEventListener('click', async () => {
            if (!currentUser) { alert('로그인이 필요합니다.'); return; }
            if (psData.length === 0) { alert('내보낼 데이터가 없습니다.'); return; }
            
            const nestedData = {
                year: psYear,
                layout: {
                    splitter_sizes: [650, 749],
                    left_column_widths: [136, 200, 80, 80, 100, 100]
                },
                left_panel: [],
                right_panel: {}
            };

            const rootItems = psData.filter(p => !p.parentId).sort((a, b) => a.order - b.order);
            
            function buildChildren(parentId, prefix) {
                const children = psData.filter(p => p.parentId === parentId).sort((a, b) => a.order - b.order);
                return children.map((child, index) => {
                    const currentPrefix = `${prefix}-${index + 1}`;
                    return {
                        col0: currentPrefix,
                        col1: child.name || "",
                        assignee: child.assignee || "",
                        status: child.status || "대기중",
                        start: child.startDate || "",
                        end: child.endDate || "",
                        expanded: child.expanded ?? true,
                        uid: child.id,
                        children: buildChildren(child.id, currentPrefix)
                    };
                });
            }

            nestedData.left_panel = rootItems.map((root, index) => {
                const prefix = String(index + 1);
                return {
                    col0: prefix,
                    col1: root.name || "",
                    assignee: root.assignee || "",
                    status: root.status || "대기중",
                    start: root.startDate || "",
                    end: root.endDate || "",
                    expanded: root.expanded ?? true,
                    uid: root.id,
                    children: buildChildren(root.id, prefix)
                };
            });

            const dataStr = JSON.stringify(nestedData, null, 2);
            const defaultFilename = `schedule_${psYear}.json`;

            try {
                if (window.showSaveFilePicker) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: defaultFilename,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(dataStr);
                    await writable.close();
                    return;
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('File System Access API failed:', err);
                }
                return; // User cancelled the save dialog
            }

            // Fallback for browsers that don't support showSaveFilePicker
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = defaultFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (psImportBtn && psFileInput) {
        psImportBtn.addEventListener('click', () => {
            if (!currentUser) { alert('로그인이 필요합니다.'); return; }
            psFileInput.click();
        });

        psFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const parsedData = JSON.parse(event.target.result);
                    
                    // 호환성 체크: 윈도우 프로그램 형식인지, 아니면 이전 배열 형식인지
                    let isNestedFormat = false;
                    let importItems = [];
                    
                    if (parsedData.left_panel && Array.isArray(parsedData.left_panel)) {
                        isNestedFormat = true;
                    } else if (!Array.isArray(parsedData)) {
                        alert('지원하지 않는 파일 형식입니다.');
                        return;
                    }

                    if (confirm('파일 데이터를 불러오면 기존 프로젝트 데이터가 모두 덮어씌워집니다. 계속하시겠습니까?')) {
                        const batch = db.batch();
                        
                        // 기존 데이터 삭제
                        const snapshot = await db.collection('workProjects').get();
                        snapshot.docs.forEach(doc => batch.delete(doc.ref));
                        
                        if (isNestedFormat) {
                            // 중첩된 윈도우 데이터 평면화
                            let orderCounter = 0;
                            function flatten(items, parentId) {
                                items.forEach(item => {
                                    orderCounter += 1000;
                                    const docId = item.uid || db.collection('workProjects').doc().id;
                                    const flatItem = {
                                        parentId: parentId,
                                        name: item.col1 || "",
                                        assignee: item.assignee || "",
                                        status: item.status || "대기중",
                                        startDate: item.start || "",
                                        endDate: item.end || "",
                                        expanded: item.expanded ?? true,
                                        color: parentId ? '#e0f7fa' : '#fffacd',
                                        order: orderCounter,
                                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                                    };
                                    const ref = db.collection('workProjects').doc(docId);
                                    batch.set(ref, flatItem);
                                    
                                    if (item.children && item.children.length > 0) {
                                        flatten(item.children, docId);
                                    }
                                });
                            }
                            flatten(parsedData.left_panel, null);
                            
                            if (parsedData.year) {
                                psYear = parsedData.year;
                                const yearInput = document.getElementById('ps-year');
                                if (yearInput) yearInput.value = psYear;
                            }
                        } else {
                            // 구버전 평면 배열 형식 호환
                            parsedData.forEach(item => {
                                const docId = item.id;
                                const itemData = { ...item };
                                delete itemData.id;
                                const ref = docId ? db.collection('workProjects').doc(docId) : db.collection('workProjects').doc();
                                batch.set(ref, itemData);
                            });
                        }
                        
                        await batch.commit();
                        alert('프로젝트 데이터를 성공적으로 불러왔습니다!');
                        psFileInput.value = '';
                        renderPsScheduler(); // 반영 후 새로고침
                    } else {
                        psFileInput.value = '';
                    }
                } catch (err) {
                    console.error('불러오기 실패:', err);
                    alert('JSON 파일을 파싱하고 저장하는 중 오류가 발생했습니다.');
                }
            };
            reader.readAsText(file);
        });
    }
    // ====================================================
    // 프로젝트 엑셀 출력 (CSV 변환)
    // ====================================================
    const psExcelAllBtn = document.getElementById('ps-btn-excel-all');
    const psExcelSelectedBtn = document.getElementById('ps-btn-excel-selected');

    function exportToCsv(data, filename) {
        if (!data || data.length === 0) {
            alert('출력할 데이터가 없습니다.');
            return;
        }
        
        const headers = ['ID', 'Parent ID', 'Project/Task Name', 'Assignee', 'Status', 'Start Date', 'End Date', 'Order', 'Color'];
        let csvContent = '\uFEFF' + headers.join(',') + '\n';
        
        data.forEach(item => {
            const row = [
                item.id || '',
                item.parentId || '',
                `"${(item.name || '').replace(/"/g, '""')}"`,
                `"${(item.assignee || '').replace(/"/g, '""')}"`,
                item.status || '',
                item.startDate || '',
                item.endDate || '',
                item.order || '',
                item.color || ''
            ];
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    if (psExcelAllBtn) {
        psExcelAllBtn.addEventListener('click', () => {
            if (!currentUser) { alert('로그인이 필요합니다.'); return; }
            exportToCsv(psData, `project_all_${new Date().toISOString().slice(0, 10)}.csv`);
        });
    }

    if (psExcelSelectedBtn) {
        psExcelSelectedBtn.addEventListener('click', () => {
            if (!currentUser) { alert('로그인이 필요합니다.'); return; }
            if (!psSelectedId) {
                alert('엑셀로 출력할 프로젝트/태스크를 먼저 선택하세요.');
                return;
            }
            
            const selectedItems = [];
            
            function findChildren(parentId) {
                const item = psData.find(p => p.id === parentId);
                if (item && !selectedItems.find(p => p.id === item.id)) {
                    selectedItems.push(item);
                }
                const children = psData.filter(p => p.parentId === parentId);
                children.forEach(child => findChildren(child.id));
            }
            
            findChildren(psSelectedId);
            exportToCsv(selectedItems, `project_selected_${new Date().toISOString().slice(0, 10)}.csv`);
        });
    }

    // --- 5. Column Resizer ---
    function initColumnResizers() {
        const headers = document.querySelectorAll('.ps-tree-header > div');
        headers.forEach((header, index) => {
            if (index === headers.length - 1) return; // 마지막 컬럼은 리사이즈 제외
            
            const resizer = document.createElement('div');
            resizer.style.width = '8px';
            resizer.style.cursor = 'col-resize';
            resizer.style.position = 'absolute';
            resizer.style.right = '-4px';
            resizer.style.top = '0';
            resizer.style.bottom = '0';
            resizer.style.zIndex = '10';
            
            header.style.position = 'relative';
            header.appendChild(resizer);
            
            let startX, startWidth;
            resizer.addEventListener('mousedown', function(e) {
                startX = e.clientX;
                startWidth = header.offsetWidth;
                
                const mouseMoveHandler = function(e) {
                    const newWidth = Math.max(30, startWidth + (e.clientX - startX));
                    updateColumnWidth(index, newWidth);
                };
                
                const mouseUpHandler = function() {
                    document.removeEventListener('mousemove', mouseMoveHandler);
                    document.removeEventListener('mouseup', mouseUpHandler);
                    if (window.psColWidths) {
                        localStorage.setItem('psColWidths', JSON.stringify(window.psColWidths));
                    }
                };
                
                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);
                e.stopPropagation();
                e.preventDefault();
            });
        });

        const saved = localStorage.getItem('psColWidths');
        if (saved) {
            try {
                window.psColWidths = JSON.parse(saved);
                updateColumnWidth(-1, 0); // 초기 렌더링
            } catch(e){}
        }
    }

    function updateColumnWidth(index, width) {
        let styleEl = document.getElementById('ps-dynamic-col-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'ps-dynamic-col-style';
            document.head.appendChild(styleEl);
        }
        if (!window.psColWidths) window.psColWidths = {};
        if (index >= 0) window.psColWidths[index] = width;
        
        let cssStr = '';
        for (let i in window.psColWidths) {
            cssStr += `.ps-col-${i} { width: ${window.psColWidths[i]}px !important; flex: none !important; }\n`;
        }
        styleEl.innerHTML = cssStr;
    }
    
    // UI 렌더링이 안정화될 수 있도록 약간의 지연 후 리사이저 초기화
    setTimeout(initColumnResizers, 500);

    // --- 6. Memo Modal Logic ---
    let currentMemoTask = null;
    const memoModal = document.getElementById('ps-memo-modal');
    const memoContent = document.getElementById('ps-memo-content');
    
    window.openMemoModal = function(task, clientX, clientY) {
        if (!memoModal || !memoContent) return;
        currentMemoTask = task;
        memoContent.value = task.memo || '';
        memoModal.classList.remove('hidden');
        
        if (clientX !== undefined && clientY !== undefined) {
            let left = clientX + 15;
            let top = clientY + 15;
            if (left + 320 > window.innerWidth) left = window.innerWidth - 330;
            if (top + 200 > window.innerHeight) top = window.innerHeight - 210;
            memoModal.style.left = left + 'px';
            memoModal.style.top = top + 'px';
        } else {
            memoModal.style.left = (window.innerWidth / 2 - 160) + 'px';
            memoModal.style.top = (window.innerHeight / 2 - 100) + 'px';
        }

        setTimeout(() => memoContent.focus(), 100);
    };

    document.getElementById('ps-btn-memo')?.addEventListener('click', (e) => {
        if (!psSelectedId) {
            alert('먼저 메모를 작성할 프로젝트/태스크 바를 선택하세요.');
            return;
        }
        const task = psData.find(p => p.id === psSelectedId);
        if (task && window.openMemoModal) {
            window.openMemoModal(task, e.clientX, e.clientY);
        }
    });

    document.getElementById('ps-memo-close')?.addEventListener('click', () => {
        memoModal?.classList.add('hidden');
    });

    document.getElementById('ps-btn-save-memo')?.addEventListener('click', () => {
        if (!currentMemoTask || !memoContent || !memoModal) return;
        const newMemo = memoContent.value.trim();
        window.psUpdateField(currentMemoTask.id, 'memo', newMemo);
        memoModal.classList.add('hidden');
    });

    initParticles();
    animateParticles();
});
