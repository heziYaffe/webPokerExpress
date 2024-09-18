class GameLogic {

    WAITING = -1;
    START = 0;
    FLOP = 1;
    TURN = 2;
    RIVER = 3;
    SHOWDAWN = 4;

    stage = -1;
    flop = null;
    turn = null;
    river = null;
    players = [];
    foldedPlayers = [];

    pot = 0;

    bigBlindAmount = -1;
    smallBlindAmount = -1;

    bigBlindPlayer = 0;
    smallBlindPlayer = 1;

    lastRaiseAmount = -1;

    maxPlayers = -1;


    constructor(smallBlindAmount, maxPlayers) {
        this.deck = this.createDeck();
        this.shuffleDeck();
        this.smallBlindAmount = smallBlindAmount
        this.bigBlindAmount = 2 * smallBlindAmount
        this.maxPlayers = maxPlayers
    }

    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push({ rank, suit });
            }
        }
        return deck;
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealInitialCards() {
        const cards = [this.deck.pop(), this.deck.pop()];
        return cards;
    }

    executaStage() {
        switch (this.stage) {
            case this.START:
                break
            case this.FLOP:
                return { type: "flop", cards: this.dealFlop() };
            case this.TURN:
                return { type: "turn", cards: this.dealTurn() };
            case this.RIVER:
                return { type: "river", cards: this.dealRiver() };
            case this.SHOWDAWN:
                this.resetFoldedPlayers(); // החזרת שחקנים פורשים לרשימת השחקנים
                return { type: "showdawn", cards: [] };
            default:
                return { type: "endGame", cards: [] };
        }
    }

    nextCard() {
        return this.deck.pop();
    }

    dealFlop() {
        if (this.flop == null) {
            this.flop = [this.nextCard(), this.nextCard(), this.nextCard()];
        }
        return this.flop;
    }

    dealTurn() {
        if (this.turn == null) {
            this.turn = [this.nextCard()];
        }
        return this.turn;
    }

    dealRiver() {
        if (this.river == null) {
            this.river = [this.nextCard()];
        }
        return this.river;
    }

    addPlayer(ws) {
        const playerCards = this.dealInitialCards(); // תחלק קלפים לשחקן
        const player = {
            ws,
            cards: playerCards,
            hasActed: false,
            chips: 1000
        };
        this.players.push(player);  // הוסף את השחקן לרשימת השחקנים
    }

    resetPlayerActions() {
        this.players.forEach(player => {
            player.hasActed = false; // אתחול הפעולות של השחקנים
        });
    }

    updateBlinds() {
        let tmp = this.smallBlindPlayer;
        this.smallBlindPlayer = this.bigBlindPlayer;
        this.bigBlindPlayer = (tmp + 1) % this.players.length;
    }

    allPlayersHaveActed() {
        return this.players.every(player => player.hasActed);
    }

    getGameState(playerWs) {
        const player = this.players.find(p => p.ws === playerWs);
        if (player) {
            return {
                pot: this.pot,
                chips: player.chips
            }
        } else {
            return "player not found"
        }
    }
    // עדכון מצב שחקן לאחר פעולה
    setPlayerAction(playerWs, action) {
        const player = this.players.find(p => p.ws === playerWs);
        if (player) {
            player.hasActed = true;
        }
        switch (action) {
            case "check":
                if (player.chips >= this.bigBlindAmount) {
                    player.chips -= this.bigBlindAmount
                    this.pot += this.bigBlindAmount;
                }
                return { type: `player ${playerWs} checked` };
            case "call":
                if (player.chips >= this.bigBlindAmount) {
                    player.chips -= this.bigBlindAmount
                    this.pot += this.bigBlindAmount;
                }
                return { type: `player ${playerWs} called` };
            case "raise":

                return { type: `player ${playerWs} raised` };
            case "all-in":
                return { type: `player ${playerWs} is all-in` };
            case "fold":
                // הסרת השחקן מרשימת השחקנים והעברתו לרשימת הפורשים
                this.players = this.players.filter(p => p.ws !== playerWs);
                this.foldedPlayers.push(player);
                return { type: `player ${playerWs} folded` };
            default:
                return { type: "", cards: [] };
        }
    }

    getPlayer(ws) {
        return this.players.find(player => player.ws === ws);
    }

    nextStage() {
        if (this.stage < 4) {
            this.stage++;
            this.resetPlayerActions();
            this.updateBlinds();
            return this.executaStage();
        }
    }

    // החזרת כל השחקנים הפורשים לרשימת השחקנים הפעילים
    resetFoldedPlayers() {
        this.players = [...this.players, ...this.foldedPlayers]; // הוספת כל השחקנים הפורשים לרשימת השחקנים
        this.foldedPlayers = []; // איפוס רשימת הפורשים
    }
}

module.exports = GameLogic;
