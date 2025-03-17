// ゲーム全体の処理
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
    const distanceMeter = document.querySelector('.distance-meter');
    const distanceValue = document.getElementById('distance-value');
    const fieldOverview = document.querySelector('.field-overview');
    const ballLanding = document.getElementById('ball-landing');
    const overviewDistance = document.getElementById('overview-distance');

    // 難易度設定 - 実際はパラメータ調整
    const settings = {
        ballSpeed: 2500, // ボールの速さ (ミリ秒) - 大きいほど遅い
        strikeZoneSize: 1.0, // ストライクゾーンの相対サイズ
        hitWindow: 600, // スイングのタイミング許容範囲 (ミリ秒)
        requiredHomeRuns: 3 // クリアに必要なホームラン数
    };

    // ゲーム変数
    let ballsLeft = 10;
    let homeRunCount = 0;
    let isGameActive = false;
    let canSwing = false;

    // フィールドのサイズを取得
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;

    // スタートボタンのイベントリスナー
    startButton.addEventListener('click', startGame);

    // ***修正1: ゲームフィールド全体のマウス移動を追跡***
    gameField.addEventListener('mousemove', (e) => {
        if (isGameActive) {
            // マウス位置にバットを移動
            const relativeX = e.clientX - gameField.getBoundingClientRect().left;
            
            // バットの位置を更新
            batter.style.left = `${relativeX}px`;
            batter.style.bottom = '50px';
            batter.style.transform = 'translateX(-50%)';
        }
    });

    // ***修正2: ゲームフィールド全体をクリック可能に***
    gameField.addEventListener('click', (e) => {
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
        if (fieldOverview) fieldOverview.style.display = 'none';
        
        // スコアボード更新
        const scoreboard = document.querySelector('.scoreboard-display');
        if (scoreboard) {
            scoreboard.textContent = 'PLAY BALL!';
        }

        // バットの初期位置設定
        batter.style.position = 'absolute';
        batter.style.bottom = '50px';
        batter.style.left = '50%';
        batter.style.transform = 'translateX(-50%)';
        batter.style.transition = 'none';

        // 最初の投球を開始
        throwBall();
    }

    // 投球関数
    function throwBall() {
        if (ballsLeft <= 0) {
            endGame();
            return;
        }

        // ボールを初期位置に設定
        ball.style.left = '50%';
        ball.style.bottom = '250px';
        ball.style.transform = 'translate(-50%, -50%) scale(0.8)';
        ball.style.visibility = 'visible';
        ball.style.transition = 'none';
        
        // 飛距離メーターを非表示
        if (distanceMeter) distanceMeter.style.display = 'none';
        
        // ピッチャーのモーション
        pitcher.textContent = '🤾';
        
        // ストライクゾーン内のランダムな位置を計算
        const zoneRect = strikeZone.getBoundingClientRect();
        const fieldRect = gameField.getBoundingClientRect();
        
        const zoneCenterX = zoneRect.left + zoneRect.width / 2 - fieldRect.left;
        const zoneCenterY = fieldRect.bottom - zoneRect.top - zoneRect.height / 2;
        
        const randomOffsetX = (Math.random() - 0.5) * zoneRect.width * 0.8;
        const randomOffsetY = (Math.random() - 0.5) * zoneRect.height * 0.8;
        
        const targetX = zoneCenterX + randomOffsetX;
        const targetY = zoneCenterY + randomOffsetY;
        
        setTimeout(() => {
            // ピッチャーの絵文字を戻す
            pitcher.textContent = '🧍';
            
            setTimeout(() => {
                // ボールを投げる - シンプルなアニメーション
                ball.style.transition = 'all 1.5s ease-out';
                ball.style.left = `${targetX}px`;
                ball.style.bottom = `${targetY}px`;
                
                canSwing = true;
                
                // スイング待機時間
                setTimeout(() => {
                    if (canSwing) {
                        // 見逃した場合
                        canSwing = false;
                        ballsLeft--;
                        updateUI();
                        
                        // ボールを通過させる
                        ball.style.transition = 'all 0.4s ease-in';
                        ball.style.bottom = '-50px';
                        
                        // 次の投球
                        setTimeout(throwBall, 1000);
                    }
                }, settings.hitWindow);
            }, 300);
        }, 400);
    }

    // ***修正3: スイング関数の改良 - ボールとバットの衝突判定の改善***
    function swing(e) {
        if (!canSwing) return;
        
        canSwing = false;

        // クリック位置にバットを移動
        const fieldRect = gameField.getBoundingClientRect();
        const clickX = e.clientX - fieldRect.left;
        
        // クリック位置にバットを移動
        batter.style.left = `${clickX}px`;
        
        // スイングアニメーション
        batter.classList.add('swing');
        setTimeout(() => {
            batter.classList.remove('swing');
        }, 300);

        // ボールの位置取得
        const ballRect = ball.getBoundingClientRect();
        const ballCenterX = ballRect.left + ballRect.width/2;
        const ballCenterY = ballRect.top + ballRect.height/2;
        
        // ボールの位置（ゲームフィールド内の相対座標）
        const ballPos = {
            x: ballCenterX - fieldRect.left,
            y: fieldRect.bottom - ballCenterY
        };
        
        // バットの位置（クリック位置）
        const batterPos = {
            x: clickX,
            y: 50
        };
        
        // バットとボールの距離を計算
        const distance = Math.sqrt(
            Math.pow(ballPos.x - batterPos.x, 2) + 
            Math.pow(ballPos.y - batterPos.y, 2)
        );
        
        // ヒットエフェクトをボールの位置に表示
        createHitEffect(ballCenterX, ballCenterY);
        
        // ***修正4: 当たり判定の距離を大きくして当てやすく***
        if (distance < 80) { // 距離を80pxに拡大
            // ホームラン
            homeRunCount++;
            ballsLeft--;
            const homeRunDistance = calculateHomeRunDistance();
            
            // 飛距離メーターを表示
            if (distanceMeter) {
                distanceMeter.style.display = 'block';
                distanceValue.textContent = homeRunDistance;
            }
                
            // スコアボード更新
            const scoreboard = document.querySelector('.scoreboard-display');
            if (scoreboard) {
                scoreboard.textContent = 'HOME RUN!';
            }
                
            // ホームランアニメーション
            animateHomeRun(homeRunDistance);
                
            resultMessageElement.textContent = `ホームラン！ ${homeRunDistance}m飛んだ！`;
        } else {
            // ファール
            ballsLeft--;
            const scoreboard = document.querySelector('.scoreboard-display');
            if (scoreboard) {
                scoreboard.textContent = 'FOUL!';
            }
            resultMessageElement.textContent = '空振り！';
            
            // ボールを通過させる
            ball.style.transition = 'all 0.4s ease-in';
            ball.style.left = `${ballPos.x + 100}px`;
            ball.style.bottom = '-50px';
            
            // 次の投球
            setTimeout(throwBall, 1200);
        }

        updateUI();
    }

    // ホームランアニメーション - シンプル化
    function animateHomeRun(distance) {
        // 角度と距離を計算
        const angle = Math.random() * 60 - 30;
        const angleRad = angle * Math.PI / 180;
        
        // ボールの飛距離を正規化
        const normalizedDistance = Math.min(distance / 150, 1);
        
        // シンプルなアニメーション
        ball.style.transition = 'all 1.5s ease-out';
        ball.style.left = `${fieldWidth/2 + normalizedDistance * 200 * Math.sin(angleRad)}px`;
        ball.style.bottom = `${250}px`;
        ball.style.transform = 'translate(-50%, -50%) scale(0.2)';
        
        // 1.5秒後にホームラン表示
        setTimeout(() => {
            ball.style.visibility = 'hidden';
            
            // ランディング地点の計算
            const landingX = 125 + Math.sin(angleRad) * normalizedDistance * 100;
            const landingY = 50 + normalizedDistance * 150;
            
            // 俯瞰図表示（3秒で自動的に閉じる）
            showFieldOverview(distance, landingX, landingY);
        }, 1500);
    }

    // フィールド俯瞰図を表示して自動で閉じる
    function showFieldOverview(distance, landingX, landingY) {
        if (!fieldOverview) return;
        
        fieldOverview.style.display = 'flex';
        
        // ランディング地点の表示
        if (ballLanding) {
            ballLanding.style.left = `${landingX}px`;
            ballLanding.style.top = `${landingY}px`;
        }
        
        if (overviewDistance) {
            overviewDistance.textContent = distance;
        }
        
        // 1.5秒後に自動で閉じる（短縮）
        setTimeout(() => {
            fieldOverview.style.display = 'none';
            // 次の投球へ
            setTimeout(throwBall, 300);
        }, 1500);
    }

    // ホームラン距離の計算
    function calculateHomeRunDistance() {
        // 80〜150mのランダムな飛距離
        const basePower = Math.random() * 70 + 80;
        return Math.floor(basePower);
    }

    // ヒットエフェクトの作成
    function createHitEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        effect.textContent = '💥';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        gameField.appendChild(effect);
        
        // エフェクトを一定時間後に削除
        setTimeout(() => {
            if (effect.parentNode === gameField) {
                gameField.removeChild(effect);
            }
        }, 500);
    }

    // UI更新関数
    function updateUI() {
        if (ballsLeftElement) {
            ballsLeftElement.textContent = ballsLeft;
        }
        if (homeRunCountElement) {
            homeRunCountElement.textContent = `${homeRunCount}/${settings.requiredHomeRuns}`;
        }
    }

    // ゲーム終了処理
    function endGame() {
        isGameActive = false;
        startButton.disabled = false;
        startButton.textContent = 'もう一度プレイ';
        
        // スコアボード更新
        const scoreboard = document.querySelector('.scoreboard-display');
        if (scoreboard) {
            if (homeRunCount >= settings.requiredHomeRuns) {
                scoreboard.textContent = 'GAME CLEAR!';
                resultMessageElement.textContent = `クリア！ ${homeRunCount}本のホームラン！`;
                resultMessageElement.style.color = '#4caf50';
            } else {
                scoreboard.textContent = 'GAME OVER';
                resultMessageElement.textContent = `残念！ クリアには${settings.requiredHomeRuns}本必要です`;
                resultMessageElement.style.color = '#f44336';
            }
        }
    }

    // 初期UI更新
    updateUI();
});
