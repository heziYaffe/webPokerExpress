// src/games/Table.js

import Deck from './Deck';

class Table {
    constructor(players) {
        this.players = players; // Array of Player objects
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
    }

    dealToPlayers() {
        for (let player of this.players) {
            player.receiveCard(this.deck.deal());
            player.receiveCard(this.deck.deal());
        }
    }

    dealCommunityCard() {
        const card = this.deck.deal();
        this.communityCards.push(card);
        return card;
    }

    addToPot(amount) {
        this.pot += amount;
    }

    // Additional methods for handling bets, rounds, etc.
}

export default Table;
