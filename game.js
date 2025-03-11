document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startButton = document.getElementById('start-button');
    const ballsLeftElement = document.getElementById('balls-left');
    const homeRunCountElement = document.getElementById('home-run-count');
    const resultMessageElement = document.getElementById('result-message');
    const ball = document.getElementById('ball');
    const strikeZone = document.getElementById('strike-zone');
    const batter = document.getElementById('batter');
    const gameField = document.querySelector('.game-field');

    // ゲーム変数
    let ballsLeft = 10;
    let homeRunCount = 0;
    let isGameActive = false;
    let canSwing = false;
    let batterPosition = { x: 0, y: 0 }; // バットの現在位置
    let lastBallSpeed = 600; // 最後のボール速度（難易度調整用）

    // 効果音（実装オプション）
    // const hitSound = new Audio('hit.mp3');
    // const missSound = new Audio('miss.mp3');
    // const homeRunSound = new Audio('homerun.mp3');

    // スタートボタンのイベントリスナー
    startButton.addEventListener('click', startGame);

    // ストライクゾーンのマウスイベント
    strikeZone.addEventListener('mousemove', handleMouseMove);
    strikeZone.addEventListener('mouseenter', handleMouseEnter);
    strikeZone.addEventListener('mouseleave', handleMouseLeave);
    strikeZone.addEventListener('click', handleClick);

    // マウス移動でバットを追従させる
    function handleMouseMove(e) {
        if (!isGameActive) return;
        
        const rect = gameField.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const relativeY = e.clientY - rect.top;
        
        batterPosition = { x: relativeX, y: relativeY };
        updateBatterPosition();
    }

    // マウスが打撃エリアに入ったときの処理
    function handleMouseEnter() {
        if (!isGameActive) return;
        batter.style.opacity = '1';
    }

    // マウスが打撃エリアから出たときの処理
    function handleMouseLeave() {
        if (!isGameActive) return;
        batter.style.opacity = '0.5';
    }

    // クリックでスイング
    function handleClick(e) {
        if (!isGameActive || !canSwing) return;
        
        const rect = gameField.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const relativeY = e.clientY - rect.top;
        
        swing(relativeX, relativeY);
    }

    // バットの位置更新
    function updateBatterPosition() {
        batter.style.left = `${batterPosition.x}px`;
        batter.style.top = `${batterPosition.y}px`;
        batter.style.transform = 'translate(-50%, -50%)';
    }

    // ゲーム開始関数
    function startGame() {
        if (isGameActive) return;

        // ゲーム変数のリセット
        ballsLeft = 10;
        homeRunCount = 0;
        isGameActive = true;
        lastBallSpeed = 600; // 初期値にリセット
        
        updateUI();

        startButton.textContent = 'ゲーム中...';
        startButton.disabled = true;
        resultMessageElement.textContent = '';

        // バットの初期位置をリセット
        const strikeZoneRect = strikeZone.getBoundingClientRect();
        const gameFieldRect = gameField.getBoundingClientRect();
        
        batterPosition = {
            x: (strikeZoneRect.left + strikeZoneRect.width / 2) - gameFieldRect.left,
            y: (strikeZoneRect.top + strikeZoneRect.height / 2) - gameFieldRect.top + 50
        };
        
        batter.style.position = 'absolute';
        batter.style.opacity = '0.5';
        updateBatterPosition();

        // スタート演出
        resultMessageElement.textContent = '準備...';
        setTimeout(() => {
            resultMessageElement.textContent = '開始！';
            setTimeout(() => {
                resultMessageElement.textContent = '';
                // 最初の投球を開始
                throwBall();
            }, 500);
        }, 1000);
    }

    // 投球関数
    function throwBall() {
        if (ballsLeft <= 0) {
            endGame();
            return;
        }

        // ボールの位置をリセット
        const gameFieldRect = gameField.getBoundingClientRect();
        const centerX = gameFieldRect.width / 2;
        
        ball.style.left = `${centerX}px`;
        ball.style.top = '80px';
        ball.style.visibility = 'visible';
        ball.classList.remove('home-run');
        ball.classList.remove('foul-ball');
        ball.classList.remove('ball-through');

        // ストライクゾーンの位置を取得
        const strikeZoneRect = strikeZone.getBoundingClientRect();
        
        // ストライクゾーン内のランダムな位置を計算（より自然な分布）
        const randomOffsetX = (Math.random() - 0.5) * strikeZoneRect.width * 0.9;
        const randomOffsetY = (Math.random() - 0.5) * strikeZoneRect.height * 0.8;
        
        const targetX = (strikeZoneRect.left + strikeZoneRect.width / 2) - gameFieldRect.left + randomOffsetX;
        const targetY = (strikeZoneRect.top + strikeZoneRect.height / 2) - gameFieldRect.top + randomOffsetY;
        
        // 難易度に応じてボールスピードを調整（連続ヒットで速くなる）
        const ballSpeed = Math.max(400, lastBallSpeed - (homeRunCount * 30));
        lastBallSpeed = ballSpeed;
        
        // ピッチャーの投球モーション
        const pitcher = document.querySelector('.pitcher');
        pitcher.textContent = '🤾';
        
        setTimeout(() => {
            pitcher.textContent = '🧍';
            
            // ボールのアニメーション - ストライクゾーン内のランダムな位置に向かって投げる
            ball.style.left = `${targetX}px`;
            ball.style.top = `${targetY}px`;
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
                    setTimeout(throwBall, 800);
                }
            }, ballSpeed); // ボールが到達するまでの時間
        }, 300);
    }

    // スイング関数
    function swing(mouseX, mouseY) {
        canSwing = false;
        ballsLeft--;

        // バットをスイングするアニメーション
        batter.classList.add('swing');
        setTimeout(() => {
            batter.classList.remove('swing');
        }, 300);

        // ボールとバットの衝突判定
        const ballRect = ball.getBoundingClientRect();
        const gameFieldRect = gameField.getBoundingClientRect();

        // ボールの中心座標
        const ballCenterX = ballRect.left + ballRect.width / 2 - gameFieldRect.left;
        const ballCenterY = ballRect.top + ballRect.height / 2 - gameFieldRect.top;
        
        // バットとボールの距離を計算
        const distance = Math.sqrt(
            Math.pow(ballCenterX - mouseX, 2) + 
            Math.pow(ballCenterY - mouseY, 2)
        );

        // ヒットエフェクト表示（クリック位置）
        createHitEffect(mouseX, mouseY);

        // 近い距離にある場合はヒット成功
        if (distance < 70) {
            // ホームラン判定（中心に近いほどホームランになりやすい）
            const perfectHit = distance < 30;
            const goodHit = distance < 50;
            
            if (perfectHit || (goodHit && Math.random() > 0.3)) {
                // ホームラン！
                homeRunCount++;
                const homeRunDistance = calculateHomeRunDistance(distance);
                ball.classList.add('home-run');
                resultMessageElement.textContent = `ホームラン！ ${homeRunDistance}m飛んだ！`;
                // homeRunSound.play(); // 効果音
                
                // スコアアップ演出
                homeRunCountElement.style.color = '#ff4500';
                setTimeout(() => {
                    homeRunCountElement.style.color = '';
                }, 500);
            } else {
                // ファールまたはヒット
                const isFoul = Math.random() > 0.5;
                if (isFoul) {
                    ball.classList.add('foul-ball');
                    resultMessageElement.textContent = 'ファール！';
                } else {
                    ball.classList.add('ball-through');
                    ball.style.top = `${gameFieldRect.height + 50}px`;
                    resultMessageElement.textContent = 'ヒット！';
                }
                // hitSound.play(); // 効果音
            }
        } else {
            // 空振り
            resultMessageElement.textContent = '空振り！';
            // missSound.play(); // 効果音
            
            // ボールを通過させるアニメーション
            ball.classList.add('ball-through');
            ball.style.top = `${gameFieldRect.height + 50}px`;
        }

        updateUI();

        // 次の投球
        setTimeout(throwBall, 1000);
    }

    // ヒットエフェクト生成
    function createHitEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.textContent = '💥';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        gameField.appendChild(effect);
        
        // アニメーション終了後に要素を削除
        setTimeout(() => {
            gameField.removeChild(effect);
        }, 500);
    }

    // ホームランの距離を計算
    function calculateHomeRunDistance(hitDistance) {
        // ヒットの質に基づいて距離を計算
        const baseDistance = 100;
        const maxBonus = 80;
        const quality = Math.max(0, 1 - (hitDistance / 70));
        const bonus = Math.floor(maxBonus * quality);
        
        return baseDistance + bonus + Math.floor(Math.random() * 20);
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
            resultMessageElement.style.color = '#4caf50';
        } else {
            resultMessageElement.textContent = `ゲームオーバー。${homeRunCount}本のホームランを打ちました。`;
            resultMessageElement.style.color = '#f44336';
        }
        
        // 色を元に戻す
        setTimeout(() => {
            resultMessageElement.style.color = '';
        }, 2000);
    }

    // ウィンドウサイズ変更時の処理
    window.addEventListener('resize', () => {
        if (isGameActive) {
            // ストライクゾーンの位置を再計算
            const strikeZoneRect = strikeZone.getBoundingClientRect();
            const gameFieldRect = gameField.getBoundingClientRect();
            
            batterPosition = {
                x: (strikeZoneRect.left + strikeZoneRect.width / 2) - gameFieldRect.left,
                y: (strikeZoneRect.top + strikeZoneRect.height / 2) - gameFieldRect.top + 50
            };
            
            updateBatterPosition();
        }
    });
});
