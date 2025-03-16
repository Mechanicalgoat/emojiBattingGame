document.addEventListener('DOMContentLoaded', () => {
    // グローバル変数として必要な関数を公開
    window.initGame = initGame;

    // ゲーム初期化関数
    function initGame() {
        // DOM要素の取得（メニューシステムから復元後に呼び出されることを考慮）
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

        // 難易度設定をグローバル変数から取得
        const settings = window.difficultySettings ? window.difficultySettings[window.currentDifficulty || 'normal'] : {
            ballSpeed: 1500,
            strikeZoneSize: 1.0,
            hitWindow: 400,
            requiredHomeRuns: 3
        };

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
                // 難易度に基づいて異なるピッチャー絵文字を使用
                const pitcherEmoji = window.difficultySettings ? 
                    window.difficultySettings[window.currentDifficulty].pitcherEmoji : '🧍';
                pitcher.textContent = pitcherEmoji;
                
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
            
            // アニメーション開始
            animateStep(0);
        }

        // ホームラン距離の計算
        function calculateHomeRunDistance() {
            // 難易度と乱数を組み合わせて飛距離を計算
            const basePower = Math.random() * 70 + 80; // 80〜150mのベース飛距離
            // 難しいほど飛距離が出る確率が高い（上級者向け）
            const difficultyBonus = (window.currentDifficulty === 'hard') ? 20 : 
                                   (window.currentDifficulty === 'easy') ? -10 : 0;
            
            return Math.floor(basePower + difficultyBonus);
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
                gameField.removeChild(effect);
            }, 500);
        }

        // UI更新関数
        function updateUI() {
            // 必要なホームラン数（難易度による）
            const requiredHomeRuns = settings.requiredHomeRuns || 3;
            
            if (ballsLeftElement) ballsLeftElement.textContent = ballsLeft;
            if (homeRunCountElement) homeRunCountElement.textContent = homeRunCount + '/' + requiredHomeRuns;
        }

        // ゲーム終了処理
        function endGame() {
            isGameActive = false;
            startButton.disabled = false;
            startButton.textContent = 'もう一度プレイ
