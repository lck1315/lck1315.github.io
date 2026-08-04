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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

window.submitGameScore = async function(gameId, score) {
    const nickname = localStorage.getItem('dodo_game_nickname');
    if (!nickname) return; // 닉네임이 없으면 스코어 저장 생략
    
    try {
        // 1. 개별 게임 랭킹 저장
        await db.ref('game_ranking/' + gameId).push({
            nickname: nickname,
            score: score,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // 2. 전체 게임 통합 히스토리 (최근 플레이 로그) 저장
        let gameName = gameId;
        const gameNames = {
            'baseball': '야구⚾', 'car': '레이싱🏎️', 'tetris': '테트리스🧱', 'rhythm': '리듬게임🎹',
            'omok': '오목⚫⚪', 'baduk': '바둑☯️', 'janggi': '장기🏯', 'chess': '체스♟️', 'puzzle': '퍼즐🧩',
            'soccer': '축구⚽', 'balloon': '풍선🎈', 'brick': '벽돌깨기🟦'
        };
        if (gameNames[gameId]) gameName = gameNames[gameId];
        
        await db.ref('game_history').push({
            nickname: nickname,
            gameId: gameId,
            gameName: gameName,
            score: score,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // 3. 커뮤니티에 자랑하기 메시지 (10% 확률)
        if(score > 0) {
            if(Math.random() < 0.1) {
                await db.ref('game_chat').push({
                    nickname: '시스템',
                    text: `🎉 [${gameName}] ${nickname}님이 ${score}점을 달성했습니다!`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }
        }
    } catch(e) {
        console.error("Score submit error", e);
    }
};
