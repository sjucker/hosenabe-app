// Client-side mirror of HandStack.analyzeHand() in src/game.ts -- used only for display.
// Keep in sync with the server; the server remains the authority on scoring.

const SUITS = ['Schilten', 'Eicheln', 'Rosen', 'Schellen'];

const RANK_POINTS = {
    Sechs: 6,
    Sieben: 7,
    Acht: 8,
    Neun: 9,
    Banner: 10,
    Under: 10,
    Ober: 10,
    Koenig: 10,
    As: 11
};

const RANK_LABELS = {
    Sechs: '6',
    Sieben: '7',
    Acht: '8',
    Neun: '9',
    Banner: 'Banner',
    Under: 'Under',
    Ober: 'Ober',
    Koenig: 'König',
    As: 'As'
};

export function parseCardName(cardName) {
    // Card names are suit + rank, e.g. "RosenKoenig"
    const suit = SUITS.find(s => cardName.startsWith(s));
    if (suit === undefined) {
        return null;
    }
    const rank = cardName.slice(suit.length);
    if (!(rank in RANK_POINTS)) {
        return null;
    }
    return {suit, rank};
}

export function cardLabel(cardName) {
    const card = parseCardName(cardName);
    return card === null ? 'Verdeckti Charte' : `${card.suit} ${RANK_LABELS[card.rank]}`;
}

export function analyzeHand(cardNames) {
    const cards = cardNames.map(parseCardName);
    if (cards.length !== 3 || cards.some(c => c === null)) {
        return null;
    }

    const suitPoints = {};
    const ranks = new Set();
    for (const card of cards) {
        suitPoints[card.suit] = (suitPoints[card.suit] || 0) + RANK_POINTS[card.rank];
        ranks.add(card.rank);
    }
    const nSuits = Object.keys(suitPoints).length;
    let points = Math.max(...Object.values(suitPoints));

    const isTriplet = nSuits === 3 && ranks.size === 1;
    if (isTriplet) {
        points = 30.5;
    }
    const hasFeuer = isTriplet && cards[0].rank === 'As';
    if (hasFeuer) {
        points = 33;
    }
    const hasHosenaben = nSuits === 1 && points === 31;

    return {points, isTriplet, hasFeuer, hasHosenaben};
}

export function formatPoints(points) {
    return points === 30.5 ? '30½' : String(points);
}
