import dayjs from 'dayjs';
import StepDisplay from './StepDisplay';
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
            case BaseCard.CARD_TYPES.ARMOR:
                return new CardArmor(db);
            case BaseCard.CARD_TYPES.MACHINE:
                return new CardMachine(db);
            case BaseCard.CARD_TYPES.SCORE:
                return new CardScore(db);
            case BaseCard.CARD_TYPES.WEAPON:
                return new CardWeapon(db);
            default:
                return new Card(db);
        }
    }

    FullyDescribe(baseCards) {
        return this.baseCard.FullyDescribe(baseCards);
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

    GetScoreInfo() {
        return this.db.score_info;
    }

    GetArmorWear() {
        return (this.db && this.db.armor_info && ('wear' in this.db.armor_info))
            ? this.db.armor_info.wear : 0;
    }

    GetWeaponWear() {
        return (this.db && this.db.weapon_info && ('wear' in this.db.weapon_info))
            ? this.db.weapon_info.wear : 0;
    }

    GetNetArmorValue() {
        let val = this.GetBase().GetRawArmorValue();
        return Math.max(0, val - this.GetArmorWear());
    }

    GetNetWeaponValue() {
        let val = this.GetBase().GetRawWeaponValue();
        return Math.max(0, val - this.GetWeaponWear());
    }  
    
    isLearningFor(baseCardId) {
        return false;
    }
    
    TerselyDescribe() {
        return this.GetBase().GetDisplayName();
    }    
}

class CardMachine extends Card {
    FullyDescribe(baseCards) {
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

class CardArmor extends Card {
    TerselyDescribe() {
        if (this.GetArmorWear() === 0) {
            return super.TerselyDescribe();
        } else {
            return `${this.GetBase().GetDisplayName()} - wear ${this.GetArmorWear()}`;
        }
    }
    FullyDescribe(baseCards) {
        if (this.GetArmorWear() === 0) {
            return super.FullyDescribe(baseCards);
        }
        let base = this.GetBase();
        return (<div>
            <hr/>
            <span><b>{base.GetDisplayName()}</b> card: {base.GetDescription()}.</span>
            <hr/>
            <span>worth {base.GetRawArmorValue()}, but has wear damage of </span><span class="wear_damage">{this.GetArmorWear()}</span>
        </div>);
    }
}


class CardWeapon extends Card {
    TerselyDescribe() {
        if (this.GetWeaponWear() === 0) {
            return super.TerselyDescribe();
        } else {
            return `${this.GetBase().GetDisplayName()} - wear ${this.GetWeaponWear()}`;
        }
    }    
    FullyDescribe(baseCards) {
        if (this.GetWeaponWear() === 0) {
            return super.FullyDescribe(baseCards);
        }
        let base = this.GetBase();
        return (<div>
            <hr/>
            <span><b>{base.GetDisplayName()}</b> card: {base.GetDescription()}.</span>
            <hr/>
            <span>worth {base.GetRawWeaponValue()}, but has wear damage of </span><span class="wear_damage">{this.GetWeaponWear()}</span>
        </div>);
    }
}


class CardScore extends Card {
    FullyDescribe(baseCards) {
        let score = this.db.score_info;
        if (!score) {
            return super.FullyDescribe(baseCards);
        }
        // oof, a lot to say here.
        // could compute this once and store it in the BE, but I don't
        // want the BE to be in the business of storing HTML. Plus
        // computers is fast.
        let outlineBaseId = this.db.score_info.outline_id;
        let outlineBase = baseCards[outlineBaseId];
        if (!outlineBase) {
            console.warn(`can't find outline ${outlineBaseId}`);
            return super.FullyDescribe(baseCards);
        }
        let recipeBaseId = this.db.score_info.recipe_id;
        let recipeBase = baseCards[recipeBaseId];
        if (!recipeBase) {
            console.warn(`can't find recipe ${recipeBaseId}`);
            return super.FullyDescribe(baseCards);
        }
        let when = dayjs(this.db.score_info.when);
        let whenStr = when.format('D MMM');
        let numSteps = score.amounts.length;

        const fillInSteps = (scoreInfo, baseCards) => {
            let stepDescrs = [];
            for (let step = 0; step < scoreInfo.amounts.length; step++) {
                let amount = scoreInfo.amounts[step];
                let ingredient = baseCards[scoreInfo.ingredient_ids[step]];
                let amountScore = scoreInfo.amount_scores[step];
                let ingredientScore = scoreInfo.ingredient_scores[step];
                let stepDescr = <div>
                    <StepDisplay step={step}/>
                    <span className={`score_${amountScore}`}>{amount}</span>
                    &nbsp;of&nbsp;
                    <span className={`score_${ingredientScore}`}>{ingredient.GetDisplayName()}</span>
                </div>
                stepDescrs.push(stepDescr);
            }
            return stepDescrs;
        }

        return (<div>
            <span>{whenStr} score for a try at the <i>{recipeBase.GetDisplayName()}</i> recipe,
            with {numSteps} steps.</span>
            <hr/>
            {fillInSteps(this.db.score_info, baseCards)}
            <hr/>
            <span>Legend:</span>
            <br/><span class="score_2">X</span> -- right!
            <br/><span class="score_1">X</span> -- right value, wrong position
            <br/><span class="score_0">X</span> -- value not in the recipe.
        </div>);

    }
    isLearningFor(baseCardId) {
          let info = this.GetScoreInfo();
          return (info && info.outline_id === baseCardId);
    }    

}


export default Card;
