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
        requiredHomeRuns: 3, // クリアに必要なホームラン数
        hitDistance: 50 // ミート判定の距離（小さいほど厳しい）
    };

    // ゲーム変数
    let ballsLeft = 10;
    let homeRunCount = 0;
    let isGameActive = false;
    let isBallInPlay = false;  // ボールが投げられているかどうか
    let isBallVisible = false; // ボールが見えるかどうか
    let ballPosition = { x: 0, y: 0 }; // ボールの現在位置
    let lastSwingTime = 0;     // 最後のスイング時間
    let swingEffects = [];     // スイングエフェクトの配列
    let batterPosition = { x: 0, y: 50 }; // バッターの位置
    let batterMovableRange = { min: 0, max: 0 }; // バッターの可動範囲
    let ballAtStrikeZone = false; // ボールがストライクゾーンに到達したかどうか

    // フィールドのサイズを取得
    const fieldRect = gameField.getBoundingClientRect();
    const fieldWidth = fieldRect.width;
    const fieldHeight = fieldRect.height;

    // カスタムCSSをhead内に追加
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes swingFromBase {
            0% { transform: translateX(-10px) rotate(-45deg); transform-origin: bottom right; }
            40% { transform: translateX(0px) rotate(45deg); transform-origin: bottom right; }
            100% { transform: translateX(0px) rotate(0deg); transform-origin: bottom right; }
        }
        
        .swing-effect {
            position: absolute;
            font-size: 40px;
            z-index: 10;
            pointer-events: none;
            transform-origin: bottom right;
            animation: swingFromBase 0.15s ease-out forwards;
        }
    `;
    document.head.appendChild(styleElement);

    // スタートボタンのイベントリスナー
    startButton.addEventListener('click', startGame);

    // ゲームフィールド全体のマウス移動を追跡
    gameField.addEventListener('mousemove', (e) => {
        if (isGameActive) {
            // マウス位置にバットを移動
            const fieldRect = gameField.getBoundingClientRect();
            const relativeX = e.clientX - fieldRect.left;
            
            // バットの位置を更新 (可動範囲内に制限)
            const clampedX = Math.max(batterMovableRange.min, Math.min(batterMovableRange.max, relativeX));
            batter.style.left = `${clampedX}px`;
            batter.style.bottom = '50px';
            batter.style.transform = 'translateX(-50%)';
            
            // バッターの位置を記録
            batterPosition.x = clampedX;
        }
    });

    // ゲームフィールド全体をクリック可能に
    gameField.addEventListener('click', (e) => {
        if (isGameActive) {
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
        isBallInPlay = false;
        lastSwingTime = 0;
        swingEffects = [];
        ballAtStrikeZone = false;
        
        // バッターの可動範囲を設定（フィールド幅の10%〜90%）
        batterMovableRange.min = fieldWidth * 0.1;
        batterMovableRange.max = fieldWidth * 0.9;
        
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
        
        // バッターポジションを更新
        batterPosition.x = fieldWidth / 2;

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
        
        // ボール状態を更新
        isBallInPlay = true;
        isBallVisible = true;
        ballAtStrikeZone = false;
        
        // 飛距離メーターを非表示
        if (distanceMeter) distanceMeter.style.display = 'none';
        
        // ピッチャーのモーション
        pitcher.textContent = '🤾';
        
        // ランダムな位置を計算（フィールド幅の15%〜85%）
        const minX = fieldWidth * 0.15;
        const maxX = fieldWidth * 0.85;
        const targetX = minX + Math.random() * (maxX - minX);
        
        // Y座標はバッターの高さに近い位置
        const targetY = 50 + Math.random() * 30;
        
        setTimeout(() => {
            // ピッチャーの絵文字を戻す
            pitcher.textContent = '🧍';
            
            setTimeout(() => {
                // ボールを投げる - シンプルなアニメーション
                ball.style.transition = 'all 1.5s ease-out';
                ball.style.left = `${targetX}px`;
                ball.style.bottom = `${targetY}px`;
                
                // ボールの現在位置を継続的に更新するアニメーションフレーム
                function updateBallPosition() {
                    if (isBallVisible) {
                        const ballRect = ball.getBoundingClientRect();
                        const fieldRect = gameField.getBoundingClientRect();
                        
                        ballPosition.x = ballRect.left + ballRect.width/2 - fieldRect.left;
                        ballPosition.y = fieldRect.bottom - (ballRect.top + ballRect.height/2);
                        
                        // ボールがストライクゾーンの高さ付近に達したか確認
                        // ストライクゾーンの高さは約50px
                        if (ballPosition.y <= 70 && ballPosition.y >= 30) {
                            ballAtStrikeZone = true;
                        }
                        
                        requestAnimationFrame(updateBallPosition);
                    }
                }
                updateBallPosition();
                
                // ボールが通過するタイミングでの見逃し判定（投球完了後）
                setTimeout(() => {
                    // ボールがバッターの横を通過した後に判定
                    if (isBallInPlay && isBallVisible) {
                        // 見逃した場合
                        isBallInPlay = false;
                        ballsLeft--;
                        updateUI();
                        
                        // ボールを通過させる
                        ball.style.transition = 'all 0.3s ease-in';
                        ball.style.bottom = '-50px';
                        
                        // 結果表示
                        if (ballAtStrikeZone) {
                            resultMessageElement.textContent = '見逃し！';
                        } else {
                            resultMessageElement.textContent = 'ボール！';
                        }
                        
                        // 次の投球
                        setTimeout(() => {
                            isBallVisible = false;
                            throwBall();
                        }, 1000);
                    }
                }, settings.ballSpeed); // 投球アニメーション完了後に判定
            }, 300);
        }, 400);
    }

    // スイング関数 - バットを根本から振るように修正
    function swing(e) {
        const now = Date.now();
        // 前回のスイングから最低10ミリ秒経過していれば新しいスイングを許可
        if (now - lastSwingTime < 10) return;
        lastSwingTime = now;
        
        // クリック位置を取得
        const fieldRect = gameField.getBoundingClientRect();
        const clickX = e.clientX - fieldRect.left;
        
        // バットの可動範囲内に制限
        const clampedX = Math.max(batterMovableRange.min, Math.min(batterMovableRange.max, clickX));
        
        // バットの移動（クリック位置に移動）
        batter.style.left = `${clampedX}px`;
        batterPosition.x = clampedX;
        
        // スイングエフェクトを作成 - 根本から振る
        const swingEffect = document.createElement('div');
        swingEffect.className = 'swing-effect';
        swingEffect.textContent = '🏏';
        swingEffect.style.left = `${batterPosition.x}px`;
        swingEffect.style.bottom = '50px';
        gameField.appendChild(swingEffect);
        swingEffects.push(swingEffect);
        
        // スイングエフェクトを一定時間後に削除
        setTimeout(() => {
            if (swingEffect.parentNode === gameField) {
                gameField.removeChild(swingEffect);
                swingEffects = swingEffects.filter(effect => effect !== swingEffect);
            }
        }, 150);

        // ボールが投げられていない場合はスイングのみ
        if (!isBallInPlay || !isBallVisible) {
            resultMessageElement.textContent = 'まだボールがありません！';
            return;
        }
        
        // バットとボールの距離を計算
        const distance = Math.sqrt(
            Math.pow(ballPosition.x - batterPosition.x, 2) + 
            Math.pow(ballPosition.y - batterPosition.y, 2)
        );
        
        // ボールの現在位置を取得（表示用）
        const ballRect = ball.getBoundingClientRect();
        const ballCenterX = ballRect.left + ballRect.width/2;
        const ballCenterY = ballRect.top + ballRect.height/2;
        
        // ヒットエフェクトをボールの位置に表示
        createHitEffect(ballCenterX, ballCenterY);
        
        // バットの適切な高さにボールがあるか確認（バッターの高さ±30px）
        const isAtRightHeight = Math.abs(ballPosition.y - 50) <= 30;
        
        // ミート判定をより厳しく設定
        if (distance < settings.hitDistance && isAtRightHeight) { // 距離を50pxに設定（より厳しい）
            // ボールプレイを終了
            isBallInPlay = false;
            
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
        } else if (distance < 100 && isAtRightHeight) { // 近くにはあるがミートしていない
            // ファール
            isBallInPlay = false;
            ballsLeft--;
            
            const scoreboard = document.querySelector('.scoreboard-display');
            if (scoreboard) {
                scoreboard.textContent = 'FOUL!';
            }
            resultMessageElement.textContent = 'ファール！';
            
            // ボールを通過させる
            ball.style.transition = 'all 0.4s ease-in';
            ball.style.left = `${ballPosition.x + 100}px`;
            ball.style.bottom = '-50px';
            
            // 次の投球
            setTimeout(() => {
                isBallVisible = false;
                throwBall();
            }, 1200);
        } else {
            // 空振り（ボールに全く近づいていない場合）
            // ボールはそのまま進む
            resultMessageElement.textContent = '空振り！';
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
            isBallVisible = false;
            
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
        isBallInPlay = false;
        isBallVisible = false;
        
        // 残っているスイングエフェクトをすべて削除
        swingEffects.forEach(effect => {
            if (effect.parentNode === gameField) {
                gameField.removeChild(effect);
            }
        });
        swingEffects = [];
        
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

    // キーボード入力でもスイングできるようにする
    document.addEventListener('keydown', (e) => {
        if (isGameActive && (e.code === 'Space' || e.code === 'Enter')) {
            // バッターの現在位置でスイング
            const mockEvent = {
                clientX: batterPosition.x + gameField.getBoundingClientRect().left
            };
            swing(mockEvent);
        }
    });

    // 初期UI更新
    updateUI();
});
