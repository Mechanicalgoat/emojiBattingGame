document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startButton = document.getElementById('start-button');
    const ballsLeftElement = document.getElementById('balls-left');
    const homeRunCountElement = document.getElementById('home-run-count');
    const resultMessageElement = document.getElementById('result-message');
    const ball = document.getElementById('ball');
    const strikeZone = document.getElementById('strike-zone');
    const batter = document.querySelector('.batter'); // バッター要素を取得

    // ゲーム変数
    let ballsLeft = 10;
    let homeRunCount = 0;
    let isGameActive = false;
    let canSwing = false;
    let isBatFollowing = false; // バットがマウスに追従しているかのフラグ

    // スタートボタンのイベントリスナー
    startButton.addEventListener('click', startGame);

    // ストライクゾーンのマウスイベント
    strikeZone.addEventListener('mouseenter', () => {
        if (isGameActive) {
            isBatFollowing = true; // マウスがエリアに入ったらバットが追従する
        }
    });

    strikeZone.addEventListener('mouseleave', () => {
        isBatFollowing = false; // マウスがエリアから出たらバットの追従を停止
    });

    strikeZone.addEventListener('mousemove', (e) => {
        if (isGameActive && isBatFollowing) {
            // バットの位置をマウスに追従させる
            updateBatterPosition(e.clientX, e.clientY);
        }
    });

    strikeZone.addEventListener('click', (e) => {
        if (isGameActive && canSwing) {
            // クリックでスイング
            swing(e.clientX, e.clientY);
        }
    });

    // バットの位置更新関数
    function updateBatterPosition(mouseX, mouseY) {
        const gameFieldRect = document.querySelector('.game-field').getBoundingClientRect();
        const relativeX = mouseX - gameFieldRect.left;
        const relativeY = mouseY - gameFieldRect.top;
        
        // バットの位置をマウス位置に設定（少し調整）
        batter.style.left = `${relativeX - 20}px`;
        batter.style.top = `${relativeY - 20}px`;
        batter.style.position = 'absolute';
        batter.style.transform = 'none'; // 既存の変換をリセット
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
        batter.style.position = 'absolute';
        batter.style.bottom = '50px';
        batter.style.right = '100px';
        batter.style.left = 'auto';
        batter.style.top = 'auto';

        // 最初の投球を開始
        throwBall();
    }

    // 投球関数
    function throwBall() {
        if (ballsLeft <= 0) {
            endGame();
            return;
        }

        // ボールの位置をリセット - 常に画面中央から投げる
        const gameFieldRect = document.querySelector('.game-field').getBoundingClientRect();
        const centerX = gameFieldRect.width / 2;
        
        ball.style.left = `${centerX}px`;
        ball.style.top = '70px';
        ball.style.visibility = 'visible';
        ball.classList.remove('home-run');

        // ストライクゾーンの位置を取得
        const strikeZoneRect = strikeZone.getBoundingClientRect();
        const strikeZoneCenterX = (strikeZoneRect.left + strikeZoneRect.right) / 2 - gameFieldRect.left;
        const strikeZoneCenterY = (strikeZoneRect.top + strikeZoneRect.bottom) / 2 - gameFieldRect.top;
        
        // ボールのアニメーション - 常にストライクゾーンの中心に向かって投げる
        setTimeout(() => {
            ball.style.left = `${strikeZoneCenterX}px`;
            ball.style.top = `${strikeZoneCenterY}px`;
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
    function swing(mouseX, mouseY) {
        canSwing = false;
        ballsLeft--;

        // バットをスイングするアニメーション（クラスを追加して実装）
        batter.classList.add('swing');
        setTimeout(() => {
            batter.classList.remove('swing');
        }, 300);

        // ボールとバットの衝突判定
        const ballRect = ball.getBoundingClientRect();
        const batterRect = batter.getBoundingClientRect();

        // バットとボールの距離を計算
        const ballCenterX = ballRect.left + ballRect.width / 2;
        const ballCenterY = ballRect.top + ballRect.height / 2;
        const batterCenterX = batterRect.left + batterRect.width / 2;
        const batterCenterY = batterRect.top + batterRect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(ballCenterX - batterCenterX, 2) + 
            Math.pow(ballCenterY - batterCenterY, 2)
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
