const fs = require('fs');

const logic = `
// --- 팀원별 프로젝트 리스트 모달 기능 ---
const btnMemberProjects = document.getElementById('ps-btn-member-projects');
const modalMemberProjects = document.getElementById('member-projects-modal');
const closeBtnMemberProjects = document.getElementById('member-projects-close-btn');
const mpMemberList = document.getElementById('mp-member-list');
const mpProjectList = document.getElementById('mp-project-list');
const mpRightTitle = document.getElementById('mp-right-title');

if (btnMemberProjects && modalMemberProjects && closeBtnMemberProjects) {
    btnMemberProjects.addEventListener('click', () => {
        openMemberProjectsModal();
    });
    closeBtnMemberProjects.addEventListener('click', () => {
        modalMemberProjects.classList.add('hidden');
    });
}

function openMemberProjectsModal() {
    modalMemberProjects.classList.remove('hidden');
    
    // Extract unique members from psData
    const membersMap = {}; // { name: taskCount }
    let totalTasks = 0;

    psData.forEach(task => {
        if (!task.parentId) return; // Only count sub-tasks
        if (task.assignee) {
            const assignees = task.assignee.split(',').map(a => a.trim()).filter(a => a !== '');
            assignees.forEach(a => {
                membersMap[a] = (membersMap[a] || 0) + 1;
            });
            totalTasks += 1;
        }
    });

    const members = Object.keys(membersMap).sort();

    // Render Left Pane
    let htmlLeft = \`<div class="mp-member-item active" data-member="all" style="padding: 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; background: rgba(243, 156, 18, 0.2); color: #f39c12; font-weight: bold; border: 1px solid rgba(243, 156, 18, 0.4);">
        <div style="display: flex; justify-content: space-between;">
            <span>전체 현황</span>
            <span style="background: rgba(243, 156, 18, 0.3); padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">\${totalTasks}건</span>
        </div>
    </div>\`;

    members.forEach(member => {
        htmlLeft += \`<div class="mp-member-item" data-member="\${member}" style="padding: 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; color: var(--text-color);">
            <div style="display: flex; justify-content: space-between;">
                <span>\${member}</span>
                <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">\${membersMap[member]}건</span>
            </div>
        </div>\`;
    });

    mpMemberList.innerHTML = htmlLeft;

    // Attach click events to left pane items
    const items = mpMemberList.querySelectorAll('.mp-member-item');
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            items.forEach(i => {
                i.style.background = 'transparent';
                i.style.color = 'var(--text-color)';
                i.style.border = '1px solid transparent';
            });
            
            const member = item.getAttribute('data-member');
            if (member === 'all') {
                item.style.background = 'rgba(243, 156, 18, 0.2)';
                item.style.color = '#f39c12';
                item.style.border = '1px solid rgba(243, 156, 18, 0.4)';
            } else {
                item.style.background = 'rgba(0, 206, 201, 0.15)';
                item.style.color = '#00cec9';
                item.style.border = '1px solid rgba(0, 206, 201, 0.3)';
            }
            
            renderMemberProjectsRightPane(member);
        });
    });

    // Default to 'all'
    renderMemberProjectsRightPane('all');
}

function renderMemberProjectsRightPane(member) {
    if (member === 'all') {
        mpRightTitle.innerText = \`전체 프로젝트 현황\`;
        mpRightTitle.style.color = '#f1c40f';
    } else {
        mpRightTitle.innerText = \`\${member}님의 담당 프로젝트\`;
        mpRightTitle.style.color = '#00cec9';
    }

    // Find all top-level projects
    const topProjects = psData.filter(t => !t.parentId);
    
    let htmlRight = '';

    topProjects.forEach(proj => {
        // Find tasks in this project
        const projTasks = [];
        const findTasks = (parentId) => {
            const children = psData.filter(t => t.parentId === parentId);
            children.forEach(child => {
                let isMatch = false;
                if (member === 'all') {
                    isMatch = true;
                } else {
                    if (child.assignee) {
                        const assignees = child.assignee.split(',').map(a => a.trim());
                        if (assignees.includes(member)) isMatch = true;
                    }
                }
                if (isMatch) projTasks.push(child);
                findTasks(child.id);
            });
        };
        findTasks(proj.id);

        if (projTasks.length > 0 || (member === 'all')) {
            const total = projTasks.length;
            const completed = projTasks.filter(t => t.status === '완료').length;
            const delayed = projTasks.filter(t => t._isDelayed).length;
            
            // For 'all' member, we calculate progress of all subtasks of project
            let displayTotal = total;
            let displayCompleted = completed;
            if (member === 'all') {
                const allSubTasks = [];
                const findAllTasks = (parentId) => {
                    const children = psData.filter(t => t.parentId === parentId);
                    children.forEach(c => {
                        allSubTasks.push(c);
                        findAllTasks(c.id);
                    });
                };
                findAllTasks(proj.id);
                displayTotal = allSubTasks.length;
                displayCompleted = allSubTasks.filter(t => t.status === '완료').length;
            }

            const progress = displayTotal === 0 ? 0 : Math.round((displayCompleted / displayTotal) * 100);
            
            let statusBadge = \`<span style="background: rgba(39, 174, 96, 0.2); color: #27ae60; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">진행 중</span>\`;
            if (proj.status === '완료') {
                statusBadge = \`<span style="background: rgba(108, 92, 231, 0.2); color: #6c5ce7; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">완료</span>\`;
            } else if (proj._isDelayed) {
                statusBadge = \`<span style="background: rgba(229, 80, 57, 0.2); color: #e55039; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">지연</span>\`;
            }

            let tasksHtml = '';
            if (member !== 'all' && projTasks.length > 0) {
                tasksHtml = \`<div style="margin-top: 15px; background: rgba(0,0,0,0.1); border-radius: 8px; padding: 10px;">
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">담당 세부 업무 (\${total}건)</div>\`;
                projTasks.forEach(pt => {
                    let icon = '<i class="fa-solid fa-circle" style="color: #27ae60; font-size: 0.6rem;"></i>';
                    if (pt.status === '완료') icon = '<i class="fa-solid fa-circle-check" style="color: #6c5ce7; font-size: 0.8rem;"></i>';
                    else if (pt._isDelayed) icon = '<i class="fa-solid fa-circle-exclamation" style="color: #e55039; font-size: 0.8rem;"></i>';
                    else if (pt._isWarning) icon = '<i class="fa-solid fa-circle-exclamation" style="color: #fa8231; font-size: 0.8rem;"></i>';
                    
                    tasksHtml += \`<div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            \${icon} <span>\${pt.name}</span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">\${pt.endDate || '-'}</div>
                    </div>\`;
                });
                tasksHtml += \`</div>\`;
            } else if (member === 'all') {
                tasksHtml = \`<div style="margin-top: 15px; display: flex; align-items: center; gap: 10px;">
                    <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: \${progress}%; background: #00cec9;"></div>
                    </div>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">\${progress}% (\${displayCompleted}/\${displayTotal})</span>
                </div>\`;
            }

            htmlRight += \`<div class="glass-card" style="padding: 15px; border-left: 4px solid \${proj._isDelayed ? '#e55039' : (proj.status==='완료' ? '#6c5ce7' : '#00cec9')};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 5px;">\${proj.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-regular fa-calendar"></i> \${proj.startDate || '-'} ~ \${proj.endDate || '-'}</div>
                    </div>
                    <div>\${statusBadge}</div>
                </div>
                \${tasksHtml}
            </div>\`;
        }
    });

    if (htmlRight === '') {
        htmlRight = \`<div style="text-align: center; color: var(--text-muted); margin-top: 50px;">
            <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
            <div>담당 중인 프로젝트가 없습니다.</div>
        </div>\`;
    }

    mpProjectList.innerHTML = htmlRight;
}
`;

let content = fs.readFileSync('/Users/cg/Documents/lck1315.github.io/work.js', 'utf8');
content = content.replace('initParticles();', logic + '\ninitParticles();');
fs.writeFileSync('/Users/cg/Documents/lck1315.github.io/work.js', content, 'utf8');
console.log('Appended modal logic');
