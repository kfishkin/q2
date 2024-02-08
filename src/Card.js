const BaseCard = require('./BaseCard');
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
 * A 'Base Card', is a _type_ of card,
 * appropriate for this game: A recipe of healing, or a Dagger, or whatever.
 * A 'Card' is a particular instance of that card in this game.
 * For example, there is one 'Money' card per denomination ($1, $5, etc.),
 * but you have any number of those instanced in your hand and across the map -
 * those are 'Cards'.
 */
export class Card { // abstract base class
    constructor(dbObj) { // the dictionary describing the card, from the DB.
        if (dbObj.dbObj) {
            // it's a card already - happens when migrating
            console.warn(`Card from Card`);
            return dbObj;
        }
        this.playerId = dbObj.player_id;
        this._id = dbObj._id;
        this.cardId = this._id; // allow either for now
        this.dbObj = dbObj;
        this.game_card = { ...dbObj.game_card};
        this.game_card.type = dbObj.game_card.type;
        // deprecate game_card, move to this.
        this.baseCard = BaseCard.BaseCard.make(dbObj.game_card.type, dbObj.game_card);
    }

    GetPlayerId() {
        return this.playerId;
    }

    GetGameId() {
        return this.baseCard.db._id;
    }

    GetId() {
        return this.cardId;
    }

    // deprecated: for backwards compat
    GetDb() {
        return this.dbObj;
    }


    GetBase() {
        return this.baseCard;
    }
}

export default Card;
