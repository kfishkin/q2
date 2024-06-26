

import { Affinities, AffinityLabels } from './types/Affinities';
import StepDisplay from './StepDisplay';
import dayjs from 'dayjs';
import { LoreTypes } from './types/LoreTypes';
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
            case BaseCard.CARD_TYPES.LORE:
                return new CardLore(db);
            case BaseCard.CARD_TYPES.RECIPE:
                if (db.game_card.handle.startsWith('horn_of_plenty_')) {
                    return new CardHornOfPlenty(db);
                } else {
                    return new CardRecipe(db);
                }
            default:
                return new Card(db);
        }
    }

    canUseToUnlockRecipe(recipeBaseCard) {
        return false;
    }

    descriptionBackgroundImageURL() {
        return this.getBase().descriptionBackgroundImageURL();
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

    getLevel() {
        return this.baseCard.getLevel();
    }

    getMakersMark() {
        return this.db.makers_mark;
    }

    getScoreInfo() {
        return this.db.score_info;
    }

    getAffinity() {
        if (this.db.armor_info) {
            return this.db.armor_info.affinity;
        } else if (this.db.weapon_info) {
            return this.db.weapon_info.affinity;
        } else {
            return this.baseCard.getAffinity();
        }
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

    inBackpack() {
        return (this.db && ('in_backpack' in this.db)) ? this.db.in_backpack : false;
    }

    isBackpackable() {
        return false; // over-ride in subclasses
    }

    isLearningFor(baseCardId) {
        return false;
    }

    isLocked() {
        return this.db.is_locked;
    }

    setBackpack(val) {
        this.db.in_backpack = val;
    }

    terselyDescribe() {
        let msg = this.getBase().getDisplayName();
        if (this.getMakersMark()) {
            msg += " (you made)";
        }
        return msg;
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

class CardLore extends Card {
    terselyDescribe() {
        let parts = [];
        parts.push(this.getBase().getDisplayName());

        let lore_info = this.db.lore_info;
        let type = this.getBase().getDb().lore_info.type;

        switch (type) {
            case LoreTypes.TO_AFFINITY:
                parts.push(` (${AffinityLabels[this.getAffinity()]} affinity)`);
                break;
            // TODO: recipe bound
            default:
                break;
        }

        let english = lore_info.value === 1 ? 'point' : 'points';
        parts.push(` (${lore_info.value} ${english})`);
        return parts.join('');
    }

    fullyDescribe(baseCards) {
        let lore_info = this.db.lore_info;
        let parts = [];
        parts.push(<span><span className='lore_value'>{lore_info.value}</span>{(lore_info.value === 1 ? 'point ' : 'points ')}</span>);
        let type = this.getBase().getDb().lore_info.type;
        let ofWhat = '';
        switch (type) {
            case LoreTypes.MUNDANE: ofWhat = 'generic lore'; break;
            case LoreTypes.TO_AFFINITY: ofWhat = 'affinity-bound lore'; break;
            case LoreTypes.TO_RECIPE: {
                ofWhat = 'recipe-bound';
                // find the recipe it points to.
                let to_id = lore_info.to_recipe_id;
                let toBase = baseCards[to_id];
                if (toBase) {
                    ofWhat = `towards the level ${toBase.getLevel()} '${toBase.getDisplayName()}' recipe`;
                }
            }
            break;
            default: ofWhat = 'Unknown'; break;
        }
        parts.push(<span> <span className='lore_type'>{ofWhat}</span> </span>);
        if (lore_info.how_obtained) {
            parts.push(<br />, <span>Obtained by {lore_info.how_obtained}</span>);
        }
        return (<div>{parts}</div>)
    }

    /**
     * Checks if this card can help unlock the given recipe base card
     * @param {BaseCard} recipeBaseCard 
     * @returns {String} an explanation of why NOT. If empty, then it's ok to use.
     */

    canUseToUnlockRecipe(recipeBaseCard) {
        if (!recipeBaseCard || !recipeBaseCard.isRecipe()) {
            return "not a recipe";
        }
        let type = this.getBase().getDb().lore_info.type;
        switch (type) {
            case LoreTypes.MUNDANE:
                return '';
            case LoreTypes.TO_AFFINITY:
                // my affinity needs to be the same as the recipes, and can't be NONE.
                let meAff = this.getBase().getAffinity();
                let theyAff = recipeBaseCard.getAffinity();
                // eslint-disable-next-line
                if (meAff != theyAff) {
                    return 'affinity mismatch';
                }
                // eslint-disable-next-line
                if (meAff == Affinities.NONE) {
                    return 'has no affinity';
                }
                return '';
            case LoreTypes.TO_RECIPE:
                let desiredId = this.getDb().lore_info.to_recipe_id;
                return desiredId === recipeBaseCard.getId() ? '' : 'wrong recipe';
            default:
                return '??';
        }
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

class CardHornOfPlenty extends CardMachine {

}

class CardArmor extends Card {
    terselyDescribe() {
        let msg = super.terselyDescribe();
        let affinity = this.getAffinity() || Affinities.NONE;
        if (affinity !== Affinities.NONE) {
            msg += `(${AffinityLabels[affinity]} affinity)`;
        }
        if (this.getArmorWear() > 0) {
            msg += ` (wear ${this.getArmorWear()})`;
        }
        return msg;
    }

    fullyDescribe(baseCards) {
        let parts = []; // build it up.
        parts.push(<span><b>{this.getBase().getDisplayName()}</b>, armor value <b>{this.getBase().getRawArmorValue()}</b>.</span>)
        let wear = this.getArmorWear();
        if (wear > 0) {
            parts.push(<span>knocked down to <b>{this.getNetArmorValue()}</b> by wear of <span className='wear_damage'>{wear}</span></span>)
        }
        let affinity = this.getAffinity() || Affinities.NONE;
        if (affinity !== Affinities.NONE) {
            parts.push(<div><hr /><span>Enchanted to <span className='affinity'>{AffinityLabels[affinity]} affinity</span></span></div>);
        }
        let mark = this.getDb().makers_mark;
        if (mark && mark.when) {
            parts.push(<div><hr /><span>You made this on {dayjs(mark.when).format("LL")}</span></div>);
        }
        return <div>{parts}</div>;
    }
    isBackpackable() {
        return true;
    }
}


class CardWeapon extends Card {
    terselyDescribe() {
        let msg = super.terselyDescribe();
        let affinity = this.getAffinity() || Affinities.NONE;
        if (affinity !== Affinities.NONE) {
            msg += `(${AffinityLabels[affinity]} affinity)`;
        }
        if (this.getWeaponWear() > 0) {
            msg += ` (wear ${this.getWeaponWear()})`;
        }
        return msg;
    }

    fullyDescribe(baseCards) {
        let parts = []; // build it up.
        parts.push(<span><b>{this.getBase().getDisplayName()}</b>, weapon value <b>{this.getBase().getRawWeaponValue()}</b>.</span>)
        let wear = this.getWeaponWear();
        if (wear > 0) {
            parts.push(<span>knocked down to <b>{this.getNetWeaponValue()}</b> by wear of <span className='wear_damage'>{wear}</span></span>)
        }
        let affinity = this.getAffinity() || Affinities.NONE;
        if (affinity !== Affinities.NONE) {
            parts.push(<div><hr /><span>Enchanted to <span className='affinity'>{AffinityLabels[affinity]} affinity</span></span></div>);
        }
        let mark = this.getDb().makers_mark;
        if (mark && mark.when) {
            parts.push(<div><hr /><img src="pix/general/hammer_and_anvil.png" width="32" title="You made this" alt="You made this" />
                <span>You made this on {dayjs(mark.when).format("LL")}</span></div>);
        }
        return <div>{parts}</div>;
    }
    isBackpackable() {
        return true;
    }
}

class CardRecipe extends Card {
    fullyDescribe(baseCards) {
        if (!this.isLocked()) {
            return super.fullyDescribe(baseCards);
        }
        let recipe = this.getBase().getRecipe();
        let cost = (recipe && ('lore_cost' in recipe)) ? recipe.lore_cost : 'Unknown';
        return (<div>
            <span className='recipe_name'>{this.getBase().getDisplayName()} recipe.</span>
            <br />{this.getBase().getDescription()}
            <hr />
            <span>Locked:
                <span className='recipe_cost'>{cost}</span><span> lore points to unlock.</span>
            </span>
        </div>);
    }

    descriptionBackgroundImageURL() {
        if (!this.isLocked()) {
            return super.descriptionBackgroundImageURL();
        }
        return "pix/card_backgrounds/locked_recipe.png";

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
            <br /><span className="score_2">X</span> -- right!
            <br /><span className="score_1">X</span> -- right value, wrong position
            <br /><span className="score_0">X</span> -- value not in the recipe.
        </div>);

    }
    isLearningFor(baseCardId) {
        let info = this.getScoreInfo();
        return (info && info.outline_id === baseCardId);
    }

}


export default Card;
