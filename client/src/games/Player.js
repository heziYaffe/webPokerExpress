// src/games/Player.js

class Player {
    constructor(name) {
        this.name = name;
        this.hand = [];
        this.chips = 1000; // Starting chips for the player
    }

    receiveCard(card) {
        this.hand.push(card);
    }

    bet(amount) {
        if (amount <= this.chips) {
            this.chips -= amount;
            return amount;
        } else {
            throw new Error(`${this.name} doesn't have enough chips.`);
        }
    }

    // Other player methods can go here
}

export default Player;
