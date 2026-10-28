const crypto = require('crypto');
const logger = require('../utils/logger');

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]));

const HAND_NAMES = [
    'High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight',
    'Flush', 'Full House', 'Four of a Kind', 'Straight Flush',
];

/**
 * Evaluates exactly 5 cards. Returns { rank, ranks, name } where `rank` is the
 * hand category (0..8) and `ranks` are the tie-breakers in significance order.
 */
const evaluateFive = (cards) => {
    const values = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
    const isFlush = cards.every((c) => c.suit === cards[0].suit);

    const unique = [...new Set(values)];
    let straightHigh = 0;
    if (unique.length === 5) {
        if (unique[0] - unique[4] === 4) straightHigh = unique[0];
        // Wheel: A-2-3-4-5
        else if (unique.join(',') === '14,5,4,3,2') straightHigh = 5;
    }

    // Group by value, ordered by count desc then value desc (e.g. full house: trips first).
    const counts = {};
    values.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    const groups = Object.entries(counts)
        .map(([v, n]) => ({ v: Number(v), n }))
        .sort((a, b) => b.n - a.n || b.v - a.v);
    const byGroup = groups.map((g) => g.v);
    const shape = groups.map((g) => g.n).join('');

    let rank;
    let ranks = byGroup;
    if (straightHigh && isFlush) { rank = 8; ranks = [straightHigh]; }
    else if (shape === '41') rank = 7;
    else if (shape === '32') rank = 6;
    else if (isFlush) { rank = 5; ranks = values; }
    else if (straightHigh) { rank = 4; ranks = [straightHigh]; }
    else if (shape === '311') rank = 3;
    else if (shape === '221') rank = 2;
    else if (shape === '2111') rank = 1;
    else rank = 0;

    return { rank, ranks, name: HAND_NAMES[rank] };
};

const compareHands = (a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    for (let i = 0; i < Math.max(a.ranks.length, b.ranks.length); i++) {
        const d = (a.ranks[i] || 0) - (b.ranks[i] || 0);
        if (d !== 0) return d;
    }
    return 0;
};

const combinations = (arr, k) => {
    const result = [];
    const f = (start, curr) => {
        if (curr.length === k) { result.push(curr); return; }
        for (let i = start; i < arr.length; i++) f(i + 1, [...curr, arr[i]]);
    };
    f(0, []);
    return result;
};

/** Best 5-card hand out of hole cards + board (5..7 cards). */
const bestHand = (holeCards, board) => {
    const all = [...holeCards, ...board];
    if (all.length < 5) return { rank: -1, ranks: [], name: 'Incomplete' };
    return combinations(all, 5).map(evaluateFive).reduce((best, h) => (compareHands(h, best) > 0 ? h : best));
};

class GameLogic {

    WAITING = -1;
    START = 0;
    FLOP = 1;
    TURN = 2;
    RIVER = 3;
    SHOWDOWN = 4;
    // Backwards-compatible alias for the original (misspelled) constant.
    SHOWDAWN = 4;

    stage = -1;

    flop = null;
    turn = null;
    river = null;
    communityCards = [];

    players = [];
    foldedPlayers = [];

    pot = 0;
    roundBet = 0;          // highest bet in the current betting round

    bigBlindPlayer = 0;
    smallBlindPlayer = 1;

    currentPlayer = 0;

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
        const deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) deck.push({ rank, suit });
        }
        return deck;
    }

    // Fisher-Yates with a CSPRNG (Math.random is predictable).
    shuffleDeck = () => {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = crypto.randomInt(i + 1);
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealInitialCards = () => [this.deck.pop(), this.deck.pop()];

    executeStage = () => {
        switch (this.stage) {
            case this.START:
                return undefined;
            case this.FLOP:
                return { type: 'flop', cards: this.dealFlop(), stage: this.stage };
            case this.TURN:
                return { type: 'turn', cards: this.dealTurn(), stage: this.stage };
            case this.RIVER:
                return { type: 'river', cards: this.dealRiver(), stage: this.stage };
            case this.SHOWDOWN:
                return this.showdown();
            default:
                return { type: 'endGame', cards: [], stage: this.stage };
        }
    }

    // Kept for backwards compatibility with the original method name.
    executaStage = () => this.executeStage();

    nextCard = () => this.deck.pop();

    dealFlop = () => {
        if (!this.flop) this.flop = [this.nextCard(), this.nextCard(), this.nextCard()];
        return this.flop;
    }

    dealTurn = () => {
        if (!this.turn) this.turn = [this.nextCard()];
        return this.turn;
    }

    dealRiver = () => {
        if (!this.river) this.river = [this.nextCard()];
        return this.river;
    }

    addPlayer = (ws, userId, username) => {
        if (this.players.length + this.foldedPlayers.length >= this.maxPlayers) {
            return { error: 'Room is full' };
        }
        const player = {
            userId,
            username,
            ws,
            cards: [],
            hasActed: false,
            chips: this.buyIn || 10000,
            lastBet: 0,
        };
        // Players joining mid-hand sit out (like folded players) until the next hand.
        if (this.stage === this.WAITING) this.players.push(player);
        else this.foldedPlayers.push(player);
        return { player };
    }

    resetPlayersState = () => {
        this.players.forEach((player) => {
            player.hasActed = false;
            player.lastBet = 0;
        });
        this.roundBet = 0;
        this.lastRaiseAmount = this.bigBlindAmount;
    }

    updateBlinds = () => {
        if (this.players.length < 2) return;
        this.bigBlindPlayer = (this.bigBlindPlayer + 1) % this.players.length;
        this.smallBlindPlayer = (this.bigBlindPlayer + this.players.length - 1) % this.players.length;
    }

    postBlind = (player, amount) => {
        const paid = Math.min(amount, player.chips);
        player.chips -= paid;
        player.lastBet += paid;
        this.pot += paid;
        this.roundBet = Math.max(this.roundBet, player.lastBet);
    }

    allPlayersHaveActed = () => this.players.every((player) => player.hasActed);

    /** Per-player view: only the requesting player's chips/bet details, never other hole cards. */
    getGameState = (playerWs) => {
        const player = this.players.find((p) => p.ws === playerWs) || this.foldedPlayers.find((p) => p.ws === playerWs);
        if (!player) return null;

        this.communityCards = [...(this.flop || []), ...(this.turn || []), ...(this.river || [])];

        return {
            players: this.players.map((p) => ({
                username: p.username,
                userId: p.userId,
                chips: p.chips,
                lastBet: p.lastBet,
            })),
            pot: this.pot,
            chips: player.chips,
            toCall: Math.max(0, this.roundBet - player.lastBet),
            minRaise: this.lastRaiseAmount,
            stage: this.stage,
            folded: this.foldedPlayers.includes(player),
            currentPlayer: this.currentPlayer,
            communityCards: this.communityCards,
        };
    }

    /**
     * Applies an action for the player bound to `playerWs`.
     * Returns { ok: true, ... } on success or { error } when the action is rejected.
     * With enforceTurn, only the current player may act.
     */
    setPlayerAction = (playerWs, action, raiseAmount = 0, { enforceTurn = false } = {}) => {
        const index = this.players.findIndex((p) => p.ws === playerWs);
        const player = this.players[index];
        if (!player) return { error: 'You are not an active player in this hand' };
        if (this.stage < this.START || this.stage >= this.SHOWDOWN) return { error: 'No betting round in progress' };
        if (enforceTurn && index !== this.currentPlayer % this.players.length) return { error: 'It is not your turn' };

        const toCall = Math.max(0, this.roundBet - player.lastBet);
        const pay = (amount) => {
            const paid = Math.min(amount, player.chips);
            player.chips -= paid;
            player.lastBet += paid;
            this.pot += paid;
            return paid;
        };

        let result;
        switch (action) {
            case 'Check':
                // "Check" doubles as "call" when there is an outstanding bet (the UI has a single button).
                pay(toCall);
                result = { ok: true, type: toCall > 0 ? 'called' : 'checked' };
                break;
            case 'Call':
                pay(toCall);
                result = { ok: true, type: 'called' };
                break;
            case 'Raise': {
                const amount = Number(raiseAmount);
                if (!Number.isInteger(amount) || amount < this.lastRaiseAmount) {
                    return { error: `Minimum raise is ${this.lastRaiseAmount}` };
                }
                if (toCall + amount > player.chips) return { error: 'Not enough chips for that raise' };
                pay(toCall + amount);
                this.roundBet = player.lastBet;
                this.lastRaiseAmount = amount;
                result = { ok: true, type: 'raised', raiseAmount: amount };
                break;
            }
            case 'All-in':
                pay(player.chips);
                if (player.lastBet > this.roundBet) {
                    this.lastRaiseAmount = Math.max(this.lastRaiseAmount, player.lastBet - this.roundBet);
                    this.roundBet = player.lastBet;
                }
                result = { ok: true, type: 'all-in' };
                break;
            case 'Fold':
                this.players.splice(index, 1);
                this.foldedPlayers.push(player);
                if (this.players.length) this.currentPlayer = index % this.players.length;
                return { ok: true, type: 'folded' };
            default:
                return { error: 'Unknown action' };
        }

        player.hasActed = true;
        this.currentPlayer = (index + 1) % this.players.length;
        return result;
    }

    leaveRoom = (ws) => {
        this.players = this.players.filter((player) => player.ws !== ws);
        this.foldedPlayers = this.foldedPlayers.filter((player) => player.ws !== ws);
        if (this.players.length) this.currentPlayer %= this.players.length;
    }

    getPlayer = (ws) => this.players.find((player) => player.ws === ws);

    /** Starts a new hand: deals hole cards, rotates and posts blinds. */
    startHand = () => {
        if (this.stage !== this.WAITING) return { error: 'A hand is already in progress' };
        if (this.players.length < 2) return { error: 'At least 2 players are needed to start' };

        this.resetGame();
        this.players.forEach((p) => { p.cards = this.dealInitialCards(); });
        this.stage = this.START;
        this.resetPlayersState();
        this.updateBlinds();
        this.postBlind(this.players[this.smallBlindPlayer], this.smallBlindAmount);
        this.postBlind(this.players[this.bigBlindPlayer], this.bigBlindAmount);
        this.currentPlayer = (this.bigBlindPlayer + 1) % this.players.length;
        return { ok: true };
    }

    nextStage = () => {
        if (this.stage === this.WAITING) {
            const started = this.startHand();
            return started.error ? started : undefined;
        }
        if (this.stage < this.SHOWDOWN) {
            this.stage++;
            this.resetPlayersState();
            this.currentPlayer = 0;
            return this.executeStage();
        }
        return undefined;
    }

    /** If everybody else folded, the last player wins the pot immediately. */
    awardIfLastStanding = () => {
        if (this.stage >= this.START && this.stage < this.SHOWDOWN && this.players.length === 1) {
            const [winner] = this.players;
            winner.chips += this.pot;
            const summary = { type: 'showdown', winners: [winner.userId], winnerNames: [winner.username], hand: null, cards: [] };
            this.resetGame();
            return summary;
        }
        return null;
    }

    showdown = () => {
        const board = [...(this.flop || []), ...(this.turn || []), ...(this.river || [])];
        const winners = this.determineWinner(this.players, board);
        const prize = Math.floor(this.pot / winners.length);
        winners.forEach((w) => { w.chips += prize; });
        const hand = bestHand(winners[0].cards, board).name;
        logger.debug(`Showdown: ${winners.map((w) => w.username).join(', ')} win with ${hand}`);
        const summary = {
            type: 'showdown',
            cards: [],
            winners: winners.map((w) => w.userId),
            winnerNames: winners.map((w) => w.username),
            hand,
            stage: this.SHOWDOWN,
        };
        this.resetGame();
        return summary;
    }

    resetGame = () => {
        this.resetFoldedPlayers();
        this.deck = this.createDeck();
        this.shuffleDeck();
        this.communityCards = [];
        this.flop = null;
        this.turn = null;
        this.river = null;
        this.pot = 0;
        this.players.forEach((player) => { player.cards = []; });
        this.resetPlayersState();
        this.stage = this.WAITING;
    }

    getStage = () => this.stage;

    resetFoldedPlayers = () => {
        this.players = [...this.players, ...this.foldedPlayers];
        this.foldedPlayers = [];
    }

    getHandValue = (cards) => evaluateFive(cards);

    getBestHand = (playerCards, tableCards) => bestHand(playerCards, tableCards);

    /** Returns every player tied for the best hand. */
    determineWinner = (players, tableCards) => {
        const hands = players.map((player) => ({ player, hand: bestHand(player.cards || [], tableCards) }));
        const best = hands.reduce((b, h) => (compareHands(h.hand, b.hand) > 0 ? h : b)).hand;
        return hands.filter((h) => compareHands(h.hand, best) === 0).map((h) => h.player);
    }
}

GameLogic.evaluateFive = evaluateFive;
GameLogic.bestHand = bestHand;
GameLogic.compareHands = compareHands;

module.exports = GameLogic;
