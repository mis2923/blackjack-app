class Table {
 
    constructor(gameType, betDenominations = [5, 20, 50, 100]) {
        this.gameType = gameType;
        this.betDenominations = betDenominations;
        this.deck = new Deck(this.gameType);
        this.players = [];
        this.house = new Player('house', 'house', this.gameType, null);
        this.gamePhase = 'betting';
        this.resultsLog = [];
        this.turnCounter = 0;
        this.roundCounter = 0;
    }

    // このメソッドはプレイヤーが取った行動（ベット、ヒット、スタンドなど）を評価し、
    // それに応じてゲームの状態（プレイヤーの手札、ベット、ゲームの状態、チップなど）を更新します。
    evaluateMove(player) {
        // GameDecision : player
        let tp = this.getTurnPlayer();
        switch(player.action){
            case 'bet':
                if(tp.type != 'house'){
                    tp.gameStatus = 'bet';
                    tp.bet = player.amount;
                    tp.chips -= player.amount;
                } else {
                    tp.gameStatus = 'bet';
                }
                break;
                
            case 'surrender':
                tp.gameStatus = 'surrender';
                tp.winAmount = Math.floor(tp.bet / 2)
                tp.chips += tp.winAmount;
                break;
            case 'stand':
                tp.gameStatus = 'stand';
                tp.winAmount = tp.bet;
                break;
            case 'hit':
                tp.gameStatus = 'hit';
                tp.winAmount = tp.bet; 
                tp.hand.push(this.deck.drawOne());
                if(tp.getHandScore() > 21){
                    tp.gameStatus = 'bust';
                } 
                break;
            case 'double':
                tp.gameStatus = 'double';
                tp.winAmount = Math.floor(tp.bet * 2);
                tp.hand.push(this.deck.drawOne());
                if(tp.getHandScore() > 21){
                    tp.gameStatus = 'bust';
                }
                break;
            default: 
                console.log('defaultが呼び出されました');
        }

        if(this.gamePhase == "betting" && this.onLastPlayer()) this.gamePhase = "acting";

        if(this.allPlayerActionsResolved()){
            this.gamePhase = 'roundOver';
            this.blackjackEvaluateAndGetRoundResults();
            this.roundCounter++;
        }
    }

    blackjackEvaluateAndGetRoundResults() {
        let house = this.players[3];
        let result = []; 
        for(let i = 0; i < this.players.length-1; i++){
            let player = this.players[i];

            if(player.gameStatus == 'surrender'){
                player.winAmount = -player.winAmount;
                player.chips += player.bet + player.winAmount;  
            } else if(player.gameStatus == 'bust'){
                player.winAmount = -player.winAmount;
                player.chips += player.winAmount + player.bet;  
            } else if(player.gameStatus == 'stand' || player.gameStatus == 'double'){
                if(this.playerHandOfBlackjack(house)){
                    if(this.playerHandOfBlackjack(player)){
                        player.winAmount = player.bet;
                        player.chips += player.winAmount;
                    } else {
                        player.winAmount = -player.winAmount;
                    }
                } else if(this.playerHandOfBlackjack(player)){
                    player.winAmount = Math.floor(player.winAmount * 1.5); 
                    player.chips += player.winAmount;
                } else {
                    if(house.getHandScore() > 21){
                        player.chips += player.winAmount;
                    } else if(player.getHandScore() > house.getHandScore()){
                        player.chips += player.winAmount;
                    } else {
                        player.winAmount = -player.winAmount;
                        player.chips += player.bet + player.winAmount;
                    }
                }
            } 

            result.push(`name: ${player.name}, action: ${player.gameStatus}, bet: ${player.bet}, won: ${player.winAmount}`);
        }
        this.resultsLog.push(result);

        return this.resultsLog;
    }

    playerHandOfBlackjack(player){
        if(player.hand.length == 2){
            if(player.getHandScore() == 21){
                if(player.hand[0].rank == "A" && player.hand[1].rank == "J" || player.hand[1].rank == "Q" || player.hand[1].rank == "K"){
                    return true;
                } else if(player.hand[1].rank == "A" && player.hand[0].rank == "J" || player.hand[0].rank == "Q" || player.hand[0].rank == "K"){
                    return true;
                } else return false;
            } else return false;
        }
    }

    // プレイヤーにカードを配る
    blackjackAssignPlayerHands() {
        for(let i = 0; i < this.players.length; i++){
            for(let j = 0; j < 2; j++){    
                this.players[i].hand.push(this.deck.drawOne());
            }
        }
    }

    blackjackClearPlayerHandsAndBets() {
        for(let i = 0; i < this.players.length; i++){
            this.players[i].hand = [];
            this.players[i].bet = 0;
        }
    }

    getTurnPlayer() {
        let roundIndex = this.turnCounter % (this.players.length);
        let turnPlayer = {};
        if(roundIndex == 4) turnPlayer = this.house;
        else turnPlayer = this.players[roundIndex];
        return turnPlayer;
    }

    haveTurn(userData) {
        let tp = this.getTurnPlayer();

        if(this.gamePhase == 'betting'){
            if(tp.type == 'user'){
                console.log(`${tp.name} is betting`)
                this.evaluateMove(tp.promptPlayer(userData));
            } else if(tp.type == 'ai') {
                console.log(`${tp.name} is betting`)
                this.evaluateMove(tp.promptPlayer(this.betDenominations))
            } else {
                console.log(`${tp.name} is betting`)
                this.evaluateMove(tp.promptPlayer());
            }
        } else if(this.gamePhase == 'acting'){
            if(tp.type == 'user'){
                console.log(`${tp.name} is acting`)
                this.evaluateMove(tp.promptPlayer(userData));
            } else if(tp.type == 'ai'){
                console.log(`${tp.name} is acting`)
                this.evaluateMove(tp.promptPlayer());
            } else {
                console.log(`${tp.name} is acting`)
                this.evaluateMove(tp.promptPlayer());
            }
        } else {
            // round over
            console.log('roundOver');
            // this.blackjackEvaluateAndGetRoundResults();
        }

        if(tp.gameStatus != 'hit'){
            this.turnCounter++;
        }
    }

    onFirstPlayer() {
        let tp = this.getTurnPlayer();
        return this.players.indexOf(tp) == 0;
    }

    onLastPlayer() {
        let tp = this.getTurnPlayer();
        return this.players.indexOf(tp) == this.players.length - 1;
    }

    allPlayerActionsResolved() {
        let array = [];
        for(let i = 0; i < this.players.length; i++){
            if(this.players[i].gameStatus == "double" || this.players[i].gameStatus == "bust" || this.players[i].gameStatus == "stand" || this.players[i].gameStatus == "surrender"){
                array.push(1);
            }            
            else array.push(0);
        }

        return array.indexOf(0) == -1;
    }
}

class Player {

    constructor(name, type, gameType, chips = 400){
        this.name = name;
        this.type = type;
        this.gameType = gameType;
        this.hand = []; 
        this.chips = chips;
        this.bet = 0;
        this.winAmount = 0;
        this.gameStatus = 'betting';
    }

    // プレイヤーがどのようなアクションを取るべきかを判断する
    promptPlayer(userData){
        if(this.gameStatus == 'betting'){
            if(this.type == 'user'){
                return new GameDecision('bet', userData);
            } else if(this.type == 'ai') {
                return new GameDecision('bet', userData[Math.floor(Math.random() * 4)]);
            } else {
                return new GameDecision('bet', null)
            }
        } else if(this.gameStatus == 'bet'){
            if(this.type == 'user'){
                if(userData == 'surrender' || userData == 'double'){
                    return new GameDecision(userData, this.bet);
                } else if(userData == 'stand' || userData == 'hit'){
                    return new GameDecision(userData);
                } 
            } else if(this.type == 'ai'){
                if(this.getHandScore() == 10 || this.getHandScore() == 11){
                    return new GameDecision('double', this.bet);
                } else if(this.getHandScore() < 16){
                    return new GameDecision('hit');
                } else {
                    return new GameDecision('stand');
                }
            } else {
                if(this.getHandScore() < 16){
                    return new GameDecision('hit');
                } else {
                    return new GameDecision('stand');
                }
            }
        } 
        else if(this.gameStatus == 'hit'){
            if(this.type == 'user'){
                return new GameDecision(userData);
            } else {
                if(this.getHandScore() < 16){
                    return new GameDecision('hit');
                } else {
                    return new GameDecision('stand');
                }
            }
        }
    }

    // プレイヤーの手札にあるすべてのカードの合計値を返す
    getHandScore() {
        let score = 0;
        for(let i = 0; i < this.hand.length; i++){
            score += +this.hand[i].getRankNumber(); 
        }

        let newScore = 0;
        if(score > 21){
            for(let i = 0; i < this.hand.length; i++){
                if(this.hand[i].getRankNumber() == 11){
                    newScore += 1;
                } else {
                    newScore += +this.hand[i].getRankNumber(); 
                }
            }

            return newScore;
        }
        
        return score;
    }
}

class GameDecision {

    constructor(action, amount)
    {
        this.action = action;
        this.amount = amount;
    }
}

class Deck {
    constructor(gameType) {
        this.gameType = gameType;
        this.cards = [];

        if(this.gameType === 'blackjack'){
            const suits = ["H", "D", "C", "S"];
            const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

            for (let i = 0; i < suits.length; i++) {
                for (let j = 0; j < values.length; j++) {
                    this.cards.push(new Card(suits[i], values[j]));
                }
            }
        }
    }
    
    shuffle() {
        for(let i = this.cards.length-1; i >= 0; i--) {
            let j = Math.floor(Math.random() * (i+1));
            let temp = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = temp;
        }
    }

    resetDeck() {
        let newCards = new Deck(this.gameType);
        this.cards = newCards.cards;
    }

    drawOne() {
        return this.cards.pop();
    }
}

class Card {

    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    getRankNumber() {
        if(this.rank === "A") return 11;
        else if(this.rank === "J" || this.rank === "Q" || this.rank === "K") return 10;
        else return this.rank;
    }
}

// ===== config =====

const config = {
    initialForm: document.getElementById('initial-form'),
    gamePage: document.getElementById('gamePage'),
    table: document.getElementById('table'),
    house: document.getElementById('house'),
    players: document.getElementById('players'),
    gameResult: document.getElementById('game-result'),
    gameState: document.getElementById('game-state'),
    playerSelector: document.getElementById('player-selector'),
}

const configResult = {
    roundCount: document.getElementById('round-count'),
    resultLog: document.getElementById('result-log'),
}

function delayFunc(fn){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            fn;
            resolve();
        }, 500);
    });
}

// ===== progress =====

function gamePage(){
    config.initialForm.style.display = 'none';
    config.gamePage.style.display = "flex";

    let table = new Table('blackjack');
    
    table.players.push(new Player("AI1", "ai", "blackjack"));
    table.players.push(new Player("You", "user", "blackjack"));
    table.players.push(new Player("AI2", "ai", "blackjack"));
    table.players.push(table.house);

    initializeGame(table);
    roundStart(table);
}

// --- initialize ---

function initializeGame(table){
    table.gamePhase = 'betting';

    for(let i = 0; i < table.players.length; i++){
        table.players[i].gameStatus = 'betting';
    }

    table.blackjackClearPlayerHandsAndBets();
    table.deck.resetDeck();
    table.deck.shuffle();

    // round count
    let roundCount = document.getElementById('roundCount');
    roundCount.innerHTML = `${table.roundCounter+1}/${document.getElementById("round").value}`;
}

// --- round start ---

async function roundStart(table){
    await bet(table);
    await action(table);
    roundEnd(table);
}

// --- bet ---

async function bet(table){
    await gamePhaseState(table);
    
    while(table.gamePhase == "betting"){
        let tp = table.getTurnPlayer();

        if(tp.type == "ai"){
            await delayFunc(playerState(table));
            await delayFunc(table.haveTurn());
        } else if(tp.type == "house"){
            table.haveTurn();
        } else {
            await delayFunc(playerState(table));
            await userBet(table);
        }
    }
}

async function userBet(table){
    let betSelectorDiv = document.createElement('div');
    betSelectorDiv.classList.add('bet-selector');
    betSelectorDiv.innerHTML =
    `
        <div>あなたのターンです。<br>いくらベットしますか？</div>
        <div class="bet-input-group">
            <div class="bet-input-wrapper">
                <label class="bet-label" for="bet5">5:</label>
                <input class="bet-input" type="number" name="bet5" id="bet5" min="0">
            </div>
            <div class="bet-input-wrapper">
                <label class="bet-label" for="bet20">20:</label>
                <input class="bet-input" type="number" name="bet20" id="bet20" min="0" style="width:48px;">
            </div>
            <div class="bet-input-wrapper">
                <label class="bet-label" for="bet50">50:</label>
                <input class="bet-input" type="number" name="bet50" id="bet50" min="0" style="width:48px;">
            </div>
            <div class="bet-input-wrapper">
                <label class="bet-label" for="bet100">100:</label>
                <input class="bet-input" type="number" name="bet100" id="bet100" min="0" style="width:48px;">
            </div>
        </div>
        <button id="bet-submit" class="bet-submit" type="button">ベットする</button>
    `;

    config.playerSelector.append(betSelectorDiv);

    let bet5 = document.getElementById('bet5');
    let bet20 = document.getElementById('bet20');
    let bet50 = document.getElementById('bet50');
    let bet100 = document.getElementById('bet100');
    let betSubmit = document.getElementById('bet-submit');
    let sum = 0;

    return new Promise((resolve, reject) => {
        betSubmit.addEventListener('click', async () => {
            sum += +bet5.value * 5 + +bet20.value * 20 + +bet50.value * 50 + +bet100.value * 100;
            bet5.value = "";
            bet20.value = "";
            bet50.value = "";
            bet100.value = "";
            betSelectorDiv.innerHTML = "";
            
            table.haveTurn(sum);
            resolve();
        })
    })
}

// -- action ---

async function action(table){
    // initialize
    table.blackjackAssignPlayerHands();
    await gamePhaseState(table);
    await delayFunc(playerState(table));

    while(table.gamePhase == "acting"){
        let tp = table.getTurnPlayer();

        if(tp.type != "user"){
            await delayFunc(playerState(table));
            await table.haveTurn();
            await delayFunc(playerState(table));
            while(table.getTurnPlayer().gameStatus == 'hit'){
                await table.haveTurn();
                await delayFunc(playerState(table));
            }
        } else {
            while(tp == table.getTurnPlayer()){
                await userAction(table);
                await delayFunc(playerState(table));
            }
        }
    }
}

async function userAction(table){
    let tp = table.getTurnPlayer();
    let actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');
    actionButtons.innerHTML =
    `
    <div>あなたのターンです。<br>アクションを選択してください。</div>
    <button id="surrender" class="action-btn btn btn-primary" ${tp.gameStatus == "hit" ? "disabled" : ""}>surrender</button>
    <button id="stand" class="action-btn btn btn-primary">stand</button>
    <button id="hit" class="action-btn btn btn-primary" ${table.playerHandOfBlackjack(tp) || tp.getHandScore() == 21 ? "disabled" : ""}>hit</button>
    <button id="double" class="action-btn btn btn-primary" ${tp.gameStatus == "hit" || table.playerHandOfBlackjack(tp) || tp.getHandScore() == 21 ? "disabled" : ""}>double</button>
    `;
    config.playerSelector.append(actionButtons);

    let actionButton = document.querySelectorAll('.action-btn');

    return new Promise((resolve, reject) => {
        for(let i = 0; i < actionButton.length; i++){
            actionButton[i].addEventListener('click', async () => {
                let selectedAction = actionButton[i].innerHTML;
                actionButtons.innerHTML = "";
                // actionContainerを非表示
                await delayFunc(playerState(table));
                table.haveTurn(selectedAction);
                resolve();
            })
        }
    })
}

// --- round end ---

async function roundEnd(table){
    await gamePhaseState(table);
    // result log
    configResult.resultLog.innerHTML = "";

    for(let i = table.resultsLog.length-1; i >= 0; i--){
        let resultDiv = document.createElement('div');
        let resultSpan = document.createElement('span');
        let resultUl = document.createElement('ul');
        resultDiv.classList.add('r');
        resultSpan.innerHTML = `Round${i+1}`;
        if(table.roundCounter == i+1) resultDiv.classList.add('current');

        for(let j = 0; j < table.resultsLog[i].length; j++){
            let resultLi = document.createElement('li');
            resultLi.innerHTML = table.resultsLog[i][j];
            resultUl.append(resultLi);
        }

        resultDiv.append(resultSpan);
        resultDiv.append(resultUl);
        configResult.resultLog.append(resultDiv);
    }

    if(document.getElementById("round").value == table.roundCounter){
        gameOver(table); 
    } else {
        let buttonDiv = document.createElement('div');
        buttonDiv.innerHTML = 
        `
        <div>Round${table.roundCounter}が終了しました。</div>
        <button id="next-round" class="action-btn">次のラウンドを始める</button>
        `;
        config.playerSelector.append(buttonDiv);

        document.getElementById('next-round').addEventListener('click', () => {
            document.querySelector('.r').classList.remove('current')
            buttonDiv.innerHTML = "";
            nextRound(table);
        });
    }
}

// --- next round ---

function nextRound(table){
    initializeGame(table);
    roundStart(table);
}

// --- gameOver ---

function gameOver(table){
    let winner = "";
    let max = -Infinity;

    for(let i = 0; i < table.players.length-1; i++){
        let cp = table.players[i];
        if(cp.chips > max){
            max = cp.chips;
            winner = cp.name;
        }
    }

    config.gameResult.style.display ="block";

    let gameOverDiv = document.createElement('div');
    gameOverDiv.classList.add('game-result-inner');
    gameOverDiv.innerHTML = 
    `
        <div class="game-result-content">
            <div style="font-size:16px;font-weight:600;">ゲーム終了</div>
            <div style="font-size:14px;color:var(--color-font-thin);">このゲームの勝者は<span>${winner}</span>さんです。</div>
            <button id="game-over" class="game-over-btn" style="font-weight:600;">もう一度プレイする</button>
        </div>
    `;
    config.gameResult.append(gameOverDiv);

    document.getElementById('game-over').addEventListener('click', function(){
        document.getElementById("round").value = 5;
        config.house.innerHTML = "";
        config.players.innerHTML = "";
        config.gameResult.innerHTML = "";
        configResult.resultLog.innerHTML = "";
        config.gameResult.style.display = "none";
        config.gamePage.style.display = "none";
        config.initialForm.style.display = "flex";
    })
}

// ===== ui =====

function playerState(table){
    let houseDiv = document.getElementById('house');
    let playersDiv = document.getElementById('players');
    houseDiv.innerHTML = "";
    playersDiv.innerHTML = "";
    
    for(let i = 0; i < table.players.length; i++){
        let playerDiv = document.createElement('div');
        playerDiv.classList.add('player');
        if(table.players[i].type == "user") playerDiv.setAttribute('id', 'player-user');

        if(table.getTurnPlayer().name == table.players[i].name && table.gamePhase != 'roundOver'){
            playerDiv.classList.add('current');
        }
        

        if(table.players[i].type != "house"){
            playerDiv.innerHTML = 
            `
            <div style="text-align:center;">
                <span class="player-name">${table.players[i].name}</span>
                <div style="font-size:14px;color:#c7c7c7;">
                    <p>Status:${table.players[i].gameStatus} / Bet:${table.players[i].bet} / Chips:${table.players[i].chips}</p>
                </div>
            </div>
            `
        } else  {
            playerDiv.innerHTML = 
            `
            <div style="text-align:center;">
                <div class="player-name">${table.players[i].name}</div>
            </div>
            `
        }
        
        let cardsDiv = document.createElement('div');
        cardsDiv.classList.add('cards', 'position-relative');
        
        for(let j = 0; j < table.players[i].hand.length; j++){
            let cardDiv = document.createElement('div');
            cardDiv.classList.add("card");
            let hand = table.players[i].hand[j];

            if(i == 3 && j == 1){
                if(table.getTurnPlayer().type != "house" && table.gamePhase == "acting"){
                    cardDiv.innerHTML =
                    `
                    <div class="card-inner" style="position:relative;width:100%;height:100%;background:url(card-back.jpg) no-repeat center center / contain;">
                    
                    </div>
                    `;
                } else {
                    cardDiv.innerHTML =
                    `
                    <div class="card-inner" style="position:relative;width:100%;height:100%;">
                        <span style="position:absolute;top:0;left:0;font-size:13px;${hand.suit == "H" || hand.suit == "D" ? "color:var(--color-red);" : "color:var(--color-black);"}"">${hand.rank}</span>
                        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:16px;${hand.suit == "H" || hand.suit == "D" ? "color:var(--color-red);" : "color:var(--color-black);"}">${hand.suit == "C" ? "♣" : hand.suit == "D" ? "♦" : hand.suit == "H" ? "♥" : "♠"}</span>
                    </div>
                    `;
                }
            } else {
                cardDiv.innerHTML =
                `
                <div class="card-inner" style="position:relative;width:100%;height:100%;">
                    <span style="position:absolute;top:0;left:0;font-size:13px;${hand.suit == "H" || hand.suit == "D" ? "color:var(--color-red);" : "color:var(--color-black);"}"">${hand.rank}</span>
                    <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:16px;${hand.suit == "H" || hand.suit == "D" ? "color:var(--color-red);" : "color:var(--color-black);"}">${hand.suit == "C" ? "♣" : hand.suit == "D" ? "♦" : hand.suit == "H" ? "♥" : "♠"}</span>
                </div>
                `;
            }

            cardsDiv.append(cardDiv);
        }

        let scoreDiv = document.createElement('div');

        if(table.gamePhase == "acting"){
            if(table.players[i].type == "house"){
                if(table.getTurnPlayer().type == "house"){
                    if(table.playerHandOfBlackjack(table.players[i])){
                        scoreDiv.innerHTML =
                        `
                        <div class="badge badge-black">Black Jack</div>
                        `; 
                    } else {
                        scoreDiv.innerHTML =
                        `
                        <div class="badge">${table.players[i].getHandScore()}</div>
                        `; 
                    }
                } else {
                    scoreDiv.innerHTML =
                    `
                    <div class="badge">${table.players[i].hand[0].getRankNumber()}</div>
                    `; 
                }

            } else {
                if(table.playerHandOfBlackjack(table.players[i])){
                    scoreDiv.innerHTML =
                    `
                    <div class="badge badge-black">Black Jack</div>
                    `;
                } else {
                    scoreDiv.innerHTML =
                    `
                    <div class="badge">${table.players[i].getHandScore()}</div>
                    `;
                }
            }
        } else if(table.gamePhase == "roundOver"){
            if(table.playerHandOfBlackjack(table.players[i])){
                scoreDiv.innerHTML =
                `
                <div class="badge badge-black">Black Jack</div>
                `; 
            } else {
                scoreDiv.innerHTML =
                `
                <div class="badge">${table.players[i].getHandScore()}</div>
                `;
            }
            
        } else {
            scoreDiv.innerHTML = "";
        }

        playerDiv.append(cardsDiv);
        playerDiv.append(scoreDiv);

        if(i == 3) houseDiv.append(playerDiv);
        else playersDiv.append(playerDiv);
    }
}

async function gamePhaseState(table){
    let currentPhase = table.gamePhase;
    let phase = document.getElementById('game-phase');
    phase.innerHTML =
    `
        <div class="phase-mark ${currentPhase == "betting" ? "current" : ""}">betting</div>
        <div class="phase-mark ${currentPhase == "acting" ? "current" : ""}">acting</div>
        <div class="phase-mark ${currentPhase == "roundOver" ? "current" : ""}">round over</div>
    `
}
