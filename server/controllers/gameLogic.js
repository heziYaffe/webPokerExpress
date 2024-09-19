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
        this.maxPlayers = maxPlayers;
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
                return { type: "flop", cards: this.dealFlop() };
            case this.TURN:
                return { type: "turn", cards: this.dealTurn() };
            case this.RIVER:
                return { type: "river", cards: this.dealRiver() };
            case this.SHOWDAWN:
                const winners = this.determineWinner(this.players, this.communityCards);
                console.log("The winners are:", winners);
                const prizePerWinner = this.pot / winners.length;
                winners.forEach(winner => {
                    winner.chips += prizePerWinner;
                });
                return {type: "winner", players: winners}
                this.resetFoldedPlayers(); // החזרת שחקנים פורשים לרשימת השחקנים
                return { type: "showdawn", cards: [] };
            default:
                return { type: "endGame", cards: [] };
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
            chips: 1000
        };
        this.players.push(player);  // הוסף את השחקן לרשימת השחקנים
        console.log("players in game logic", this.players);
    }

    resetPlayerActions = () => {
        this.players.forEach(player => {
            player.hasActed = false; // אתחול הפעולות של השחקנים
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
        const player = this.players.find(p => p.ws === playerWs);
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

    setPlayerAction = (playerWs, action) => {
        const player = this.players.find(p => p.ws === playerWs);
        if (player) {
            player.hasActed = true;
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        }
        switch (action) {
            case "check":
                if (player.chips >= this.bigBlindAmount) {
                    player.chips -= this.bigBlindAmount;
                    this.pot += this.bigBlindAmount;
                }
                return { type: `player ${playerWs} checked` };
            case "call":
                if (player.chips >= this.bigBlindAmount) {
                    player.chips -= this.bigBlindAmount;
                    this.pot += this.bigBlindAmount;
                }
                return { type: `player ${playerWs} called` };
            case "raise":
                return { type: `player ${playerWs} raised` };
            case "all-in":
                return { type: `player ${playerWs} is all-in` };
            case "fold":
                this.players = this.players.filter(p => p.ws !== playerWs);
                this.foldedPlayers.push(player);
                return { type: `player ${playerWs} folded` };
            default:
                return { type: "", cards: [] };
        }
    }

    getPlayer = (ws) => {
        return this.players.find(player => player.ws === ws);
    }

    nextStage = () => {
        if (this.stage < 4) {
            this.stage++;
            this.resetPlayerActions();
            this.updateBlinds();
            return this.executaStage();
        }
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
