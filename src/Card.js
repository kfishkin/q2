
import { CardType } from './CardType';

export const USE_SETTINGS = {
    BATTLE: 0,
    BUYING: 1,
    SELLING: 2,
    USING: 3
}
export const USE_STATUS = {
    NO: 0,
    YES: 1,
    UNKNOWN: 2
}

/**
 * A 'CardType' (aka 'Game Card' or 'Base Card'), is a _type_ of card,
 * appropriate for this game: A recipe of healing, or a Dagger, or whatever.
 * A 'Card' is a particular instance of that card in this game.
 * For example, there is one 'Money' card per denomination ($1, $5, etc.),
 * but you have any number of those instanced in your hand and across the map -
 * those are 'Cards'.
 */
export class Card { // abstract base class
    constructor(dbObj) { // the dictionary describing the card, from the DB.
        // TODO.
        this.game_card.type = CardType.make(dbObj.game_card);
    }
}

export default Card;
