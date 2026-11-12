
let standImg; // 宣告站立動畫圖片
let kickImg; // 宣告踢腿動畫圖片
let crouchImg; // 宣告蹲下動畫圖片

let playerX = 0; // 宣告角色水平位置
let playerY = 0; // 宣告角色腳底位置
let velocityY = 0; // 宣告角色垂直速度

let moveSpeed = 5; // 設定角色水平移動速度
let jumpPower = -17; // 設定角色跳躍力量
let gravity = 0.7; // 設定角色重力加速度

let facingRight = true; // 設定角色預設面向右方
let isJumping = false; // 記錄角色是否正在跳躍
let isAttacking = false; // 記錄角色是否正在踢腿
let isBlocking = false; // 記錄角色是否正在防禦

let currentAction = "stand"; // 設定目前角色動作
let currentFrame = 0; // 設定目前動畫影格
let lastFrameTime = 0; // 記錄上次影格切換時間

let imageStatus = {}; // 儲存圖片載入狀態
let particles = []; // 建立粒子特效陣列
let projectiles = []; // 建立能量球陣列

const wallSize = 8; // 設定牆壁厚度

function preload() { // 預先載入角色圖片
  loadCharacterImage("stand", "start/100007.png"); // 載入站立動畫
  loadCharacterImage("kick", "magic/10.png"); // 載入踢腿動畫
  loadCharacterImage("crouch", "stop/10.png"); // 載入蹲下動畫
} // 結束預載函式

function loadCharacterImage(type, path) { // 建立圖片載入函式
  imageStatus[type] = "loading"; // 設定圖片為載入中
  let img = loadImage(path, () => { imageStatus[type] = "ready"; }, () => { imageStatus[type] = "error"; console.error("找不到圖片：" + path); }); // 載入圖片並檢查結果
  if (type === "stand") standImg = img; // 儲存站立圖片
  if (type === "kick") kickImg = img; // 儲存踢腿圖片
  if (type === "crouch") crouchImg = img; // 儲存蹲下圖片
} // 結束圖片載入函式

function setup() { // 初始化遊戲
  createCanvas(windowWidth, windowHeight); // 建立全螢幕畫布
  frameRate(60); // 設定每秒60個畫面
  pixelDensity(1); // 設定像素密度
  noSmooth(); // 保持像素角色清晰
  imageMode(CORNER); // 設定圖片繪製基準
  playerX = width * 2 / 3; // 設定角色位於畫布三分之二處
  playerY = height; // 設定角色腳底位於畫布底端
} // 結束初始化函式

function draw() { // 持續更新遊戲畫面
  background(135, 206, 235); // 設定天空藍色背景
  drawWalls(); // 繪製左右牆壁

  if (imageStatus.stand !== "ready") { // 檢查站立圖片是否成功載入
    drawLoadMessage("站立圖片未載入：start/100007.png"); // 顯示錯誤訊息
    return; // 暫停繪製角色
  } // 結束圖片檢查

  updateMovement(); // 更新角色左右移動
  updateJump(); // 更新跳躍與重力
  updateAnimation(); // 更新角色動畫
  updateProjectiles(); // 更新能量球
  updateParticles(); // 更新粒子效果

  drawShadow(); // 繪製角色陰影
  drawPlayer(); // 繪製角色精靈
  drawProjectiles(); // 繪製藍色能量球
  drawParticles(); // 繪製粒子特效
  drawShield(); // 繪製防禦護盾
  drawInstructions(); // 顯示操作說明
} // 結束主畫面函式

function getSprite() { // 取得目前角色圖片與影格數
  if (currentAction === "kick" && imageStatus.kick === "ready") return { img: kickImg, frames: 6 }; // 使用六格踢腿動畫
  if (currentAction === "crouch" && imageStatus.crouch === "ready") return { img: crouchImg, frames: 3 }; // 使用三格蹲下動畫
  return { img: standImg, frames: 6 }; // 預設使用六格站立動畫
} // 結束圖片選擇函式

function getPlayerSize(sprite = getSprite()) { // 計算角色顯示尺寸
  let frameWidth = sprite.img.width / sprite.frames; // 計算單格原始寬度
  let frameHeight = sprite.img.height; // 取得單格原始高度
  let displayHeight = height / 3; // 設定角色高度為畫布三分之一
  let displayWidth = frameWidth * displayHeight / frameHeight; // 等比例計算角色寬度
  return { w: displayWidth, h: displayHeight }; // 回傳角色尺寸
} // 結束尺寸計算函式

function changeAction(action) { // 切換角色動畫
  if (currentAction === action) return; // 相同動作不重新切換
  currentAction = action; // 設定新的角色動作
  currentFrame = 0; // 從第一格重新開始
  lastFrameTime = millis(); // 重設動畫計時器
} // 結束動畫切換函式

function updateMovement() { // 更新角色移動
  let left = keyIsDown(LEFT_ARROW) || keyIsDown(65); // 偵測左鍵或A鍵
  let right = keyIsDown(RIGHT_ARROW) || keyIsDown(68); // 偵測右鍵或D鍵
  let down = keyIsDown(DOWN_ARROW) || keyIsDown(83); // 偵測下鍵或S鍵

  isBlocking = keyIsDown(75) && !isAttacking && !isJumping; // 判斷是否正在防禦

  let movement = 0; // 設定預設水平移動量

  if (!isAttacking && !isBlocking && !down) { // 攻擊、防禦與蹲下時不允許移動
    if (left && !right) { // 偵測向左移動
      movement = -moveSpeed; // 設定向左速度
      facingRight = false; // 設定面向左方
    } // 結束向左移動判斷

    if (right && !left) { // 偵測向右移動
      movement = moveSpeed; // 設定向右速度
      facingRight = true; // 設定面向右方
    } // 結束向右移動判斷
  } // 結束移動判斷

  if (!isAttacking) { // 確認目前沒有踢腿
    if (down && !isJumping && !isBlocking) { // 判斷是否蹲下
      changeAction("crouch"); // 切換蹲下動畫
    } else { // 其他情況
      changeAction("stand"); // 恢復站立動畫
    } // 結束蹲下判斷
  } // 結束動作更新

  playerX += movement; // 更新角色水平位置

  let size = getPlayerSize(); // 取得角色目前尺寸
  let minX = wallSize + size.w / 2; // 計算左牆碰撞邊界
  let maxX = width - wallSize - size.w / 2; // 計算右牆碰撞邊界

  if (maxX >= minX) { // 確認角色可以放進畫布
    let oldX = playerX; // 記錄碰撞修正前的位置
    playerX = constrain(playerX, minX, maxX); // 限制角色不能穿牆
    if (oldX !== playerX && movement !== 0 && frameCount % 12 === 0) { // 判斷是否碰到牆壁
      createParticles(playerX, playerY - size.h / 2, 8); // 產生撞牆粒子
    } // 結束撞牆特效判斷
  } else { // 畫布過窄時
    playerX = width / 2; // 將角色置中
  } // 結束碰撞判斷

  if (movement !== 0 && !isJumping && frameCount % 8 === 0) { // 判斷角色是否在地面移動
    createParticles(playerX, height - 5, 2); // 產生腳底灰塵
  } // 結束移動灰塵判斷
} // 結束角色移動函式

function updateJump() { // 更新跳躍效果
  if (!isJumping) return; // 沒有跳躍就停止執行

  velocityY += gravity; // 加入重力加速度
  playerY += velocityY; // 更新角色垂直位置

  if (playerY >= height) { // 判斷角色是否碰到地面
    playerY = height; // 將角色固定在地板
    velocityY = 0; // 清除垂直速度
    isJumping = false; // 結束跳躍狀態
    createParticles(playerX, height - 5, 15); // 產生落地粒子
  } // 結束落地判斷
} // 結束跳躍函式

function updateAnimation() { // 更新角色圖片精靈動畫
  let sprite = getSprite(); // 取得目前角色圖片
  let interval = isAttacking ? 110 : 130; // 設定踢腿與站立動畫速度

  if (millis() - lastFrameTime < interval) return; // 未達切換時間則停止

  lastFrameTime = millis(); // 更新影格計時器

  if (isAttacking) { // 判斷角色是否正在踢腿
    if (currentFrame < 5) { // 判斷是否尚未到第六格
      currentFrame++; // 切換下一格踢腿動畫
    } else { // 六格踢腿動畫已播放完成
      launchProjectile(); // 發射藍色能量球
      isAttacking = false; // 結束踢腿狀態
      changeAction("stand"); // 恢復站立動畫
    } // 結束踢腿影格判斷
  } else { // 如果不是踢腿動畫
    currentFrame = (currentFrame + 1) % sprite.frames; // 循環播放站立或蹲下動畫
  } // 結束動畫播放判斷
} // 結束動畫更新函式

function drawPlayer() { // 繪製角色精靈
  let sprite = getSprite(); // 取得目前角色圖片
  let size = getPlayerSize(sprite); // 計算角色顯示尺寸
  let sourceX = Math.round(currentFrame * sprite.img.width / sprite.frames); // 計算影格起始位置
  let sourceEnd = Math.round((currentFrame + 1) * sprite.img.width / sprite.frames); // 計算影格結束位置

  push(); // 儲存畫布狀態
  translate(playerX, playerY); // 將繪圖中心移至角色腳底
  if (!facingRight) scale(-1, 1); // 面向左方時水平翻轉角色

  image(sprite.img, -size.w / 2, -size.h, size.w, size.h, sourceX, 0, sourceEnd - sourceX, sprite.img.height); // 擷取並繪製目前精靈影格

  pop(); // 還原畫布狀態
} // 結束角色繪製函式

function launchProjectile() { // 建立發功特效
  let size = getPlayerSize({ img: kickImg, frames: 6 }); // 取得踢腿角色尺寸
  let direction = facingRight ? 1 : -1; // 設定能量球飛行方向
  let startX = playerX + direction * size.w / 2; // 計算能量球起始X位置
  let startY = playerY - size.h * 0.55; // 計算能量球起始Y位置

  projectiles.push({ x: startX, y: startY, vx: direction * 10, life: 0 }); // 建立能量球
  createParticles(startX, startY, 18); // 產生發功火花
} // 結束發功函式

function updateProjectiles() { // 更新能量球移動
  for (let i = projectiles.length - 1; i >= 0; i--) { // 逐一更新所有能量球
    let p = projectiles[i]; // 取得目前能量球
    p.x += p.vx; // 更新能量球水平位置
    p.life++; // 增加特效播放時間

    if (p.x <= wallSize || p.x >= width - wallSize) { // 判斷能量球是否撞牆
      createParticles(constrain(p.x, wallSize, width - wallSize), p.y, 20); // 產生撞牆火花
      projectiles.splice(i, 1); // 移除撞牆的能量球
    } // 結束撞牆判斷
  } // 結束更新迴圈
} // 結束能量球更新函式

function drawProjectiles() { // 繪製藍色能量球
  for (let p of projectiles) { // 逐一繪製能量球
    push(); // 儲存繪圖狀態
    noStroke(); // 移除外框
    fill(40, 120, 255, 80); // 設定外層光暈
    circle(p.x, p.y, 70 + sin(p.life * 0.4) * 8); // 繪製脈動光圈
    fill(30, 190, 255, 190); // 設定中層藍光
    circle(p.x, p.y, 45); // 繪製中層能量球
    fill(255); // 設定白色核心
    circle(p.x, p.y, 22); // 繪製中央光點
    fill(60, 180, 255, 100); // 設定拖尾顏色
    ellipse(p.x - p.vx * 2, p.y, 50, 20); // 繪製能量拖尾
    pop(); // 還原繪圖狀態
  } // 結束能量球繪製
} // 結束能量球特效函式

function createParticles(x, y, amount) { // 建立粒子特效
  for (let i = 0; i < amount; i++) { // 按指定數量建立粒子
    particles.push({ // 將粒子加入陣列
      x: x, // 設定粒子起始X位置
      y: y, // 設定粒子起始Y位置
      vx: random(-4, 4), // 隨機設定水平速度
      vy: random(-4, 2), // 隨機設定垂直速度
      life: 25, // 設定粒子生命
      size: random(3, 8) // 隨機設定粒子大小
    }); // 結束新增粒子
  } // 結束粒子迴圈
} // 結束粒子建立函式

function updateParticles() { // 更新粒子特效
  for (let i = particles.length - 1; i >= 0; i--) { // 從最後一個粒子開始更新
    let p = particles[i]; // 取得目前粒子
    p.x += p.vx; // 更新粒子水平位置
    p.y += p.vy; // 更新粒子垂直位置
    p.vy += 0.12; // 加入粒子重力
    p.life--; // 減少粒子生命

    if (p.life <= 0) particles.splice(i, 1); // 移除消失的粒子
  } // 結束更新迴圈
} // 結束粒子更新函式

function drawParticles() { // 繪製粒子
  noStroke(); // 移除粒子外框
  for (let p of particles) { // 逐一繪製粒子
    fill(255, 190, 50, p.life * 10); // 設定橘黃色粒子與透明度
    circle(p.x, p.y, p.size); // 繪製粒子
  } // 結束粒子繪製
} // 結束粒子繪製函式

function drawWalls() { // 繪製左右牆壁
  noStroke(); // 移除牆壁外框
  fill(95, 105, 120); // 設定灰色牆壁
  rect(0, 0, wallSize, height); // 繪製左牆
  rect(width - wallSize, 0, wallSize, height); // 繪製右牆
} // 結束牆壁函式

function drawShadow() { // 繪製角色腳底陰影
  let size = getPlayerSize(); // 取得角色尺寸
  let distance = height - playerY; // 計算角色離地高度
  let shadowScale = max(0.3, 1 - distance / 400); // 跳越高陰影越小
  noStroke(); // 移除陰影邊框
  fill(30, 50, 70, 70); // 設定陰影顏色
  ellipse(playerX, height - 5, size.w * shadowScale, 12); // 繪製地面陰影
} // 結束陰影函式

function drawShield() { // 繪製防禦護盾
  if (!isBlocking) return; // 沒有防禦就不顯示護盾

  let size = getPlayerSize(); // 取得角色尺寸
  push(); // 儲存繪圖狀態
  noFill(); // 設定護盾透明
  stroke(40, 170, 255, 180); // 設定藍色外框
  strokeWeight(5); // 設定外框粗細
  ellipse(playerX, playerY - size.h / 2, size.w * 1.8, size.h * 1.2); // 繪製防護罩
  pop(); // 還原繪圖狀態
} // 結束防禦函式

function drawLoadMessage(message) { // 繪製圖片載入提示
  fill(0); // 設定黑色文字
  noStroke(); // 移除描邊
  textSize(20); // 設定文字大小
  textAlign(CENTER, CENTER); // 設定文字置中
  text(message, width / 2, height / 2); // 顯示提示文字
} // 結束提示函式

function drawInstructions() { // 顯示操作說明
  fill(20, 35, 50); // 設定文字顏色
  noStroke(); // 移除文字描邊
  textAlign(LEFT, TOP); // 設定文字靠左上方
  textSize(17); // 設定文字大小
  text("A / D：左右移動", 20, 20); // 顯示移動操作
  text("W / 空白鍵：跳躍", 20, 48); // 顯示跳躍操作
  text("J：踢腿發功", 20, 76); // 顯示踢腿操作
  text("S：蹲下", 20, 104); // 顯示蹲下操作
  text("K：防禦", 20, 132); // 顯示防禦操作

  if (imageStatus.kick === "error") { // 檢查踢腿圖片是否載入失敗
    fill(200, 0, 0); // 設定紅色警告文字
    text("錯誤：找不到 magic/10.png", 20, 170); // 顯示踢腿圖片錯誤
  } // 結束錯誤提示

  fill(20, 35, 50); // 恢復一般文字顏色
  text("目前動作：" + currentAction + "　影格：" + currentFrame, 20, 200); // 顯示目前動畫狀態
} // 結束操作說明函式

function keyPressed() { // 偵測鍵盤按下事件

  if ((key === "j" || key === "J" || keyCode === 74) && !isAttacking) { // 偵測J踢腿按鍵
    if (imageStatus.kick === "ready") { // 確認踢腿圖片成功載入
      isAttacking = true; // 開啟攻擊狀態
      isBlocking = false; // 取消防禦狀態
      currentAction = "kick"; // 強制切換踢腿動畫
      currentFrame = 0; // 從第一格開始播放
      lastFrameTime = millis(); // 重新設定影格時間
      console.log("開始播放踢腿動畫"); // 在主控台顯示攻擊訊息
    } else { // 如果圖片沒有成功載入
      console.error("踢腿圖片尚未載入：magic/10.png"); // 顯示錯誤訊息
    } // 結束圖片檢查
  } // 結束踢腿按鍵判斷

  if (key === " " || key === "w" || key === "W" || keyCode === UP_ARROW) { // 偵測跳躍按鍵
    if (!isJumping && !isAttacking && !isBlocking) { // 確認角色可以跳躍
      velocityY = jumpPower; // 設定向上跳躍速度
      isJumping = true; // 開啟跳躍狀態
      createParticles(playerX, playerY - 5, 12); // 產生起跳粒子
    } // 結束跳躍判斷
  } // 結束跳躍按鍵判斷

  if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW, 32].includes(keyCode)) return false; // 防止瀏覽器捲動
} // 結束按鍵函式

function windowResized() { // 偵測視窗尺寸變化
  let oldWidth = width; // 記錄原本畫布寬度
  let oldHeight = height; // 記錄原本畫布高度
  let distanceFromGround = oldHeight - playerY; // 記錄角色離地高度

  resizeCanvas(windowWidth, windowHeight); // 更新畫布尺寸
  playerX = oldWidth > 0 ? playerX / oldWidth * width : width * 2 / 3; // 等比例調整角色水平位置
  playerY = height - distanceFromGround; // 保留角色原本離地高度

  if (!isJumping) playerY = height; // 站立時保持腳底貼齊地板
} // 結束視窗縮放函式
