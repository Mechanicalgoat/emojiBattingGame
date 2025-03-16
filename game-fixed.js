// ゲーム全体の処理を統合したスクリプト
document.addEventListener('DOMContentLoaded', () => {
    // 難易度設定
    window.difficultySettings = {
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
    window.currentDifficulty = 'normal';

    // ゲーム初期化関数をグローバルスコープに公開
    window.initGame = initGame;
    window.applyDifficulty = applyDifficulty;

    // 難易度設定を適用する関数
    function applyDifficulty(difficulty) {
        window.currentDifficulty = difficulty;
        const settings = window.difficultySettings[difficulty];

        // ストライクゾーンのサイズを変更
        const strikeZone = document.getElementById('strike-zone');
        if (strikeZone) {
            strikeZone.style.width = `${120 * settings.strikeZoneSize}px`;
            strikeZone.style.height = `${120 * settings.strikeZoneSize}px`;
        }

        // ピッチャーの絵文字を変更
        const pitcher = document.querySelector('.pitcher');
        if (pitcher) {
            pitcher.textContent = settings.pitcherEmoji;
        }
        
        // プレイヤー情報の球速を更新
        const pitcherInfo = document.querySelector('.player-info-right .player-stats');
        if (pitcherInfo) {
            const speedMap = {
                'easy': '130km/h',
                'normal': '145km/h',
                'hard': '160km/h'
            };
            pitcherInfo.textContent = `球速: ${speedMap[difficulty]}`;
        }
        
        return settings;
    }

    // メニュー管理
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

        // オリジナルのHTML構造を保存
        originalHTML: '',
        
        // メニューを初期化
        init() {
            // オリジナルのHTML構造を保存
            this.originalHTML = document.querySelector('.game-container').innerHTML;
            
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
            
            // 元のゲーム画面のHTMLを復元
            const gameContainer = document.querySelector('.game-container');
            gameContainer.innerHTML = this.originalHTML;
            
            // 難易度を設定（選択されたピッチャーに基づく）
            const pitcher = this.pitchers.find(p => p.id === this.selectedPitcher);
            if (pitcher) {
                window.currentDifficulty = pitcher.difficulty;
                applyDifficulty(pitcher.difficulty);
                
                // ピッチャーの絵文字を更新
                const pitcherElement = document.querySelector('.pitcher');
                if (pitcherElement) {
                    pitcherElement.textContent = pitcher.emoji;
                }
            }
            
            // ゲーム初期化を実行
            window.initGame();
        }
    };
