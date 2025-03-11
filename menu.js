// メニュー画面の管理
const gameMenuManager = {
    // メニュー状態
    state: 'main', // 'main', 'pitcher-select', 'game'
    
    // 使用可能なピッチャー
    pitchers: [
        { id: 'rookie', name: '新人投手', emoji: '🧍', speed: 0.8, difficulty: 'easy' },
        { id: 'regular', name: 'レギュラー投手', emoji: '🧍‍♂️', speed: 1.0, difficulty: 'normal' },
        { id: 'ace', name: 'エース投手', emoji: '🏃‍♂️', speed: 1.3, difficulty: 'hard' },
        { id: 'legend', name: '伝説の投手', emoji: '🦸‍♂️', speed: 1.6, difficulty: 'hard', unlocked: false }
    ],
    
    // 選択されたピッチャー
    selectedPitcher: 'regular',
    
    // メニューを初期化
    init() {
        this.createMainMenu();
        this.state = 'main';
    },
    
    // メイン画面を作成
    createMainMenu() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.innerHTML = '';
        
        const menuDiv = document.createElement('div');
        menuDiv.className = 'game-menu';
        menuDiv.innerHTML = `
            <h1>⚾ 絵文字バッティングゲーム ⚾</h1>
            <div class="menu-options">
                <button id="start-game">ゲームスタート</button>
                <button id="select-pitcher">ピッチャーを選ぶ</button>
                <button id="how-to-play">遊び方</button>
            </div>
        `;
        
        gameContainer.appendChild(menuDiv);
        
        // ボタンにイベントリスナーを追加
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('select-pitcher').addEventListener('click', () => {
            this.showPitcherSelect();
        });
        
        document.getElementById('how-to-play').addEventListener('click', () => {
            this.showHowToPlay();
        });
    },
    
    // ピッチャー選択画面を表示
    showPitcherSelect() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.innerHTML = '';
        
        const pitcherSelectDiv = document.createElement('div');
        pitcherSelectDiv.className = 'pitcher-select';
        pitcherSelectDiv.innerHTML = `
            <h1>ピッチャーを選択</h1>
            <div class="pitchers-grid">
                ${this.pitchers.map(pitcher => `
                    <div class="pitcher-card ${pitcher.unlocked === false ? 'locked' : ''} ${pitcher.id === this.selectedPitcher ? 'selected' : ''}" data-pitcher="${pitcher.id}">
                        <div class="pitcher-emoji">${pitcher.emoji}</div>
                        <div class="pitcher-name">${pitcher.name}</div>
                        <div class="pitcher-stats">
                            <div>球速: ${this.getSpeedStars(pitcher.speed)}</div>
                            <div>難易度: ${pitcher.difficulty}</div>
                        </div>
                        ${pitcher.unlocked === false ? '<div class="locked-overlay">🔒</div>' : ''}
                    </div>
                `).join('')}
            </div>
            <button id="back-to-menu">メニューに戻る</button>
        `;
        
        gameContainer.appendChild(pitcherSelectDiv);
        
        // イベントリスナーを追加
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.createMainMenu();
        });
        
        // ピッチャーカードのイベントリスナー
        const pitcherCards = document.querySelectorAll('.pitcher-card:not(.locked)');
        pitcherCards.forEach(card => {
            card.addEventListener('click', () => {
                // 選択されたピッチャーを更新
                this.selectedPitcher = card.dataset.pitcher;
                
                // 表示を更新
                document.querySelectorAll('.pitcher-card').forEach(c => {
                    c.classList.remove('selected');
                });
                card.classList.add('selected');
            });
        });
    },
    
    // 球速を星で表示
    getSpeedStars(speed) {
        const fullStars = Math.floor(speed * 5);
        let stars = '';
        for (let i = 0; i < 5; i++) {
            stars += i < fullStars ? '★' : '☆';
        }
        return stars;
    },
    
    // 遊び方を表示
    showHowToPlay() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.innerHTML = '';
        
        const howToPlayDiv = document.createElement('div');
        howToPlayDiv.className = 'how-to-play';
        howToPlayDiv.innerHTML = `
            <h1>遊び方</h1>
            <div class="instructions">
                <p>1. ピッチャーがボールを投げてきます ⚾</p>
                <p>2. ボールがストライクゾーン(点線の四角)に入ったときにクリックしてバットを振ります 🏏</p>
                <p>3. うまくタイミングよくボールに当てるとホームランになります! 💥</p>
                <p>4. 10球中、指定の回数以上ホームランを打つとクリアです 🎉</p>
            </div>
            <button id="back-to-menu">メニューに戻る</button>
        `;
        
        gameContainer.appendChild(howToPlayDiv);
        
        // イベントリスナーを追加
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.createMainMenu();
        });
    },
    
    // ゲームを開始
    startGame() {
        this.state = 'game';
        // 選択されたピッチャーの情報を取得
        const pitcher = this.pitchers.find(p => p.id === this.selectedPitcher);
        
        // 既存のゲーム開始関数を呼び出す
        // ここは実際のゲームコードと統合する際に修正
        initGame(pitcher);
    }
};

// メニュー用のスタイルを追加するための関数
function addMenuStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .game-menu {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 400px;
            width: 100%;
        }
        
        .menu-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 30px;
            width: 200px;
        }
        
        .menu-options button {
            padding: 12px;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            background-color: #4caf50;
            color: white;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .menu-options button:hover {
            background-color: #45a049;
        }
        
        .pitcher-select {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            width: 100%;
        }
        
        .pitchers-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .pitcher-card {
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            text-align: center;
            cursor: pointer;
            position: relative;
            transition: transform 0.2s, border-color 0.2s;
        }
        
        .pitcher-card:hover {
            transform: translateY(-5px);
        }
        
        .pitcher-card.selected {
            border-color: #4caf50;
            background-color: rgba(76, 175, 80, 0.1);
        }
        
        .pitcher-emoji {
            font-size: 40px;
            margin-bottom: 10px;
        }
        
        .pitcher-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .pitcher-stats {
            font-size: 14px;
        }
        
        .locked-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 40px;
            border-radius: 8px;
        }
        
        .pitcher-card.locked {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        .how-to-play {
            padding: 20px;
            text-align: center;
        }
        
        .instructions {
            text-align: left;
            margin: 20px 0;
            line-height: 1.6;
        }
        
        #back-to-menu {
            padding: 10px 20px;
            background-color: #4caf50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// ページ読み込み時にメニューを初期化する
document.addEventListener('DOMContentLoaded', () => {
    addMenuStyles();
    gameMenuManager.init();
});

// 実際のゲームを初期化する関数 (game.jsと統合)
function initGame(pitcher) {
    // 既存のゲームHTML構造を再構築
    // ここで実際のゲーム画面を表示し、選択されたピッチャーの情報を使用
    console.log(`${pitcher.name}(${pitcher.emoji})を選択してゲームを開始`);
    
    // 実際のゲームコードと統合する際はここでHTMLを生成して
    // game.jsの初期化関数を呼び出す
}
