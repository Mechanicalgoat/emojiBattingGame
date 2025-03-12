document.addEventListener('DOMContentLoaded', () => {
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

    // ゲーム変数
    let ballsLeft = 10;
    let homeRunCount = 0;
    let isGameActive = false;
    let canSwing = false;
    let isBatFollowing = false;

    // スタートボタンのイベントリスナー
    startButton.addEventListener('click', startGame);

    // ストライクゾーンのマウスイベント
    strikeZone.addEventListener('mouseenter', () => {
        if (isGameActive) {
            isBatFollowing = true;
        }
    });

    strikeZone.addEventListener('mouseleave', () => {
        if (isGameActive) {
            isBatFollowing = false;
            // ストライクゾーンから出たときはバットを初期位置に戻す
            resetBatterPosition();
        }
    });

    strikeZone.addEventListener('mousemove', (e) => {
        if (isGameActive && isBatFollowing) {
            updateBatterPosition(e);
        }
    });

    strikeZone.addEventListener('click', (e) => {
        if (isGameActive && canSwing) {
            swing(e);
        }
    });

    // バットの位置をリセットする関数
    function resetBatterPosition() {
        batter.style.position = 'absolute';
        batter.style.bottom = '60px';
        batter.style.left = '50%';
        batter.style.top = 'auto';
        batter.style.transform = 'translateX(-50%)';
    }

    // バットの位置を更新する関数
    function updateBatterPosition(e) {
        const rect = gameField.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        batter.style.position = 'absolute';
        batter.style.left = `${x}px`;
        batter.style.top = `${y}px`;
        batter.style.transform = 'translate(-50%, -50%)';
        batter.style.bottom = 'auto';
    }

    // ゲーム開始関数
    function startGame() {
        if (isGameActive) return;

        // ゲーム変数のリセット
        ballsLeft = 10;
        homeRunCount = 0;
        isGameActive = true;
        updateUI();

        startButton.textContent = 'ゲーム中...';
        startButton.disabled = true;
        resultMessageElement.textContent = '';

        // バットの初期位置をリセット
        resetBatterPosition();

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
        const pitcherPos = pitcher.getBoundingClientRect();
        const fieldPos = gameField.getBoundingClientRect();
        
        // ボールを常にピッチャーの位置に初期化
        ball.style.left = '50%';
        ball.style.top = '50px';
        ball.style.transform = 'translate(-50%, -50%) scale(0.6)';
        ball.style.visibility = 'visible';
        ball.style.transition = 'none'; // トランジションをいったんリセット
        
        // 既存のクラスを削除
        ball.classList.remove('home-run');
        ball.classList.remove('ball-through');
        
        // ピッチャーのモーション
        pitcher.textContent = '🤾';
        
        setTimeout(() => {
            pitcher.textContent = '🧍';
            
            // ストライクゾーンの位置を取得
            const strikeZoneRect = strikeZone.getBoundingClientRect();
            
            // ランダムなターゲット位置を計算（ストライクゾーン内）
            const randomX = Math.random() * (strikeZoneRect.width * 0.8) - (strikeZoneRect.width * 0.4);
            const randomY = Math.random() * (strikeZoneRect.height * 0.8) - (strikeZoneRect.height * 0.4);
            
            const targetLeft = '50%';
            const targetTop = `${strikeZoneRect.top - fieldPos.top + strikeZoneRect.height/2 + randomY}px`;
            
            // ボールのトランジションを設定して投球
            requestAnimationFrame(() => {
                ball.style.transition = 'all 0.8s linear'; // 直線的な動き
                ball.style.transform = 'translate(-50%, -50%) scale(1)'; // 大きくなる
                ball.style.left = targetLeft;
                ball.style.top = targetTop;
                
                canSwing = true;
                
                // スイングしなかった場合（見逃し）
                setTimeout(() => {
                    if (canSwing) {
                        canSwing = false;
                        ballsLeft--;
                        updateUI();
                        resultMessageElement.textContent = '見逃し！';
                        
                        // ボールを通過させる
                        ball.style.transition = 'top 0.4s ease-in';
                        ball.style.top = `${fieldPos.height + 50}px`;
                        
                        // 次の投球
                        setTimeout(throwBall, 1000);
                    }
                }, 800);
            });
        }, 500);
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
        const clickX = e.clientX;
        const clickY = e.clientY;
        
        const ballCenterX = ballRect.left + ballRect.width/2;
        const ballCenterY = ballRect.top + ballRect.height/2;
        
        const distance = Math.sqrt(
            Math.pow(ballCenterX - clickX, 2) + 
            Math.pow(ballCenterY - clickY, 2)
        );

        if (distance < 60) { // ヒット判定を少し緩める
            // ホームラン！
            homeRunCount++;
            const homeRunDistance = calculateHomeRunDistance();
            ball.classList.add('home-run');
            resultMessageElement.textContent = `ホームラン！ ${homeRunDistance}m飛んだ！`;
        } else {
            // 空振り
            resultMessageElement.textContent = '空振り！';
            
            // ボールを通過させる
            const fieldRect = gameField.getBoundingClientRect();
            ball.style.transition = 'top 0.4s ease-in';
            ball.style.top = `${fieldRect.height + 50}px`;
        }

        updateUI();

        // 次の投球
        setTimeout(throwBall, 1200);
    }

    // ヒットエフェクト生成
    function createHitEffect(x, y) {
        const gameFieldRect = gameField.getBoundingClientRect();
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.textContent = '💥';
        effect.style.left = `${x - gameFieldRect.left}px`;
        effect.style.top = `${y - gameFieldRect.top}px`;
        
        gameField.appendChild(effect);
        
        setTimeout(() => {
            if (gameField.contains(effect)) {
                gameField.removeChild(effect);
            }
        }, 500);
    }

    // ホームランの距離を計算
    function calculateHomeRunDistance() {
        return Math.floor(80 + Math.random() * 70);
    }

    // UIの更新
    function updateUI() {
        ballsLeftElement.textContent = ballsLeft;
        homeRunCountElement.textContent = homeRunCount;
    }

    // ゲーム終了
    function endGame() {
        isGameActive = false;
        startButton.textContent = 'もう一度プレイ';
        startButton.disabled = false;
        
        // クリア条件: 3本以上のホームラン
        if (homeRunCount >= 3) {
            resultMessageElement.textContent = `ゲームクリア！ ${homeRunCount}本のホームランを打ちました！`;
        } else {
            resultMessageElement.textContent = `ゲームオーバー。${homeRunCount}本のホームランを打ちました。`;
        }
    }
});
