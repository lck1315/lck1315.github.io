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

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let currentRankingRef = null;

// ==========================================
// 1. Ranking System
// ==========================================
window.loadRanking = function(gameId, btnElement = null) {
    if (btnElement) {
        document.querySelectorAll('.ranking-tabs .filter-tab').forEach(t => t.classList.remove('active'));
        btnElement.classList.add('active');
    } else if (event && event.currentTarget && event.currentTarget.classList) {
        document.querySelectorAll('.ranking-tabs .filter-tab').forEach(t => t.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }
    
    const listEl = document.getElementById('ranking-list');
    listEl.innerHTML = '<div style="text-align:center; color:var(--game-muted); padding: 2rem;">데이터를 불러오는 중... <i class="fa-solid fa-spinner fa-spin"></i></div>';
    
    if (currentRankingRef) {
        currentRankingRef.off(); // 이전 리스너 해제
    }
    
    currentRankingRef = db.ref('game_ranking/' + gameId).orderByChild('score').limitToLast(10);
    currentRankingRef.on('value', snapshot => {
        const data = snapshot.val();
        if (!data) {
            listEl.innerHTML = '<div style="text-align:center; color:var(--game-muted); padding: 2rem;">아직 등록된 랭킹이 없습니다. 첫 번째 랭커가 되어보세요!</div>';
            return;
        }
        
        // 정렬 (Firebase는 오름차순으로 가져오므로 내림차순 정렬 필요)
        const sorted = Object.values(data).sort((a, b) => b.score - a.score);
        
        listEl.innerHTML = '';
        sorted.forEach((item, index) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.padding = '0.8rem 1rem';
            row.style.background = 'rgba(0,0,0,0.2)';
            row.style.borderRadius = '8px';
            row.style.border = '1px solid rgba(255,255,255,0.05)';
            row.style.gap = '1rem';
            
            let rankIcon = `<span style="font-size:1.2rem; font-weight:bold; width:30px; text-align:center; color:var(--game-muted);">${index + 1}</span>`;
            if (index === 0) rankIcon = `<span style="font-size:1.2rem; width:30px; text-align:center;">🥇</span>`;
            if (index === 1) rankIcon = `<span style="font-size:1.2rem; width:30px; text-align:center;">🥈</span>`;
            if (index === 2) rankIcon = `<span style="font-size:1.2rem; width:30px; text-align:center;">🥉</span>`;
            
            row.innerHTML = `
                ${rankIcon}
                <div style="flex:1; font-weight:600; color:var(--game-text);">${escapeHtml(item.nickname || '무명 랭커')}</div>
                <div style="font-family:'Orbitron', sans-serif; font-weight:700; color:var(--game-primary);">${item.score.toLocaleString()} <span style="font-size:0.7rem;color:var(--game-muted)">PTS</span></div>
            `;
            listEl.appendChild(row);
        });
    }, error => {
        console.error("Firebase Ranking Error: ", error);
        listEl.innerHTML = '<div style="text-align:center; color:#ef4444; padding: 2rem;">Firebase 권한 오류이거나 데이터베이스가 활성화되지 않았습니다.<br>Firebase 콘솔에서 Realtime Database 규칙을 확인해주세요.</div>';
    });
};

// ==========================================
// 2. Community Chat
// ==========================================
function initChat() {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;
    
    // Listen for chat messages (last 30)
    db.ref('game_chat').orderByChild('timestamp').limitToLast(30).on('value', snapshot => {
        messagesEl.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            messagesEl.innerHTML = '<div style="text-align:center; color:var(--game-muted); padding: 2rem;">첫 댓글을 남겨주세요!</div>';
            return;
        }
        
        // 정렬 (오름차순 그대로, 최신이 아래로)
        const msgs = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        
        msgs.forEach(msg => {
            const div = document.createElement('div');
            div.style.background = 'rgba(255,255,255,0.03)';
            div.style.padding = '0.8rem';
            div.style.borderRadius = '8px';
            div.style.borderLeft = '3px solid var(--game-primary)';
            
            const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
            
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.8rem;">
                    <span style="font-weight:700; color:var(--game-accent);">${escapeHtml(msg.nickname || '익명')}</span>
                    <span style="color:var(--game-muted);">${timeStr}</span>
                </div>
                <div style="color:var(--game-text); line-height:1.4;">${escapeHtml(msg.text || '')}</div>
            `;
            messagesEl.appendChild(div);
        });
        
        // 스크롤 맨 아래로
        messagesEl.scrollTop = messagesEl.scrollHeight;
    });
    
    // Submit Chat
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nicknameInput = document.getElementById('chat-nickname');
            const textInput = document.getElementById('chat-input');
            
            const nickname = nicknameInput.value.trim();
            const text = textInput.value.trim();
            
            if (!nickname || !text) return;
            
            // Firebase에 푸시
            await db.ref('game_chat').push({
                nickname,
                text,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            textInput.value = ''; // 초기화
            
            // 닉네임 로컬스토리지에 저장 (다음 편의를 위해)
            localStorage.setItem('dodo_game_nickname', nickname);
        });
    }
    
    // 이전에 썼던 닉네임 불러오기
    const savedName = localStorage.getItem('dodo_game_nickname');
    if (savedName) {
        document.getElementById('chat-nickname').value = savedName;
    }
}

// XSS 방지 유틸
function escapeHtml(unsafe) {
    return (unsafe||'').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// ==========================================
// Init
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const firstTab = document.querySelector('.ranking-tabs .filter-tab');
        if (firstTab) {
            window.loadRanking('car', firstTab); 
        }
    }, 100);
    
    initChat();
});
