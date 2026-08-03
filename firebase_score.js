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
    if (!nickname) return; // 닉네임이 없으면 스코어 저장 생략 (강제하지 않음)
    
    try {
        await db.ref('game_ranking/' + gameId).push({
            nickname: nickname,
            score: score,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // 커뮤니티에 자랑하기 메시지도 자동 등록
        if(score > 0) {
            let gameName = gameId;
            if(gameId==='car') gameName='레이싱';
            if(gameId==='baseball') gameName='야구';
            if(gameId==='tetris') gameName='테트리스';
            if(gameId==='rhythm') gameName='리듬게임';
            
            // 랜덤으로 10% 확률로만 자랑 메시지 (도배 방지)
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
