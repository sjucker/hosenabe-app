
const ha = require("./game");

function putAllCardsBack(players, game) {
    for (const player of players) {
        var cards = player.hand.popCards();
        game.getDeck().addCards(cards);
    }
    var tableCards = game.table.popCards();
    game.getDeck().addCards(tableCards);
}

function getCardsFromDeck(cardNames, game) {
    var cards = [];
    for (const cn of cardNames) {
        cards.push(game.getDeck().popCard(cn));
    }
    return cards;
}

var player1 = new ha.Player('Hansli');
var player2 = new ha.Player('Fritzli');
var player3 = new ha.Player('Trudi');

var game = new ha.Game(player1);
game.addPlayer(player2);
game.addPlayer(player3);
game.startGame();

putAllCardsBack([player1, player2, player3], game);
player1.hand.addCards(getCardsFromDeck(['EichelnAs', 'RosenAs', 'SchellenAs'], game));
player2.hand.addCards(getCardsFromDeck(['SchiltenAs', 'SchiltenOber', 'SchiltenBanner'], game));
player3.hand.addCards(getCardsFromDeck(['SchellenAcht', 'SchellenNeun', 'SchellenBanner'], game));
game.getTable().addCards(getCardsFromDeck(['RosenAcht', 'RosenNeun', 'RosenBanner'], game));

