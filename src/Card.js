import dayjs from 'dayjs';
const BaseCard = require('./BaseCard');


/**
 * A 'Base Card', is a _type_ of card,
 * appropriate for this game: A recipe of healing, or a Dagger, or whatever.
 * A 'Card' is a particular instance of that card in this game.
 * For example, there is one 'Money' card per denomination ($1, $5, etc.),
 * but you have any number of those instanced in your hand and across the map -
 * those are 'Cards'.
 */
export class Card { // abstract base class
    constructor(db) { // the dictionary describing the card, from the DB.
        if (db.db) {
            // it's a card already - happens when migrating
            console.warn(`Card from Card`);
            return db;
        }
        this.playerId = db.player_id;
        this._id = db._id;
        this.cardId = this._id; // allow either for now
        this.db = db;
        this.game_card = { ...db.game_card};
        this.game_card.type = db.game_card.type;
        // deprecate game_card, move to this.
        this.baseCard = BaseCard.BaseCard.make(db.game_card.type, db.game_card);
    }

    // allows us to make and return sub-classes
    static Of(db) {
        if (db.db) {
            return db;
        }
        switch (db.game_card.type) {
            case BaseCard.CARD_TYPES.MACHINE:
                    return new CardMachine(db);
                default:
                    return new Card(db);

        }
    }

    FullyDescribe(gameInfo, playerDeck) {
        return this.baseCard.FullyDescribe(gameInfo, playerDeck)
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
        return this.db;
    }


    GetBase() {
        return this.baseCard;
    }
}

class CardMachine extends Card {
    FullyDescribe(gameInfo, playerDeck) {
        let machineInfo = this.db.machine;
        let message = 'has never been used.'
        if (machineInfo && machineInfo.last_used) {
            let now = dayjs();
            let then = dayjs(machineInfo.last_used);
            let diff = Math.floor(now.diff(then, 'h'));

            if (diff === 0) {
                message = "was last used less than an hour ago";
            } else if (diff <= 24) {
                message = `was last used less than ${diff + 1} hours ago`;
            } else {
                let diffDays = Math.floor(now.diff(then, 'd'));
                message = `was last used less than ${diffDays + 1} days ago`;
            }
        }
        let base = this.GetBase();

        return (<div><hr/><b>{base.GetDisplayName()}</b> card: {base.GetDescription()}.<hr/>It {message}</div>);
    }

}

export default Card;
