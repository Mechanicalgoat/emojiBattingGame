document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startButton = document.getElementById('start-button');
    const ballsLeftElement = document.getElementById('balls-left');
    const homeRunCountElement = document.getElementById('home-run-count');
    const resultMessageElement = document.getElementById('result-message');
    const ball = document.getElementById('ball');
    const strikeZone = document.getElementById('strike-zone');

    // ゲーム変数
    let ballsLeft = 10;
    let homeRunCount = 0;
    let isGameActive = false;
    let canSwing = false;

    // ボールの初期位置設定 (ピッチャー位置)
    let ballX = window.innerWidth / 2;
    let ballY = 70;

    // スタートボタンのイベントリスナー
    startButton.addEventListener('click', startGame);

    // ストライクゾーンのクリックイベントリスナー
    strikeZone.addEventListener('click', () => {
        if (isGameActive && canSwing) {
            swing();
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

        // 最初の投球を開始
        throwBall();
    }

    // 投球関数
    function throwBall() {
        if (ballsLeft <= 0) {
            endGame();
            return;
        }

        // ボールの位置をリセット
        ball.style.left = '50%';
        ball.style.top = '70px';
        ball.style.visibility = 'visible';
        ball.classList.remove('home-run');

        // ランダムなストライクゾーン内の位置を計算
        const strikeZoneRect = strikeZone.getBoundingClientRect();
        const targetX = strikeZoneRect.left + Math.random() * strikeZoneRect.width;
        const targetY = strikeZoneRect.top + Math.random() * strikeZoneRect.height;

        // ボールのアニメーション
        setTimeout(() => {
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
                    
                    // 次の投球
                    setTimeout(throwBall, 1000);
                }
            }, 1500); // ボールが到達するまでの時間
        }, 500);
    }

    // スイング関数
    function swing() {
        canSwing = false;
        ballsLeft--;

        // ボールとバットの衝突判定
        const strikeZoneRect = strikeZone.getBoundingClientRect();
        const ballRect = ball.getBoundingClientRect();

        // ストライクゾーン内にボールがあるかチェック
        if (
            ballRect.left >= strikeZoneRect.left &&
            ballRect.right <= strikeZoneRect.right &&
            ballRect.top >= strikeZoneRect.top &&
            ballRect.bottom <= strikeZoneRect.bottom
        ) {
            // ホームラン！
            homeRunCount++;
            const distance = calculateHomeRunDistance();
            ball.classList.add('home-run');
            resultMessageElement.textContent = `ホームラン！ ${distance}m飛んだ！`;
        } else {
            // 空振り
            resultMessageElement.textContent = '空振り！';
        }

        updateUI();

        // 次の投球
        setTimeout(throwBall, 1500);
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
