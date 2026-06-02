import re

with open('/Users/cg/Documents/lck1315.github.io/work.js', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the entire initPerformanceLogic function.
# We will use regex to find the function block.
pattern = re.compile(r'    function initPerformanceLogic\(\) \{.*?\n    \}\n    initPerformanceLogic\(\);', re.DOTALL)

new_logic = """    function initPerformanceLogic() {
        const btnAddRow = document.getElementById('btn-perf-add-row');
        const btnAddCol = document.getElementById('btn-perf-add-col');
        const btnSave = document.getElementById('btn-perf-save');
        const theadTr = document.getElementById('perf-matrix-header');
        const tbody = document.getElementById('perf-matrix-body');
        const emptyState = document.getElementById('perf-matrix-empty');
        const table = document.getElementById('perf-matrix-table');
        
        let matrixData = { rows: [], cols: [], cells: {} };
        let unsubscribePerf = null;
        let isEditing = false; // 방해 방지용

        function renderMatrix() {
            if (!theadTr || !tbody) return;
            
            // 헤더 렌더링
            theadTr.innerHTML = '<th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; position: sticky; top: 0; left: 0; background: #f8f9fa; z-index: 2; min-width: 200px; font-weight: bold; color: #495057;">평가 항목</th>';
            matrixData.cols.forEach((colName, cIdx) => {
                const th = document.createElement('th');
                th.style.cssText = 'border: 1px solid #dee2e6; padding: 12px; text-align: center; background: #f8f9fa; font-weight: bold; color: #495057; min-width: 150px; position: relative;';
                th.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${colName}</span>
                        <button class="btn-del-col" data-idx="${cIdx}" style="background: none; border: none; color: #ff4757; cursor: pointer; padding: 2px 5px;"><i class="fa-solid fa-times"></i></button>
                    </div>
                `;
                theadTr.appendChild(th);
            });

            // 바디 렌더링
            tbody.innerHTML = '';
            matrixData.rows.forEach((rowName, rIdx) => {
                const tr = document.createElement('tr');
                
                // 첫 번째 열 (항목 이름)
                const th = document.createElement('td');
                th.style.cssText = 'border: 1px solid #dee2e6; padding: 12px; background: #fff; font-weight: bold; position: sticky; left: 0; z-index: 1;';
                th.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${rowName}</span>
                        <button class="btn-del-row" data-idx="${rIdx}" style="background: none; border: none; color: #ff4757; cursor: pointer; padding: 2px 5px;"><i class="fa-solid fa-times"></i></button>
                    </div>
                `;
                tr.appendChild(th);
                
                // 나머지 열 (팀원별 셀)
                matrixData.cols.forEach((_, cIdx) => {
                    const td = document.createElement('td');
                    td.style.cssText = 'border: 1px solid #dee2e6; padding: 0; background: #fff; vertical-align: top;';
                    
                    const cellKey = `${rIdx}_${cIdx}`;
                    const val = matrixData.cells[cellKey] || '';
                    
                    td.innerHTML = `<textarea class="matrix-cell-input" data-key="${cellKey}" style="width: 100%; height: 60px; border: none; padding: 10px; resize: vertical; outline: none; background: transparent; font-family: inherit; font-size: 0.9rem;">${val}</textarea>`;
                    tr.appendChild(td);
                });
                
                tbody.appendChild(tr);
            });
            
            // 엠프티 스테이트 처리
            if (matrixData.rows.length === 0 && matrixData.cols.length === 0) {
                if (table) table.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
            } else {
                if (table) table.style.display = 'table';
                if (emptyState) emptyState.style.display = 'none';
            }
            
            bindEvents();
        }

        function bindEvents() {
            // 셀 입력 시 포커스 방해 금지 및 데이터 업데이트
            document.querySelectorAll('.matrix-cell-input').forEach(input => {
                input.addEventListener('focus', () => isEditing = true);
                input.addEventListener('blur', () => isEditing = false);
                input.addEventListener('input', (e) => {
                    const key = e.target.dataset.key;
                    matrixData.cells[key] = e.target.value;
                });
            });

            // 행 삭제
            document.querySelectorAll('.btn-del-row').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if(!confirm('이 평가 항목을 삭제하시겠습니까?')) return;
                    const rIdx = parseInt(e.currentTarget.dataset.idx);
                    matrixData.rows.splice(rIdx, 1);
                    // 삭제된 행의 셀 데이터 정리 및 인덱스 시프트 처리는 복잡하므로 단순화:
                    // 새로 저장할 때 현재 rows/cols 기준으로만 셀을 맵핑함.
                    const newCells = {};
                    for(let r=0; r<matrixData.rows.length; r++) {
                        for(let c=0; c<matrixData.cols.length; c++) {
                            let oldR = r >= rIdx ? r + 1 : r;
                            newCells[`${r}_${c}`] = matrixData.cells[`${oldR}_${c}`] || '';
                        }
                    }
                    matrixData.cells = newCells;
                    renderMatrix();
                    saveMatrixToDB();
                });
            });

            // 열 삭제
            document.querySelectorAll('.btn-del-col').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if(!confirm('이 팀원을 평가 대상에서 제외하시겠습니까?')) return;
                    const cIdx = parseInt(e.currentTarget.dataset.idx);
                    matrixData.cols.splice(cIdx, 1);
                    const newCells = {};
                    for(let r=0; r<matrixData.rows.length; r++) {
                        for(let c=0; c<matrixData.cols.length; c++) {
                            let oldC = c >= cIdx ? c + 1 : c;
                            newCells[`${r}_${c}`] = matrixData.cells[`${r}_${oldC}`] || '';
                        }
                    }
                    matrixData.cells = newCells;
                    renderMatrix();
                    saveMatrixToDB();
                });
            });
        }

        async function saveMatrixToDB() {
            if (!auth.currentUser) return;
            try {
                await db.collection('workEvaluations').doc(auth.currentUser.uid).set(matrixData);
            } catch(e) {
                console.error("Matrix save error:", e);
            }
        }

        btnAddRow?.addEventListener('click', () => {
            const name = prompt('추가할 평가 항목의 이름을 입력하세요 (예: 업무 완성도, 책임감 등)');
            if (name && name.trim()) {
                matrixData.rows.push(name.trim());
                renderMatrix();
                saveMatrixToDB();
            }
        });

        btnAddCol?.addEventListener('click', () => {
            const name = prompt('평가할 팀원의 이름을 입력하세요 (예: 홍길동)');
            if (name && name.trim()) {
                matrixData.cols.push(name.trim());
                renderMatrix();
                saveMatrixToDB();
            }
        });

        btnSave?.addEventListener('click', async () => {
            if (!auth.currentUser) return alert('로그인이 필요합니다.');
            
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장중';
            
            await saveMatrixToDB();
            
            setTimeout(() => {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i class="fa-solid fa-save"></i> 저장';
                alert('평가 내용이 성공적으로 저장되었습니다!');
            }, 500);
        });

        auth.onAuthStateChanged(user => {
            if (user) {
                if (unsubscribePerf) unsubscribePerf();
                
                unsubscribePerf = db.collection('workEvaluations').doc(user.uid).onSnapshot(doc => {
                    if (!isEditing) {
                        if (doc.exists) {
                            const data = doc.data();
                            matrixData.rows = data.rows || [];
                            matrixData.cols = data.cols || [];
                            matrixData.cells = data.cells || {};
                        } else {
                            matrixData = { rows: [], cols: [], cells: {} };
                        }
                        renderMatrix();
                    }
                });
            } else {
                if (unsubscribePerf) {
                    unsubscribePerf();
                    unsubscribePerf = null;
                }
                matrixData = { rows: [], cols: [], cells: {} };
                renderMatrix();
            }
        });
    }
    initPerformanceLogic();"""

new_content = pattern.sub(new_logic, content)

with open('/Users/cg/Documents/lck1315.github.io/work.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement done.")
