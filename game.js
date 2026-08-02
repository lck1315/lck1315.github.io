document.addEventListener('DOMContentLoaded', () => {
    console.log('game.js loaded and ready.');

    const btnAddGame = document.getElementById('btn-add-game');
    if (btnAddGame) {
        btnAddGame.addEventListener('click', () => {
            alert('게임 추가 기능은 준비 중입니다.');
        });
    }
});
