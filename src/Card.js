

import StepDisplay from './StepDisplay';
import dayjs from 'dayjs';
const BaseCard = require('./BaseCard');
var localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat);


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
        this.game_card = { ...db.game_card };
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
            case BaseCard.CARD_TYPES.LEARNING:
                return new CardLearning(db);
            default:
                return new Card(db);
        }
    }

    fullyDescribe(baseCards) {
        return this.baseCard.fullyDescribe(baseCards);
    }

    getPlayerId() {
        return this.playerId;
    }

    getGameId() {
        return this.baseCard.db._id;
    }

    getId() {
        return this.cardId;
    }

    // deprecated: for backwards compat
    getDb() {
        return this.db;
    }


    getBase() {
        return this.baseCard;
    }

    getScoreInfo() {
        return this.db.score_info;
    }

    getArmorWear() {
        return (this.db && this.db.armor_info && ('wear' in this.db.armor_info))
            ? this.db.armor_info.wear : 0;
    }

    getWeaponWear() {
        return (this.db && this.db.weapon_info && ('wear' in this.db.weapon_info))
            ? this.db.weapon_info.wear : 0;
    }

    getNetArmorValue() {
        let val = this.getBase().getRawArmorValue();
        return Math.max(0, val - this.getArmorWear());
    }

    getNetWeaponValue() {
        let val = this.getBase().getRawWeaponValue();
        return Math.max(0, val - this.getWeaponWear());
    }

    isLearningFor(baseCardId) {
        return false;
    }

    terselyDescribe() {
        return this.getBase().getDisplayName();
    }
}

class CardLearning extends Card {
    fullyDescribe(baseCards) {
        // learning_info has
        //    outline_id
        //    recipe_id
        //    when
        //    step
        //    amount? if revealed
        //    ingredient_id? if revealed.
        let learningInfo = this.getDb().learning_info;
        if (!learningInfo) {
            console.warn('learning card w/o learning info');
            return this.getBase().fullyDescribe(baseCards);
        }
        /* not needed.
let baseOutlineId = learningInfo.outline_id;
let printed = false;

let baseOutlineCard = Object.values(baseCards).find((bc) => {
    if (!printed) {
        printed = true;
        console.log(`bc = ${JSON.stringify(bc)}`);
    }
    return bc.getId() === baseOutlineId;
});
*/
        let baseRecipeId = learningInfo.recipe_id;
        let baseRecipeCard = Object.values(baseCards).find((bc) => {
            return bc.getId() === baseRecipeId;
        });
        let stepNumber = learningInfo.step;
        let when = dayjs(learningInfo.when);

        const whatLearned = () => {
            let frags = [];
            if (learningInfo.amount) {
                frags.push(<span>the <i>amount</i> is <b>{learningInfo.amount}</b></span>);
            }
            if (learningInfo.ingredient_id) {
                if (frags.length > 0) {
                    frags.push(<span>, and that </span>);
                }
                let baseIngredientId = learningInfo.ingredient_id;
                let baseIngredientCard = Object.values(baseCards).find((bc) => {
                    return bc.getId() === baseIngredientId;
                });
                frags.push(<span>the <i>ingredient</i> is <b>{baseIngredientCard.getDisplayName()}</b></span>);
            }
            return frags;
        };

        return (<span>On {when.format('ll')} you learned about step <b><StepDisplay step={stepNumber} terse={true} /></b>
            &nbsp;of your outline card for the level {baseRecipeCard.getLevel()} '{baseRecipeCard.getDisplayName()}' recipe:
            {whatLearned()}</span>);
    }

    isLearningFor(baseCardId) {
        let info = this.getDb().learning_info;
        return (info && info.outline_id === baseCardId);
    }
}

class CardMachine extends Card {
    fullyDescribe(baseCards) {
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
        let base = this.getBase();

        return (<div><hr /><b>{base.getDisplayName()}</b> card: {base.getDescription()}.<hr />It {message}</div>);
    }
}

class CardArmor extends Card {
    terselyDescribe() {
        if (this.getArmorWear() === 0) {
            return super.terselyDescribe();
        } else {
            return `${this.getBase().getDisplayName()} - wear ${this.getArmorWear()}`;
        }
    }
    fullyDescribe(baseCards) {
        if (this.getArmorWear() === 0) {
            return super.fullyDescribe(baseCards);
        }
        let base = this.getBase();
        return (<div>
            <hr />
            <span><b>{base.getDisplayName()}</b> card: {base.getDescription()}.</span>
            <hr />
            <span>worth {base.getRawArmorValue()}, but has wear damage of </span><span class="wear_damage">{this.getArmorWear()}</span>
        </div>);
    }
}


class CardWeapon extends Card {
    terselyDescribe() {
        if (this.getWeaponWear() === 0) {
            return super.terselyDescribe();
        } else {
            return `${this.getBase().getDisplayName()} - wear ${this.getWeaponWear()}`;
        }
    }
    fullyDescribe(baseCards) {
        if (this.getWeaponWear() === 0) {
            return super.fullyDescribe(baseCards);
        }
        let base = this.getBase();
        return (<div>
            <hr />
            <span><b>{base.getDisplayName()}</b> card: {base.getDescription()}.</span>
            <hr />
            <span>worth {base.getRawWeaponValue()}, but has wear damage of </span><span class="wear_damage">{this.getWeaponWear()}</span>
        </div>);
    }
}


class CardScore extends Card {
    fullyDescribe(baseCards) {
        let score = this.db.score_info;
        if (!score) {
            return super.fullyDescribe(baseCards);
        }
        // oof, a lot to say here.
        // could compute this once and store it in the BE, but I don't
        // want the BE to be in the business of storing HTML. Plus
        // computers is fast.
        let outlineBaseId = this.db.score_info.outline_id;
        let outlineBase = baseCards[outlineBaseId];
        if (!outlineBase) {
            console.warn(`can't find outline ${outlineBaseId}`);
            return super.fullyDescribe(baseCards);
        }
        let recipeBaseId = this.db.score_info.recipe_id;
        let recipeBase = baseCards[recipeBaseId];
        if (!recipeBase) {
            console.warn(`can't find recipe ${recipeBaseId}`);
            return super.fullyDescribe(baseCards);
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
                    <StepDisplay step={step} />
                    <span className={`score_${amountScore}`}>{amount}</span>
                    &nbsp;of&nbsp;
                    <span className={`score_${ingredientScore}`}>{ingredient.getDisplayName()}</span>
                </div>
                stepDescrs.push(stepDescr);
            }
            return stepDescrs;
        }

        return (<div>
            <span>{whenStr} score for a try at the <i>{recipeBase.getDisplayName()}</i> recipe,
                with {numSteps} steps.</span>
            <hr />
            {fillInSteps(this.db.score_info, baseCards)}
            <hr />
            <span>Legend:</span>
            <br /><span class="score_2">X</span> -- right!
            <br /><span class="score_1">X</span> -- right value, wrong position
            <br /><span class="score_0">X</span> -- value not in the recipe.
        </div>);

    }
    isLearningFor(baseCardId) {
        let info = this.getScoreInfo();
        return (info && info.outline_id === baseCardId);
    }

}


export default Card;
