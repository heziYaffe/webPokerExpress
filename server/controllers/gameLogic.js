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
    communityCards = [];

    players = [];
    foldedPlayers = [];

    pot = 0;

    bigBlindAmount = -1;
    smallBlindAmount = -1;

    bigBlindPlayer = 0;
    smallBlindPlayer = 1;

    lastRaiseAmount = -1;

    maxPlayers = -1;

    currentPlayer = 0;

    handRanks = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
        '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    constructor(smallBlindAmount, maxPlayers, buyIn, tableLimit) {
        this.deck = this.createDeck();
        this.shuffleDeck();
        this.smallBlindAmount = smallBlindAmount;
        this.bigBlindAmount = 2 * smallBlindAmount;
        this.lastRaiseAmount = this.bigBlindAmount;
        this.maxPlayers = maxPlayers;
        this.buyIn = buyIn;
        this.tableLimit = tableLimit;
    }

    createDeck = () => {
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

    shuffleDeck = () => {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealInitialCards = () => {
        const cards = [this.deck.pop(), this.deck.pop()];
        return cards;
    }

    executaStage = () => {
        switch (this.stage) {
            case this.START:
                break;
            case this.FLOP:
                return { type: "flop", cards: this.dealFlop(), stage: this.stage };
            case this.TURN:
                return { type: "turn", cards: this.dealTurn(), stage: this.stage };
            case this.RIVER:
                return { type: "river", cards: this.dealRiver(), stage: this.stage };
            case this.SHOWDAWN:
                const winners = this.determineWinner(this.players, this.communityCards);
                console.log("The winners are:", winners);
                const prizePerWinner = this.pot / winners.length;
                winners.forEach(winner => {
                    winner.chips += prizePerWinner;
                });
                this.resetGame()
                return { type: "showdawn", cards: [], winners: winners, stage: this.stage};

            default:
                return { type: "endGame", cards: [], stage: this.stage};
        }
    }

    nextCard = () => {
        return this.deck.pop();
    }

    dealFlop = () => {
        if (this.flop == null) {
            this.flop = [this.nextCard(), this.nextCard(), this.nextCard()];
        }
        return this.flop;
    }

    dealTurn = () => {
        if (this.turn == null) {
            this.turn = [this.nextCard()];
        }
        return this.turn;
    }

    dealRiver = () => {
        if (this.river == null) {
            this.river = [this.nextCard()];
        }
        return this.river;
    }

    addPlayer = (ws, userId, username) => {
        const playerCards = this.dealInitialCards(); // תחלק קלפים לשחקן
        const player = {
            userId,
            username,
            ws,
            cards: playerCards,
            hasActed: false,
            chips: 10000,
            lastBet: 0
        };
        this.players.push(player);  // הוסף את השחקן לרשימת השחקנים
        console.log("players in game logic", this.players);
    }

    resetPlayersState = () => {
        this.players.forEach(player => {
            player.hasActed = false; // אתחול הפעולות של השחקנים
            player.lastBet = 0;
        });
    }

    updateBlinds = () => {
        let tmp = this.smallBlindPlayer;
        this.smallBlindPlayer = this.bigBlindPlayer;
        this.bigBlindPlayer = (tmp + 1) % this.players.length;
    }

    allPlayersHaveActed = () => {
        return this.players.every(player => player.hasActed);
    }

    getGameState = (playerWs) => {
        const player = this.players.find(p => p.ws === playerWs) || this.foldedPlayers.find(p => p.ws === playerWs);

        if (player) {
            const playersList = this.players.map(p => ({
                username: p.username,
                userId: p.userId
            }));
    
            this.communityCards = [...(this.flop || []), ...(this.turn || []), ...(this.river || [])];
    
            return {
                players: playersList,
                pot: this.pot,
                chips: player.chips,
                stage: this.stage,
                currentPlayer: this.currentPlayer,
                communityCards: this.communityCards,
                currentPlayer: this.currentPlayer
            };
        } else {
            return "player not found";
        }
    }

    setPlayerAction = (playerWs, action, raiseAmount=0) => {
        const player = this.players.find(p => p.ws === playerWs);
        if (player) {
            player.hasActed = true;
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        }

        let playerLastBet = 0;
        let returnMessage = "";

        switch (action) {
            case "Check":
                console.log("this.bigBlindAmount", this.bigBlindAmount)
                console.log("player.chips >= this.bigBlindAmount", player.chips >= this.bigBlindAmount)
                console.log("player.chips", player.chips)


                if (player.chips >= this.bigBlindAmount) {
                    player.chips -= this.bigBlindAmount;
                    this.pot += this.bigBlindAmount;
                    playerLastBet = this.bigBlindAmount;
                }

                returnMessage = { type: `player ${playerWs} checked` };
                break;

            case "Call":
                console.log("raiseAmount", raiseAmount)
                console.log("player.chips >= raiseAmount + this.bigBlindAmount", player.chips >= raiseAmount + this.bigBlindAmount)
                console.log("player.chips", player.chips)

                if (player.chips >= raiseAmount + this.bigBlindAmount - player.lastBet) {
                    player.chips -= raiseAmount + this.bigBlindAmount - player.lastBet;
                    this.pot += raiseAmount + this.bigBlindAmount - player.lastBet;
                    playerLastBet += raiseAmount + this.bigBlindAmount;

                    console.log("raiseAmount", raiseAmount)
                    console.log("player.chips >= raiseAmount + this.bigBlindAmount", player.chips >= raiseAmount + this.bigBlindAmount)
                    console.log("player.chips", player.chips)
                }
                returnMessage = { type: `player ${playerWs} called` };
                break;
            case "Raise":
                console.log("raiseAmount", raiseAmount )
                console.log("this.lastRaiseAmount * 2", this.lastRaiseAmount * 2 )

                console.log("raiseAmount >= this.lastRaiseAmount * 2", raiseAmount >= this.lastRaiseAmount * 2)
                if (raiseAmount >= this.lastRaiseAmount * 2) {
                    if (player.chips >= raiseAmount + this.bigBlindAmount - player.lastBet) {
                        player.chips -= raiseAmount + this.bigBlindAmount - player.lastBet;
                        this.pot += raiseAmount + this.bigBlindAmount - player.lastBet;
                        this.lastRaiseAmount = raiseAmount
                        playerLastBet += raiseAmount + this.bigBlindAmount
                    }
                    console.log("player raise with", raiseAmount)
                    returnMessage =  { type: `player ${playerWs} raised`, raiseAmount: raiseAmount };
                } else {
                    returnMessage = { type: `player ${playerWs} is trying to raise but the raising amount is too low` };
                }
                break;
            case "All-in":
                this.pot += player.chips ;
                player.chips = 0;
                
                returnMessage = { type: `player ${playerWs} is all-in` };
                break;
            case "Fold":
                this.players = this.players.filter(p => p.ws !== playerWs);
                this.foldedPlayers.push(player);
                returnMessage = { type: `player ${playerWs} folded` };
                break;
            default:
                returnMessage = { type: "", cards: [] };
                break;
        }
        player.lastBet = playerLastBet;
        return returnMessage;
    }

    leaveRoom = (ws) => {

        // הסרת השחקן מרשימת השחקנים הפעילים
        this.players = this.players.filter(player => player.ws !== ws);

        // הסרת השחקן מרשימת השחקנים הפורשים
        this.foldedPlayers = this.foldedPlayers.filter(player => player.ws !== ws);

        console.log(`Player with ws: ${ws} has left the room.`);
    }

    getPlayer = (ws) => {
        return this.players.find(player => player.ws === ws);
    }

    nextStage = () => {

        console.log("current stage", this.stage);

        if (this.stage < 4) {
            this.stage++;
            console.log("next stage", this.stage);
            this.resetPlayersState();
            this.updateBlinds();
            this.lastRaiseAmount = this.bigBlindAmount;
            this.currentPlayer = 0;
            return this.executaStage();
        }


    }

    resetGame = () => {
        this.resetFoldedPlayers(); // הקריאה ל-resetFoldedPlayers צריכה להיות עם this
    
        // הוספת הקלפים הקהילתיים בחזרה לחפיסה
        this.deck = [...this.deck, ...this.communityCards];
        this.communityCards = []; // איפוס הקלפים הקהילתיים
        this.flop = [];
        this.turn = [];
        this.river = [];
        this.pot = 0;
    

        // הוספת קלפי השחקנים בחזרה לחפיסה ואיפוס הידיים של השחקנים
        this.players.forEach(player => {
            this.deck = [...this.deck, ...player.cards]; // הוספת הקלפים לחפיסה
            player.cards = []; // איפוס היד של השחקן
        });

        this.stage = -1
    
        this.shuffleDeck(); // ערבוב החפיסה מחדש
    }
    
    
    getStage = () => {
        return this.stage;
    }
    resetFoldedPlayers = () => {
        this.players = [...this.players, ...this.foldedPlayers];
        this.foldedPlayers = [];
    }

    getHandValue = (cards) => {
        const ranks = cards.map(card => this.handRanks[card.rank]).sort((a, b) => b - a);
        const suits = cards.map(card => card.suit);

        const rankCounts = ranks.reduce((counts, rank) => {
            counts[rank] = (counts[rank] || 0) + 1;
            return counts;
        }, {});

        const suitCounts = suits.reduce((counts, suit) => {
            counts[suit] = (counts[suit] || 0) + 1;
            return counts;
        }, {});

        const isFlush = Object.values(suitCounts).some(count => count >= 5);
        const distinctRanks = [...new Set(ranks)];
        const isStraight = distinctRanks.length >= 5 && distinctRanks[0] - distinctRanks[4] === 4;

        if (isFlush && isStraight) return { rank: 8, ranks: distinctRanks.slice(0, 5) };
        if (Object.values(rankCounts).includes(4)) return { rank: 7, ranks };
        if (Object.values(rankCounts).includes(3) && Object.values(rankCounts).includes(2)) return { rank: 6, ranks };
        if (isFlush) return { rank: 5, ranks: distinctRanks.slice(0, 5) };
        if (isStraight) return { rank: 4, ranks: distinctRanks.slice(0, 5) };
        if (Object.values(rankCounts).includes(3)) return { rank: 3, ranks };
        if (Object.values(rankCounts).filter(count => count === 2).length === 2) return { rank: 2, ranks };
        if (Object.values(rankCounts).includes(2)) return { rank: 1, ranks };

        return { rank: 0, ranks };
    }

    getBestHand = (playerCards, tableCards) => {
        const allCards = [...playerCards, ...tableCards];
        const combinations = this.getAllCombinations(allCards, 5);
        return combinations.map(this.getHandValue).sort((a, b) => b.rank - a.rank || this.compareRanks(b.ranks, a.ranks))[0];
    }

    compareRanks = (ranks1, ranks2) => {
        for (let i = 0; i < Math.min(ranks1.length, ranks2.length); i++) {
            if (ranks1[i] !== ranks2[i]) return ranks1[i] - ranks2[i];
        }
        return 0;
    }

    determineWinner = (players, tableCards) => {
        const playerHands = players.map(player => ({
            player,
            bestHand: this.getBestHand(player.cards, tableCards)
        }));

        playerHands.sort((a, b) => b.bestHand.rank - a.bestHand.rank || this.compareRanks(b.bestHand.ranks, a.bestHand.ranks));

        const bestHandRank = playerHands[0].bestHand.rank;
        const winners = playerHands.filter(ph => ph.bestHand.rank === bestHandRank);

        return winners.map(w => w.player);
    }

    getAllCombinations = (arr, k) => {
        const result = [];
        const f = (start, curr) => {
            if (curr.length === k) {
                result.push(curr);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                f(i + 1, [...curr, arr[i]]);
            }
        };
        f(0, []);
        return result;
    }
}

module.exports = GameLogic;
