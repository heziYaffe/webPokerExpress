const GameLogic = require('../controllers/gameLogic');

const c = (s) => {
    // "AS" -> { rank: 'A', suit: 'spades' }, "10H" -> { rank: '10', suit: 'hearts' }
    const suit = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' }[s.slice(-1)];
    return { rank: s.slice(0, -1), suit };
};
const hand = (str) => str.split(' ').map(c);
const fakeWs = (name) => ({ name });

describe('hand evaluation', () => {
    test.each([
        ['AS KS QS JS 10S', 8, 'Straight Flush'],
        ['9C 9D 9H 9S 2C', 7, 'Four of a Kind'],
        ['3C 3D 3H 7S 7C', 6, 'Full House'],
        ['2H 7H 9H JH KH', 5, 'Flush'],
        ['AS 2D 3C 4H 5S', 4, 'Straight'],
        ['8S 8D 8C KH 2S', 3, 'Three of a Kind'],
        ['8S 8D 4C 4H 2S', 2, 'Two Pair'],
        ['8S 8D 4C 5H 2S', 1, 'Pair'],
        ['AS 9D 4C 5H 2S', 0, 'High Card'],
    ])('%s is %s', (cards, rank, name) => {
        const result = GameLogic.evaluateFive(hand(cards));
        expect(result.rank).toBe(rank);
        expect(result.name).toBe(name);
    });

    test('wheel straight loses to a six-high straight', () => {
        const wheel = GameLogic.evaluateFive(hand('AS 2D 3C 4H 5S'));
        const six = GameLogic.evaluateFive(hand('2D 3C 4H 5S 6S'));
        expect(GameLogic.compareHands(six, wheel)).toBeGreaterThan(0);
    });

    test('kicker decides between equal pairs', () => {
        const a = GameLogic.evaluateFive(hand('KS KD AC 5H 2S'));
        const b = GameLogic.evaluateFive(hand('KC KH QC 5D 2C'));
        expect(GameLogic.compareHands(a, b)).toBeGreaterThan(0);
    });

    test('full house ranks trips before the pair', () => {
        const a = GameLogic.evaluateFive(hand('3C 3D 3H AS AC'));
        const b = GameLogic.evaluateFive(hand('2C 2D 2H KS KC'));
        expect(GameLogic.compareHands(a, b)).toBeGreaterThan(0);
    });

    test('best hand picks 5 of 7 cards', () => {
        const best = GameLogic.bestHand(hand('AH KH'), hand('QH JH 10H 2C 3D'));
        expect(best.name).toBe('Straight Flush');
    });

    test('determineWinner returns all tied players', () => {
        const g = new GameLogic(10, 6, 1000, 5000);
        const board = hand('AS KD QC JH 10S');
        const p1 = { userId: 'a', cards: hand('2C 3C') };
        const p2 = { userId: 'b', cards: hand('4D 5D') };
        expect(g.determineWinner([p1, p2], board).map((p) => p.userId)).toEqual(['a', 'b']);
    });
});

describe('deck', () => {
    test('has 52 unique cards after shuffling', () => {
        const g = new GameLogic(10, 6, 1000, 5000);
        const keys = new Set(g.deck.map((x) => x.rank + x.suit));
        expect(keys.size).toBe(52);
    });
});

describe('betting rules', () => {
    const setup = (n = 3) => {
        const g = new GameLogic(10, 6, 1000, 5000);
        const sockets = Array.from({ length: n }, (_, i) => fakeWs(`p${i}`));
        sockets.forEach((ws, i) => g.addPlayer(ws, `u${i}`, `player${i}`));
        return { g, sockets };
    };

    test('cannot start with fewer than 2 players', () => {
        const { g } = setup(1);
        expect(g.nextStage()).toEqual({ error: expect.stringMatching(/2 players/) });
    });

    test('starting a hand deals 2 cards each and posts the blinds', () => {
        const { g } = setup(3);
        g.nextStage();
        expect(g.stage).toBe(g.START);
        g.players.forEach((p) => expect(p.cards).toHaveLength(2));
        expect(g.pot).toBe(30);
        expect(g.roundBet).toBe(20);
    });

    test('only the current player may act', () => {
        const { g, sockets } = setup(3);
        g.nextStage();
        const notCurrent = sockets.find((_, i) => i !== g.currentPlayer);
        expect(g.setPlayerAction(notCurrent, 'Check', 0, { enforceTurn: true })).toEqual({ error: 'It is not your turn' });
    });

    test('unknown sockets are rejected instead of crashing', () => {
        const { g } = setup(2);
        g.nextStage();
        expect(g.setPlayerAction(fakeWs('ghost'), 'Check')).toHaveProperty('error');
    });

    test('check after the flop is free', () => {
        const { g, sockets } = setup(2);
        g.nextStage();
        // everyone calls pre-flop
        while (!g.allPlayersHaveActed()) g.setPlayerAction(sockets[g.players[g.currentPlayer].ws === sockets[0] ? 0 : 1], 'Check', 0, { enforceTurn: true });
        g.nextStage(); // flop
        const before = g.players.map((p) => p.chips);
        g.setPlayerAction(g.players[g.currentPlayer].ws, 'Check', 0, { enforceTurn: true });
        expect(g.players.map((p) => p.chips)).toEqual(before);
    });

    test('raise below the minimum is rejected', () => {
        const { g } = setup(2);
        g.nextStage();
        const ws = g.players[g.currentPlayer].ws;
        expect(g.setPlayerAction(ws, 'Raise', 5, { enforceTurn: true })).toHaveProperty('error');
    });

    test('raise larger than the stack is rejected', () => {
        const { g } = setup(2);
        g.nextStage();
        const ws = g.players[g.currentPlayer].ws;
        expect(g.setPlayerAction(ws, 'Raise', 999999, { enforceTurn: true })).toHaveProperty('error');
    });

    test('last player standing wins the pot', () => {
        const { g } = setup(2);
        g.nextStage();
        const folder = g.players[g.currentPlayer];
        g.setPlayerAction(folder.ws, 'Fold', 0, { enforceTurn: true });
        const result = g.awardIfLastStanding();
        expect(result.type).toBe('showdown');
        expect(result.winners).toHaveLength(1);
        expect(g.stage).toBe(g.WAITING);
        const total = g.players.reduce((s, p) => s + p.chips, 0);
        expect(total).toBe(2000); // chips are conserved
    });

    test('a full hand to showdown conserves chips', () => {
        const { g } = setup(3);
        g.nextStage();
        let summary;
        for (let street = 0; street < 4 && !summary; street++) {
            while (!g.allPlayersHaveActed()) g.setPlayerAction(g.players[g.currentPlayer].ws, 'Check', 0, { enforceTurn: true });
            const res = g.nextStage();
            if (res && res.type === 'showdown') summary = res;
        }
        expect(summary.winners.length).toBeGreaterThan(0);
        expect(g.players.reduce((s, p) => s + p.chips, 0)).toBe(3000);
    });
});
