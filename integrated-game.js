// ゲーム全体の処理を統合したスクリプト
document.addEventListener('DOMContentLoaded', () => {
    // 難易度設定
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
                currentDifficulty = pitcher.difficulty;
                
                // ピッチャーの絵文字を更新
                const pitcherElement = document.querySelector('.pitcher');
                if (pitcherElement) {
                    pitcherElement.textContent = pitcher.emoji;
                }
                
                // ストライクゾーンのサイズを変更
                const strikeZone = document.getElementById('strike-zone');
                if (strikeZone) {
                    const settings = difficultySettings[currentDifficulty];
                    strikeZone.style.width = `${250 * settings.strikeZoneSize}px`;
                    strikeZone.style.height = `${180 * settings.strikeZoneSize}px`;
                }
            }
            
            // ゲーム初期化を実行
            initGame();
        }
    };

    // メニュー用のスタイルを追加
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

    // ゲーム初期化関数
    function initGame() {
        console.log("ゲーム初期化中...");
        
        // DOM要素の取得
        const startButton = document.getElementById('start-button');
        const ballsLeftElement = document.getElementById('balls-left');
        const homeRunCountElement = document.getElementById('home-run-count');
        const resultMessageElement = document.getElementById('result-message');
        const ball = document.getElementById('ball');
        const strikeZone = document.getElementById('strike-zone');
        const batter = document.getElementById('batter');
        const pitcher = document.querySelector('.pitcher');
        const gameField = document.querySelector('.game-field');
        const distanceMeter = document.querySelector('.distance-meter');
        const distanceValue = document.getElementById('distance-value');
        const fieldOverview = document.querySelector('.field-overview');
        const ballLanding = document.getElementById('ball-landing');
        const overviewDistance = document.getElementById('overview-distance');
        const closeOverviewButton = document.querySelector('.close-overview');

        // 要素チェック（デバッグ用）
        console.log("要素確認:", {
            startButton: !!startButton,
            ball: !!ball,
            strikeZone: !!strikeZone,
            batter: !!batter
        });

        // 現在の難易度に基づく設定
        const settings = difficultySettings[currentDifficulty];

        // ゲーム変数
        let ballsLeft = 10;
        let homeRunCount = 0;
        let isGameActive = false;
        let canSwing = false;
        let currentBallPosition = { x: 0, y: 0, z: 0 };
        let ballTrajectory = [];
        
        // フィールドのサイズを取得 (スケーリング用)
        const fieldRect = gameField.getBoundingClientRect();
        const fieldWidth = fieldRect.width;
        const fieldHeight = fieldRect.height;

        // スタートボタンのイベントリスナー
        startButton.addEventListener('click', startGame);

        // ストライクゾーンのマウスイベント
        strikeZone.addEventListener('mousemove', (e) => {
            if (isGameActive) {
                // マウス位置にバットを移動
                const rect = strikeZone.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                batter.style.left = `${e.clientX - gameField.getBoundingClientRect().left}px`;
                batter.style.bottom = '60px'; // 高さは固定
                batter.style.transform = 'translateX(-50%)';
            }
        });

        strikeZone.addEventListener('click', (e) => {
            if (isGameActive && canSwing) {
                swing(e);
            }
        });
        
        // 俯瞰図を閉じるボタン
        if (closeOverviewButton) {
            closeOverviewButton.addEventListener('click', () => {
                fieldOverview.style.display = 'none';
                // 次の投球へ
                setTimeout(throwBall, 500);
            });
        }

        // ゲーム開始関数
        function startGame() {
            console.log("ゲーム開始!");
            if (isGameActive) return;

            // ゲーム変数のリセット
            ballsLeft = 10;
            homeRunCount = 0;
            isGameActive = true;
            updateUI();

            startButton.textContent = 'ゲーム中...';
            startButton.disabled = true;
            if (resultMessageElement) resultMessageElement.textContent = '';
            if (fieldOverview) fieldOverview.style.display = 'none';

            // バットの初期位置
            batter.style.position = 'absolute';
            batter.style.bottom = '60px';
            batter.style.left = '50%';
            batter.style.transform = 'translateX(-50%)';

            // 最初の投球を開始
            throwBall();
        }

        // 投球関数
        function throwBall() {
            if (ballsLeft <= 0) {
                endGame();
                return;
            }

            // ボールを初期位置に設定（ピッチャーポジション）
            ball.style.left = '50%';
            ball.style.bottom = '230px';
            ball.style.transform = 'translate(-50%, -50%) scale(0.8)';
            ball.style.visibility = 'visible';
            ball.style.transition = 'none';
            ball.style.zIndex = '15';
            
            // トラッキング用の初期位置
            currentBallPosition = { x: fieldWidth/2, y: 230, z: 0 };
            ballTrajectory = [{ ...currentBallPosition }];
            
            // クラスをリセット
            ball.classList.remove('home-run');
            ball.classList.remove('ball-through');
            
            // 飛距離メーターを非表示
            if (distanceMeter) distanceMeter.style.display = 'none';
            
            // ピッチャーのモーション
            pitcher.textContent = '🤾';
            
            setTimeout(() => {
                // 難易度に応じたピッチャー絵文字を使用
                pitcher.textContent = settings.pitcherEmoji;
                
                // ストライクゾーン内のランダムな位置を計算
                const zoneRect = strikeZone.getBoundingClientRect();
                const fieldRect = gameField.getBoundingClientRect();
                
                // ターゲット位置を計算（ストライクゾーンの中心から少しランダムにずらす）
                const zoneCenterX = zoneRect.left + zoneRect.width / 2 - fieldRect.left;
                const zoneCenterY = fieldRect.bottom - zoneRect.top - zoneRect.height / 2;
                
                const randomOffsetX = (Math.random() - 0.5) * zoneRect.width * 0.8;
                const randomOffsetY = (Math.random() - 0.5) * zoneRect.height * 0.8;
                
                const targetX = zoneCenterX + randomOffsetX;
                const targetY = zoneCenterY + randomOffsetY;
                
                // 3D的な投球アニメーションのための中間点
                const midpointY = (parseFloat(ball.style.bottom) + targetY) / 2;
                const midpointZ = 30; // ボールが最も手前に来る位置
                
                // ボールを投げる
                setTimeout(() => {
                    // ステップ1: 中間点へ（ボールが近づいてくる）
                    ball.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.6, 1)';
                    ball.style.left = `${targetX}px`;
                    ball.style.bottom = `${midpointY}px`;
                    ball.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    
                    // トラッキング中間点
                    setTimeout(() => {
                        currentBallPosition = { x: targetX, y: midpointY, z: midpointZ };
                        ballTrajectory.push({ ...currentBallPosition });
                        
                        // ステップ2: 目標点へ（ストライクゾーン）
                        ball.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.6, 1)';
                        ball.style.bottom = `${targetY}px`;
                        ball.style.transform = 'translate(-50%, -50%) scale(1)';
                        
                        canSwing = true;
                        
                        // スイングしなかった場合（見逃し）
                        setTimeout(() => {
                            if (canSwing) {
                                canSwing = false;
                                ballsLeft--;
                                updateUI();
                                if (resultMessageElement) resultMessageElement.textContent = '見逃し！';
                                
                                // ボールを通過させる
                                ball.style.transition = 'all 0.4s ease-in';
                                ball.style.bottom = '-50px';
                                
                                currentBallPosition = { x: targetX, y: -50, z: -30 };
                                ballTrajectory.push({ ...currentBallPosition });
                                
                                // 次の投球
                                setTimeout(throwBall, 1000);
                            }
                        }, settings.hitWindow * 1.5); // 難易度に応じた待機時間
                    }, settings.ballSpeed * 0.25);
                }, 200);
            }, 300);
        }

        // スイング関数
        function swing(e) {
            if (!canSwing) return;
            
            canSwing = false;
            ballsLeft--;

            // バットをスイング
            batter.classList.add('swing');
            setTimeout(() => {
                batter.classList.remove('swing');
            }, 300);

            // ヒットエフェクト
            createHitEffect(e.clientX, e.clientY);

            // ボールとの衝突判定
            const ballRect = ball.getBoundingClientRect();
            const batterRect = batter.getBoundingClientRect();
            
            const ballCenterX = ballRect.left + ballRect.width/2;
            const ballCenterY = ballRect.top + ballRect.height/2;
            
            const batterCenterX = batterRect.left + batterRect.width/2;
            const batterCenterY = batterRect.top + batterRect.height/2;
            
            const distance = Math.sqrt(
                Math.pow(ballCenterX - batterCenterX, 2) + 
                Math.pow(ballCenterY - batterCenterY, 2)
            );

            // 難易度に基づくヒット判定の距離
            const hitDistance = 70 * settings.hitWindow / 400;

            if (distance < hitDistance) { // 難易度に応じたヒット判定
                // ホームラン！
                homeRunCount++;
                const homeRunDistance = calculateHomeRunDistance();
                
                // 飛距離メーターを表示
                if (distanceMeter) {
                    distanceMeter.style.display = 'block';
                    distanceValue.textContent = homeRunDistance;
                }
                
                // ホームラン軌道のアニメーション
                animateHomeRun(homeRunDistance);
                
                if (resultMessageElement) resultMessageElement.textContent = `ホームラン！ ${homeRunDistance}m飛んだ！`;
            } else {
                // 空振り
                if (resultMessageElement) resultMessageElement.textContent = '空振り！';
                
                // ボールを通過させる
                ball.style.transition = 'all 0.4s ease-in';
                ball.style.bottom = '-50px';
                
                // 次の投球
                setTimeout(throwBall, 1200);
            }

            updateUI();
        }
        
        // ホームランアニメーション
        function animateHomeRun(distance) {
            // 軌道に応じた角度と距離を計算
            const angle = Math.random() * 60 - 30; // -30度から30度のランダムな角度
            const angleRad = angle * Math.PI / 180;
            
            // ボールの飛距離に応じた位置を計算
            const normalizedDistance = Math.min(distance / 150, 1); // 150mを最大とする
            
            // 初速と角度からの放物線軌道
            const animateStep = (progress) => {
                // 放物線の式: y = x - x²
                const x = progress;
                const y = x - Math.pow(x/1.5, 2);
                
                // x成分の計算（角度を考慮）
                const xOffset = normalizedDistance * 300 * Math.sin(angleRad) * progress;
                const xPos = fieldWidth/2 + xOffset;
                
                // y成分の計算（放物線）
                const yPos = 60 + y * 300;
                
                // スケール（遠近感）
                const scale = Math.max(0.1, 1 - progress * 0.9);
                
                // ボールの位置を更新
                ball.style.transition = 'none';
                ball.style.left = `${xPos}px`;
                ball.style.bottom = `${yPos}px`;
                ball.style.transform = `translate(-50%, -50%) scale(${scale})`;
                
                // 現在のボール位置を記録（トラッキング用）
                currentBallPosition = { x: xPos, y: yPos, z: -(progress * 100) };
                ballTrajectory.push({ ...currentBallPosition });
                
                if (progress < 1) {
                    requestAnimationFrame(() => animateStep(progress + 0.04));
                } else {
                    // アニメーション完了時
                    ball.style.visibility = 'hidden';
                    
                    // 俯瞰図を表示（存在する場合）
                    if (fieldOverview && ballLanding && overviewDistance) {
                        fieldOverview.style.display = 'flex';
                        
                        // ランディング地点の表示（角度と距離から計算）
                        const landingX = 150 + Math.sin(angleRad) * normalizedDistance * 120;
                        const landingY = 50 + normalizedDistance * 200;
                        
                        ballLanding.style.left = `${landingX}px`;
                        ballLanding.style.top = `${landingY}px`;
                        
                        overviewDistance.textContent = distance;
                    } else {
                        // 俯瞰図がない場合は次の投球へ
                        setTimeout(throwBall, 1500);
                    }
                }
            };
            
            //
