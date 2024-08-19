// src/games/Card.js

class Card {
    constructor(suit, rank) {
        this.suit = suit; // e.g., 'Hearts', 'Diamonds', 'Clubs', 'Spades'
        this.rank = rank; // e.g., '2', '3', '4', ..., 'K', 'A'
    }

    getCardValue() {
        return `${this.rank} of ${this.suit}`;
    }
}

export default Card;
