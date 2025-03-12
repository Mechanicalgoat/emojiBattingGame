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
            batter.style.top = `${e.clientY - gameField.getBoundingClientRect().top}px`;
            batter.style.transform = 'translate(-50%, -50%)';
        }
    });

    strikeZone.addEventListener('click', (e) => {
        if (isGameActive && canSwing) {
            swing(e);
        }
    });

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

        // バットの初期位置
        batter.style.position = 'absolute';
        batter.style.bottom = '120px';
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
        ball.style.top = '70px';
        ball.style.transform = 'translate(-50%, -50%)';
        ball.style.visibility = 'visible';
        ball.style.transition = 'none';
        
        // クラスをリセット
        ball.classList.remove('home-run');
        ball.classList.remove('ball-through');
        
        // ピッチャーのモーション
        pitcher.textContent = '🤾';
        
        setTimeout(() => {
            pitcher.textContent = '🧍';
            
            // ストライクゾーン内のランダムな位置を計算
            const zoneRect = strikeZone.getBoundingClientRect();
            const fieldRect = gameField.getBoundingClientRect();
            
            // ターゲット位置を計算（ストライクゾーンの中心から少しランダムにずらす）
            const zoneCenterX = zoneRect.left + zoneRect.width / 2 - fieldRect.left;
            const zoneCenterY = zoneRect.top + zoneRect.height / 2 - fieldRect.top;
            
            const randomOffsetX = (Math.random() - 0.5) * zoneRect.width * 0.8;
            const randomOffsetY = (Math.random() - 0.5) * zoneRect.height * 0.8;
            
            const targetX = zoneCenterX + randomOffsetX;
            const targetY = zoneCenterY + randomOffsetY;
            
            // ボールを投げる
            setTimeout(() => {
                ball.style.transition = 'left 0.8s linear, top 0.8s linear';
                ball.style.left = `${targetX}px`;
                ball.style.top = `${targetY}px`;
                
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
                        ball.style.top = `${fieldRect.height + 50}px`;
                        
                        // 次の投球
                        setTimeout(throwBall, 1000);
                    }
                }, 800);
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

        if (distance < 70) { // より広いヒット判定
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
        const rect = gameField.getBoundingClientRect();
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.textContent = '💥';
        effect.style.left = `${x - rect.left}px`;
        effect.style.top = `${y - rect.top}px`;
        
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
