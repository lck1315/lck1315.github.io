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
    // 모바일 퀵 내비게이션 (Tabs Dropdown)
    // ----------------------------------------------------
    const mobileNavBtn = document.getElementById('work-mobile-nav-btn');
    const mobileNavDropdown = document.getElementById('work-tabs');

    if (mobileNavBtn && mobileNavDropdown) {
        mobileNavBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileNavDropdown.classList.toggle('show-mobile');
        });

        // 화면 바깥을 클릭하면 모바일 메뉴 닫기
        document.addEventListener('click', (e) => {
            if (!mobileNavBtn.contains(e.target) && !mobileNavDropdown.contains(e.target)) {
                mobileNavDropdown.classList.remove('show-mobile');
            }
        });
        
        // 탭 메뉴 항목을 클릭하면 모바일 메뉴 닫기
        mobileNavDropdown.addEventListener('click', (e) => {
            if (e.target.closest('.work-tab')) {
                mobileNavDropdown.classList.remove('show-mobile');
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
    const btnWorkLogout = document.getElementById('btn-work-logout');
    const userProfileIcon = document.getElementById('user-profile-icon');
    const userProfileImg = document.getElementById('user-profile-img');
    const btnMasterAdmin = document.getElementById('btn-master-admin');
    
    // 모달들 (로그인 안 된 경우 보여주던 기존 모달들)
    const loginRequiredModal = document.getElementById('login-required-modal');

    btnWorkLogin.addEventListener('click', () => {
        window.location.href = 'index.html?login=true';
    });

    if (btnWorkLogout) {
        btnWorkLogout.addEventListener('click', () => {
            auth.signOut();
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
        if (!currentUser || !currentUserDoc || !currentUserDoc.isApproved) {
            showAuthRequiredMessage('work-content-container');
            showAuthRequiredMessage('schedule-content-container');
            showAuthRequiredMessage('performance-content-container');
            showAuthRequiredMessage('members-content-container');
            
            // 프로젝트 탭은 .ps-desktop-app 내부를 가림
            const psApp = document.querySelector('.ps-desktop-app');
            if (psApp) {
                psApp.innerHTML = `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color: #333;">
                    <i class="fa-solid fa-lock" style="font-size: 3rem; margin-bottom: 20px; color: #ff4757;"></i>
                    <h3 style="font-size: 1.5rem; margin-bottom: 10px;">접근 권한이 없습니다</h3>
                    <p>내용을 보려면 로그인 및 마스터의 승인이 필요합니다.</p>
                </div>`;
            }
            return;
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
                    if (userProfileIcon) {
                        userProfileIcon.style.display = 'block';
                        let pUrl = currentUserDoc.photoURL;
                        const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2IwYmVjNSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
                        userProfileImg.src = (pUrl && pUrl !== 'null' && pUrl.trim() !== '') ? pUrl : DEFAULT_AVATAR;
                    }
                    if (btnWorkLogout) btnWorkLogout.style.display = 'inline-block';
                    
                    if (currentUserDoc.isMaster) {
                        btnMasterAdmin.style.display = 'inline-block';
                    } else {
                        btnMasterAdmin.style.display = 'none';
                    }

                    // 리로드하여 HTML 복구 (만약 보안 메시지로 덮어씌워졌었다면)
                    if (document.querySelector('.ps-desktop-app').innerHTML.includes('fa-lock')) {
                        location.reload();
                    } else {
                        renderRestrictedContent();
                    }
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
                    if (btnWorkLogout) btnWorkLogout.style.display = 'inline-block';
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
            if (btnWorkLogout) btnWorkLogout.style.display = 'none';

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
                if (currentTab === 'main' || currentTab === 'members') {
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
            
            const daySchedules = schedulesData.filter(sch => sch.date === dateString);
            daySchedules.forEach(sch => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'schedule-item';
                itemDiv.style.cssText = `font-size: 0.75rem; padding: 4px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: ${sch.completed ? 'rgba(255,255,255,0.05)' : 'rgba(0, 206, 201, 0.2)'}; color: ${sch.completed ? 'var(--text-muted)' : '#00cec9'}; text-decoration: ${sch.completed ? 'line-through' : 'none'}; cursor: pointer;`;
                itemDiv.innerText = sch.title;
                itemDiv.title = sch.title;
                
                itemDiv.onclick = (e) => {
                    e.stopPropagation();
                    if (!currentUser) return;
                    if (confirm(`'${sch.title}' 일정을 삭제하시겠습니까?`)) {
                        window.deleteItem('workSchedules', sch.id);
                    } else if (confirm(`'${sch.title}' 일정의 완료 상태를 변경하시겠습니까?`)) {
                        window.toggleSchedule(sch.id, sch.completed);
                    }
                };
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

    initParticles();
    animateParticles();
});
