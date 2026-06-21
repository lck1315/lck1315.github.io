(function() {
    window.EvalSheetManager = {
        sheetsMeta: [],
        currentSheetId: null,
        unsubscribeMeta: null,
        inited: false,
        workUsersCache: {},

        init: function() {
            if (this.inited) return;
            this.inited = true;
            console.log('EvalSheetManager initialized');
            
            // 모달 닫기
            document.getElementById('btn-eval-sheet-cancel')?.addEventListener('click', () => this.closeModal());
            document.getElementById('eval-sheet-modal')?.addEventListener('click', (e) => {
                if (e.target.id === 'eval-sheet-modal') this.closeModal();
            });

            // 마스터 전용 추가 버튼
            const btnAdd = document.getElementById('btn-add-eval-sheet');
            if (btnAdd) {
                btnAdd.addEventListener('click', () => this.openModal());
            }

            // 모달 저장 버튼
            document.getElementById('btn-eval-sheet-save')?.addEventListener('click', () => this.saveSheetMeta());
        },

        loadList: async function() {
            const isMaster = !!(window.currentUserDocGlobal && window.currentUserDocGlobal.isMaster);
            const currentUser = window.auth && window.auth.currentUser;
            if (!currentUser) return;

            const btnAdd = document.getElementById('btn-add-eval-sheet');
            if (btnAdd) btnAdd.style.display = isMaster ? 'inline-block' : 'none';

            // Cache users for displaying names
            if (Object.keys(this.workUsersCache).length === 0) {
                try {
                    const snap = await window.db.collection('workUsers').get();
                    snap.forEach(doc => {
                        this.workUsersCache[doc.id] = doc.data().nickname || doc.data().email || '팀원';
                    });
                } catch(e) { console.error(e); }
            }

            if (this.unsubscribeMeta) this.unsubscribeMeta();

            const query = window.db.collection('workEvalSheetsMeta');
            // 마스터는 모두 보고, 일반 유저는 allowedUsers 배열에 본인 uid가 포함된 것만 본다.
            let activeQuery = query;
            if (!isMaster) {
                activeQuery = query.where('allowedUsers', 'array-contains', currentUser.uid);
            }

            this.unsubscribeMeta = activeQuery.onSnapshot(snapshot => {
                this.sheetsMeta = [];
                snapshot.forEach(doc => {
                    this.sheetsMeta.push({ id: doc.id, ...doc.data() });
                });
                // 최신순 정렬
                this.sheetsMeta.sort((a, b) => b.createdAt - a.createdAt);
                this.renderList();
            }, err => {
                console.error("Eval sheets meta load error:", err);
            });
        },

        renderList: function() {
            const listEl = document.getElementById('eval-sheet-list');
            if (!listEl) return;

            listEl.innerHTML = '';
            const isMaster = !!(window.currentUserDocGlobal && window.currentUserDocGlobal.isMaster);

            if (this.sheetsMeta.length === 0) {
                listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.9rem;">시트가 없습니다.</div>';
                return;
            }

            this.sheetsMeta.forEach(meta => {
                const item = document.createElement('div');
                item.className = 'eval-sheet-item';
                item.style.cssText = `
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 10px 12px; border-radius: 8px; cursor: pointer; 
                    background: ${this.currentSheetId === meta.id ? 'var(--primary-color)' : 'var(--input-bg)'};
                    color: ${this.currentSheetId === meta.id ? '#fff' : 'var(--text-color)'};
                    border: 1px solid ${this.currentSheetId === meta.id ? 'var(--primary-color)' : 'var(--card-border)'};
                    transition: all 0.2s;
                `;
                let allowedNamesStr = '';
                if (meta.allowedUsers && meta.allowedUsers.length > 0) {
                    const names = meta.allowedUsers.map(uid => this.workUsersCache[uid] || '알수없음');
                    allowedNamesStr = `<div style="font-size: 0.75rem; color: ${this.currentSheetId === meta.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'}; margin-top: 4px; padding-left: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">👤 ${names.join(', ')}</div>`;
                } else {
                    allowedNamesStr = `<div style="font-size: 0.75rem; color: ${this.currentSheetId === meta.id ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)'}; margin-top: 4px; padding-left: 24px;">권한 지정 안됨</div>`;
                }

                item.innerHTML = `
                    <div style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
                            <i class="fa-solid fa-file-excel"></i>
                            <span style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${meta.name}</span>
                        </div>
                        ${allowedNamesStr}
                    </div>
                `;
                
                if (isMaster) {
                    const btnEdit = document.createElement('button');
                    btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
                    btnEdit.style.cssText = `background: none; border: none; color: ${this.currentSheetId === meta.id ? '#fff' : 'var(--text-muted)'}; cursor: pointer; padding: 5px;`;
                    btnEdit.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openModal(meta);
                    });
                    item.appendChild(btnEdit);
                }

                item.addEventListener('click', () => {
                    this.loadSheetData(meta.id, meta.name);
                });

                listEl.appendChild(item);
            });
        },

        openModal: async function(meta = null) {
            const isMaster = !!(window.currentUserDocGlobal && window.currentUserDocGlobal.isMaster);
            if (!isMaster) return;

            document.getElementById('eval-sheet-modal').classList.remove('hidden');
            document.getElementById('eval-sheet-modal').style.display = 'flex';
            
            document.getElementById('eval-sheet-modal-title').innerText = meta ? '평가시트 수정' : '새 평가시트 만들기';
            document.getElementById('eval-sheet-name-input').value = meta ? meta.name : '';
            document.getElementById('eval-sheet-id-input').value = meta ? meta.id : '';

            // 가입된 팀원 목록 로드
            const usersListEl = document.getElementById('eval-sheet-users-list');
            usersListEl.innerHTML = '<div style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i></div>';

            try {
                const snap = await window.db.collection('workUsers').get();
                usersListEl.innerHTML = '';
                
                const allowedUsers = meta && meta.allowedUsers ? meta.allowedUsers : [];

                snap.forEach(doc => {
                    const data = doc.data();
                    if (data.isMaster) return; // 마스터는 자동 조회 가능하므로 목록에서 제외

                    const label = document.createElement('label');
                    label.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-color);';
                    
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.value = doc.id;
                    cb.checked = allowedUsers.includes(doc.id);
                    cb.style.cursor = 'pointer';

                    label.appendChild(cb);
                    label.appendChild(document.createTextNode(data.nickname || data.email));
                    usersListEl.appendChild(label);
                });
            } catch (e) {
                console.error(e);
                usersListEl.innerHTML = '팀원 목록을 불러올 수 없습니다.';
            }
        },

        closeModal: function() {
            document.getElementById('eval-sheet-modal').classList.add('hidden');
            document.getElementById('eval-sheet-modal').style.display = 'none';
        },

        saveSheetMeta: async function() {
            const name = document.getElementById('eval-sheet-name-input').value.trim();
            const id = document.getElementById('eval-sheet-id-input').value;
            if (!name) { alert('시트 이름을 입력하세요.'); return; }

            const cbList = document.querySelectorAll('#eval-sheet-users-list input[type="checkbox"]:checked');
            const allowedUsers = Array.from(cbList).map(cb => cb.value);

            const data = {
                name: name,
                allowedUsers: allowedUsers,
                updatedAt: Date.now()
            };

            const btn = document.getElementById('btn-eval-sheet-save');
            btn.disabled = true;
            btn.innerHTML = '저장 중...';

            try {
                if (id) {
                    await window.db.collection('workEvalSheetsMeta').doc(id).update(data);
                } else {
                    data.createdAt = Date.now();
                    const newRef = await window.db.collection('workEvalSheetsMeta').add(data);
                    // Create empty sheet
                    await window.db.collection('workEvalSheetsData').doc(newRef.id).set({
                        sheets: [{ name: "Sheet1", color: "", status: 1, order: 0, data: [], config: {}, index: 0 }],
                        savedAt: Date.now()
                    });
                }
                this.closeModal();
            } catch (e) {
                console.error(e);
                alert('저장 중 오류 발생');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '저장하기';
            }
        },

        loadSheetData: function(sheetId, sheetName) {
            this.currentSheetId = sheetId;
            this.renderList(); // 활성 상태 업데이트

            const isMaster = !!(window.currentUserDocGlobal && window.currentUserDocGlobal.isMaster);
            
            document.getElementById('eval-current-sheet-title').innerText = sheetName;
            const em = document.getElementById('eval-empty-msg');
            if (em) em.style.display = 'none';
            if (isMaster) {
                document.getElementById('eval-master-controls').style.display = 'flex';
            }

            window.db.collection('workEvalSheetsData').doc(sheetId).get().then(doc => {
                if (doc.exists && doc.data() && doc.data().sheets) {
                    const d = doc.data();
                    window.doInitLuckysheet(d.sheets, sheetName, isMaster, true);
                    const savedAt = d.savedAt ? new Date(d.savedAt).toLocaleString('ko-KR') : '';
                    window.showBanner(isMaster ? `<i class="fa-solid fa-crown"></i> 마스터 편집 모드 | 최근 저장: ${savedAt}` : `<i class="fa-solid fa-eye"></i> 읽기 전용 모드 | 최근 저장: ${savedAt}`, isMaster ? 'success' : 'readonly');
                } else {
                    window.doInitLuckysheet(null, sheetName, isMaster, true);
                    window.showBanner(isMaster ? `<i class="fa-solid fa-crown"></i> 마스터 편집 모드 (빈 시트)` : `<i class="fa-solid fa-eye"></i> 빈 시트`, isMaster ? 'info' : 'readonly');
                }
            }).catch(err => {
                console.error("Sheet data load error:", err);
            });
        },

        saveCurrentSheet: function() {
            if (!this.currentSheetId) { alert('선택된 시트가 없습니다.'); return; }
            if (!window.db) { alert('Firebase 연결 오류'); return; }
            if (!window.luckysheet) { alert('시트가 아직 준비되지 않았습니다.'); return; }
            
            let sheets = luckysheet.getAllSheets();
            if (!sheets || sheets.length === 0) { alert('저장할 데이터가 없습니다.'); return; }

            const saveBtn = document.getElementById('btn-eval-save');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...'; }

            setTimeout(() => {
                try {
                    const optimizedSheets = sheets.map(s => {
                        const copy = Object.assign({}, s);
                        delete copy.data;
                        return copy;
                    });
                    sheets = JSON.parse(JSON.stringify(optimizedSheets));
                } catch (e) {
                    alert('데이터 변환 중 오류가 발생했습니다.');
                    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> 저장'; }
                    return;
                }

                window.db.collection('workEvalSheetsData').doc(this.currentSheetId).set({
                    sheets: sheets,
                    savedAt: Date.now(),
                    savedBy: window.currentUserDocGlobal ? (window.currentUserDocGlobal.nickname || window.currentUserDocGlobal.email) : '마스터',
                }).then(() => {
                    window.showBanner(`<i class="fa-solid fa-crown"></i> 저장 완료: ${new Date().toLocaleString('ko-KR')}`, 'success');
                }).catch(err => {
                    console.error(err);
                    alert('저장 오류: ' + err.message);
                }).finally(() => {
                    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> 저장'; }
                });
            }, 50);
        }
    };
})();
