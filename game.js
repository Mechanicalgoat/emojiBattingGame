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
    let isBatFollowing = false; // バットがマウスに追従するかどうか

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
        }
    });

    strikeZone.addEventListener('mousemove', (e) => {
        if (isGameActive && isBatFollowing) {
            // マウス位置にバットを追従させる
            updateBatterPosition(e);
        }
    });

    strikeZone.addEventListener('click', (e) => {
        if (isGameActive && canSwing) {
            swing(e);
        }
    });

    // バットの位置を更新する関数
    function updateBatterPosition(e) {
        const rect = gameField.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        batter.style.left = `${x}px`;
        batter.style.top = `${y}px`;
        batter.style.transform = 'translate(-50%, -50%)';
        batter.style.bottom = 'auto';
        batter.style.right = 'auto';
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

        // 最初の投球を開始
        throwBall();
    }

    // 投球関数
    function throwBall() {
        if (ballsLeft <= 0) {
            endGame();
            return;
        }

        // ボールの初期位置を設定 (ピッチャーの位置、奥から手前へ)
        ball.style.left = '50%';
        ball.style.top = '50px';
        ball.style.transform = 'translate(-50%, -50%) scale(0.5)'; // 遠くにいるように小さく表示
        ball.style.visibility = 'visible';
        ball.classList.remove('home-run');
        ball.classList.remove('ball-through');

        // ピッチャーの投球モーション
        pitcher.classList.add('pitching');
        setTimeout(() => {
            pitcher.classList.remove('pitching');
        }, 300);

        // ストライクゾーンの位置を取得
        const strikeZoneRect = strikeZone.getBoundingClientRect();
        const gameFieldRect = gameField.getBoundingClientRect();
        
        // ストライクゾーン内のランダムな位置を計算
        const randomOffsetX = (Math.random() - 0.5) * strikeZoneRect.width * 0.7;
        const randomOffsetY = (Math.random() - 0.5) * strikeZoneRect.height * 0.7;
        
        const targetX = (strikeZoneRect.left + strikeZoneRect.width / 2) - gameFieldRect.left + randomOffsetX;
        const targetY = (strikeZoneRect.top + strikeZoneRect.height / 2) - gameFieldRect.top + randomOffsetY;
        
        // ボールを投げるアニメーション - 奥から手前へ、サイズも大きくなる
        setTimeout(() => {
            ball.style.transition = 'all 0.8s cubic-bezier(0.2, 0, 0.8, 1)';
            ball.style.left = `${targetX}px`;
            ball.style.top = `${targetY}px`;
            ball.style.transform = 'translate(-50%, -50%) scale(1)'; // 近づくにつれて大きくなる
            canSwing = true;

            // スイングしなかった場合 (見逃し)
            setTimeout(() => {
                if (canSwing) {
                    canSwing = false;
                    ballsLeft--;
                    updateUI();
                    resultMessageElement.textContent = '見逃し！';
                    
                    // ボールを通過させるアニメーション
                    ball.classList.add('ball-through');
                    ball.style.top = `${gameFieldRect.height + 50}px`;
                    
                    // 次の投球
                    setTimeout(throwBall, 1000);
                }
            }, 800); // ボールが到達するまでの時間
        }, 300);
    }

    // スイング関数
    function swing(e) {
        if (!canSwing) return;
        canSwing = false;
        ballsLeft--;

        // バットをスイングするアニメーション
        batter.classList.add('swing');
        setTimeout(() => {
            batter.classList.remove('swing');
        }, 300);

        // ヒットエフェクト表示
        createHitEffect(e.clientX, e.clientY);

        // ボールとクリック位置の衝突判定
        const ballRect = ball.getBoundingClientRect();
        const gameFieldRect = gameField.getBoundingClientRect();
        const clickX = e.clientX - gameFieldRect.left;
        const clickY = e.clientY - gameFieldRect.top;
        
        // ボールの中心座標
        const ballCenterX = ballRect.left + ballRect.width / 2 - gameFieldRect.left;
        const ballCenterY = ballRect.top + ballRect.height / 2 - gameFieldRect.top;
        
        // クリック位置とボールの距離を計算
        const distance = Math.sqrt(
            Math.pow(ballCenterX - clickX, 2) + 
            Math.pow(ballCenterY - clickY, 2)
        );

        // 近い距離にある場合はヒット成功
        if (distance < 50) {
            // ホームラン！
            homeRunCount++;
            const homeRunDistance = calculateHomeRunDistance();
            ball.classList.add('home-run');
            resultMessageElement.textContent = `ホームラン！ ${homeRunDistance}m飛んだ！`;
        } else {
            // 空振り
            resultMessageElement.textContent = '空振り！';
            
            // ボールを通過させるアニメーション
            ball.classList.add('ball-through');
            ball.style.top = `${gameFieldRect.height + 50}px`;
        }

        updateUI();

        // 次の投球
        setTimeout(throwBall, 1200);
    }

    // ヒットエフェクト生成
    function createHitEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.textContent = '💥';
        
        const gameFieldRect = gameField.getBoundingClientRect();
        effect.style.left = `${x - gameFieldRect.left}px`;
        effect.style.top = `${y - gameFieldRect.top}px`;
        
        gameField.appendChild(effect);
        
        // アニメーション終了後に要素を削除
        setTimeout(() => {
            gameField.removeChild(effect);
        }, 500);
    }

    // ホームランの距離を計算
    function calculateHomeRunDistance() {
        // ランダムな距離を生成 (80〜150m)
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
