import Game from './Game';

class TexasHoldem extends Game {
    constructor(players = []) {
        super('Texas Hold\'em', players);
        this.communityCards = [];
    }

    dealCommunityCards() {
        // Logic to deal community cards in Texas Hold'em
    }

    // Add specific methods for Texas Hold'em
}

export default TexasHoldem;
