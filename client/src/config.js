// Central client configuration. Override with REACT_APP_API_URL (see .env.example).
export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5003').replace(/\/$/, '');
export const WS_URL = API_URL.replace(/^http/, 'ws');

export const GAMES = [
    { slug: 'texas-holdem', name: "Texas Hold'em", image: '/assets/Games/texasHoldem.webp', blurb: 'Two hole cards, five on the board. The classic.' },
    { slug: 'omaha', name: 'Omaha', image: '/assets/Games/omaha.webp', blurb: 'Four hole cards for bigger hands and bigger pots.' },
    { slug: 'five-card-draw', name: 'Five Card Draw', image: '/assets/Games/fiveCardDraw.webp', blurb: 'Old-school draw poker. Swap and bluff.' },
    { slug: 'seven-card-stud', name: 'Seven Card Stud', image: '/assets/Games/sevenCards.webp', blurb: 'No community cards — read the table.' },
    { slug: 'razz', name: 'Razz', image: '/assets/Games/razz.webp', blurb: 'Lowball stud: the worst hand wins.' },
];

export const gameBySlug = (slug) => GAMES.find((g) => g.slug === slug);
