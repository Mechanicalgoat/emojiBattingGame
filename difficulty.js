// 難易度設定用のオブジェクト
const difficultySettings = {
    easy: {
        ballSpeed: 2000, // ボールの速さ (ミリ秒) - 大きいほど遅い
        strikeZoneSize: 1.2, // ストライクゾーンの相対サイズ
        hitWindow: 600, // スイングのタイミング許容範囲 (ミリ秒)
        requiredHomeRuns: 2, // クリアに必要なホームラン数
        pitcherEmoji: '🧍'
    },
    normal: {
        ballSpeed: 1500,
        strikeZoneSize: 1.0,
        hitWindow: 400,
        requiredHomeRuns: 3,
        pitcherEmoji: '🧍‍♂️'
    },
    hard: {
        ballSpeed: 1000,
        strikeZoneSize: 0.8,
        hitWindow: 200,
        requiredHomeRuns: 5,
        pitcherEmoji: '🏃‍♂️'
    }
};

// 現在の難易度
let currentDifficulty = 'normal';

// 難易度設定を適用する関数
function applyDifficulty(difficulty) {
    currentDifficulty = difficulty;
    const settings = difficultySettings[difficulty];

    // ストライクゾーンのサイズを変更
    const strikeZone = document.getElementById('strike-zone');
    strikeZone.style.width = `${80 * settings.strikeZoneSize}px`;
    strikeZone.style.height = `${80 * settings.strikeZoneSize}px`;

    // ピッチャーの絵文字を変更
    const pitcher = document.querySelector('.pitcher');
    pitcher.textContent = settings.pitcherEmoji;
    
    // ゲームプレイに関連する変数を更新
    // (game.jsに統合する際に throwBall と endGame 関数を修正)
}

// 難易度選択UIの追加
function createDifficultySelector() {
    const gameHeader = document.querySelector('.game-header');
    const difficultySelector = document.createElement('div');
    difficultySelector.className = 'difficulty-selector';
    difficultySelector.innerHTML = `
        <p>難易度: </p>
        <button data-difficulty="easy">簡単</button>
        <button data-difficulty="normal" class="active">普通</button>
        <button data-difficulty="hard">難しい</button>
    `;
    
    gameHeader.appendChild(difficultySelector);
    
    // 難易度ボタンのイベントリスナーを追加
    const difficultyButtons = difficultySelector.querySelectorAll('button');
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyDifficulty(button.dataset.difficulty);
        });
    });
}

// 初期設定
document.addEventListener('DOMContentLoaded', () => {
    createDifficultySelector();
    applyDifficulty('normal');
});
