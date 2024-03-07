// this must match the similar enum in the BE
export const CARD_TYPES = {
    NONE: 0,
    MONEY: 1,
    LIVES: 2,
    CLUE: 3,
    MACHINE: 4,
    RECIPE_OUTLINE: 5,
    RECIPE: 6,
    WEAPON: 7,
    BATTLE_MODIFIER: 8, // dead
    INGREDIENT: 9,
    LEARNING: 10,
    SCORE: 11,
    ARMOR: 12,
    MONSTER: 13,
    DECOR: 14,
    CATEGORY: 15,
    NUMBER: 16
};

/**
 * Describes the base cards - the 'platonic' cards which are then instanced in the game.
 * For example, there may be lots of $1 cards scattered about, but all point to one
 * single 'platonic' $1 'base card'.
 */
export class BaseCard { // abstract base class
    constructor(type, dbObj) {
        this.db = dbObj; // the database record for this guy.
        this.type = type;
    }

    // given a deck of cards, which of them are of me?
    ContainedInDeck(cards) {
        if (!cards) return [];
        return cards.filter((card) => {
            return card.getBase().getId() === this.getId()
        });
    }

    getType() {
        return this.type;
    }

    getRawArmorValue() {
        return 'armor_value' in this.db ? this.db.armor_value : 0;
    }

    getRawWeaponValue() {
        return 'weapon_value' in this.db ? this.db.weapon_value : 0;
    }

    getDb() {
        return this.db;
    }
    
    getHandle() {
        return this.db.handle;
    }
    
    getId() {
        return this.db._id;
    }

    getInputPickerComponentName() {
        return "none";
    }

    getLevel() {
        return this.db.level;
    }

    getGameId() {
        return this.db.game_id;
    }

    getSellValue() {
        return this.db.sell_value;
    }

    // all the below can/should be over-ridden by subclasses..
    // the alt text for a type of card
    altText() {
        return "";
    }
    opaqueBeforeBuying() {
        return false;
    }

    getDescription() {
        return this.db.description;
    }

    getDisplayName() {
        return this.db.display_name;
    }
    opaqueDisplayName() {
        return this.db.display_name;
    }
    // the URL of the small icon for this type of card
    iconURL() {
        return "pix/card_types/none.png";
    }
    isBuyable() {
        return ('buyable' in this.db) ? this.db.buyable : true;
    }
    isCategory() {
        return false;
    }
    isMoney() {
        return false;
    }
    isJudgeable() {
        return false;
    }
    isLife() { return false; }

    isSellable() {
        return ('sellable' in this.db) ? this.db.sellable : true;
    }

    isNothing() {
        return false;
    }

    descriptionBackgroundImageURL() {
        return "";
    }
    canMakeCards() {
        return false;
    }

    // fully describe the semantics of this card, which is of this type
    fullyDescribe(baseCards) {
        return <div><hr /><b>{this.db.display_name}</b> card: {this.db.description}</div>;
    }

    getNumInputs() {
        return 0;
    }
    getRecipeOutline() {
        return null;
    }

    getRecipeInfo() {
        return this.db.recipe;
    }

    // factory method: make one for a given game card:
    static make(type, db) {
        if (db.db) { // was already made
            return db;
        }
        switch (type) {
            case CARD_TYPES.NONE: return new CardTypeNothing(db);
            case CARD_TYPES.MONEY: return new CardTypeMoney(db);
            case CARD_TYPES.LIVES: return new CardTypeLife(db);
            case CARD_TYPES.CLUE: return new CardTypeClue(db);
            case CARD_TYPES.MACHINE: 
                    // must match with BE: TODO - put enum defs in a shared place.
                const MachineType = {
                    NONE: 0,
                    JUDGE: 1,
                    CRYSTAL_BALL: 2,
                    HORN_OF_PLENTY: 3,
                    FORENSICS: 4
                };
                let machineType = db.machine.type;
                switch (machineType) {
                    case MachineType.HORN_OF_PLENTY:
                        return new CardTypeMachineHornOfPlenty(db);
                    case MachineType.JUDGE:
                        return new CardTypeMachineJudge(db);
                        default:
                            return new CardTypeMachine(db);
                }
            case CARD_TYPES.RECIPE_OUTLINE: return new CardTypeRecipeOutline(db);
            case CARD_TYPES.RECIPE: 
              if (db.handle.startsWith('recipe_forensics_')) {
                return new CardTypeRecipeForensics(db);
              } else {
                return new CardTypeRecipe(db);
              }

            case CARD_TYPES.WEAPON: return new CardTypeWeapon(db);
            case CARD_TYPES.ARMOR: return new CardTypeArmor(db);
            case CARD_TYPES.INGREDIENT: return new CardTypeIngredient(db);
            case CARD_TYPES.LEARNING: return new CardTypeLearning(db);
            case CARD_TYPES.SCORE: return new CardTypeScore(db);
            case CARD_TYPES.MONSTER: return new CardTypeMonster(db);
            case CARD_TYPES.DECOR: return new CardTypeDecor(db);
            case CARD_TYPES.NUMBER: return new CardTypeNumber(db);
            case CARD_TYPES.CATEGORY: 
              switch (db.handle) {
                case 'category_armor': return new CardTypeCategoryArmor(db);
                case 'category_clue': return new CardTypeCategoryClue(db);
                case 'category_gear': return new CardTypeCategoryGear(db);
                case 'category_outline': return new CardTypeCategoryOutline(db);
                case 'category_weapon': return new CardTypeCategoryWeapon(db);
                case 'category_number': return new CardTypeCategoryNumber(db);
                default:
                    console.warn(`unknown category handle: ${db.handle}`);
                    return new CardTypeNothing(db)
              }
            default:
                console.warn(`gc.type of ${type} unknown`);
                return new CardTypeNothing(db);

        }
    }
}

// the 'Nothing' card
class CardTypeNothing extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.NONE, db);
    }
    altText() { return "None" }
    isNothing() { return true; }
}

class CardTypeNumber extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.NUMBER, db);
    }
    altText() { return "None" }
    isNothing() { return true; }
}

// a Money card
class CardTypeMoney extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.MONEY, db);
    }
    altText() { return "$" }
    iconURL() { return "pix/card_types/money.png"; }
    isMoney() {
        return true;
    }

    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/money_${this.db.sell_value}.png`;
    }
}

class CardTypeDecor extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.DECOR, db);
    }

    altText() { return "" }
    isNothing() { return true; }
    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/${this.getHandle()}.png`;
    }
}

// a Life card
class CardTypeLife extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.LIVES, db);
    }
    altText() { return "Life" }
    iconURL() { return "pix/card_types/life.png"; }
    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/life2.png`;
    }
    isLife() { return true; }
}

// a Clue card
class CardTypeClue extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.CLUE, db);
    }
    altText() { return "Clue" }
    iconURL() { return "pix/card_types/clue.png"; }
    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/clue.png`;
    }
}

// a Machine card
class CardTypeMachine extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.MACHINE, db);
    }
    altText() { return "Machine" }
    iconURL() { return "pix/card_types/machine.png"; }
    canMakeCards() {
        return true;
    }
    getNumInputs() {
        return this.db.machine.num_inputs;
    }    
}

// a Machine card
class CardTypeMachineHornOfPlenty extends CardTypeMachine {
    descriptionBackgroundImageURL() {
                return "pix/general/horn_of_plenty_big.jpg";
    }
}

// a Machine card
class CardTypeMachineJudge extends CardTypeMachine {

    descriptionBackgroundImageURL() {
        return "pix/card_backgrounds/judge2.png";
    }
    getInputPickerComponentName() {
        return "WorkshopInputPickerJudge";

    }
}

// a Recipe Outline card
class CardTypeRecipeOutline extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.RECIPE_OUTLINE, db);
    }
    altText() { return "Recipe Outline" }
    iconURL() { return "pix/card_types/recipe_outline.png"; }
    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/recipe_outline.png`;
    }
    isJudgeable() {
        return true;
    }
    getRecipeOutline() {
        return this.db.recipe_outline;
    }    
    opaqueBeforeBuying() {
        return true;
    }
    opaqueDisplayName() {
        return "Recipe Outline"; // don't tell 'em what it's an outline for.
    }    
    fullyDescribe(baseCards) {
        let outline = this.db.recipe_outline;
        //console.log(`recipe outline fully describe of${JSON.stringify(outline)}`);
        if (!outline) return super.fullyDescribe(baseCards);

        let preamble = this.getDescription();
        if (outline.num_steps === 0) {
            return <div>{preamble}, which has <i>no</i> inputs</div>
        }

        let amountString = (amtArray) => {
            if (amtArray.length === 1) return (<b>{amtArray[0]}</b>);
            let firstPart = amtArray.slice(0, -1).join();
            let lastOne = amtArray[amtArray.length - 1];
            return (<b>({firstPart} or {lastOne})</b>);
        }
        let ingredientString = (ingredArray) => {
            let ingredName = (ingredId, index) => {
                if (!ingredId) return "null";
                return baseCards[ingredId].getDisplayName();
            };

            
            let firstPart = ingredArray.slice(0, -1).map((id, index) => ingredName(id, index)).join(', ');
            let lastOne = ingredName(ingredArray[ingredArray.length - 1]);
            if (ingredArray.length === 1) return (<b>{lastOne}</b>);
            return (<b>({firstPart} or {lastOne})</b>);
        }

        let stepWord = (outline.num_steps === 1) ? "step" : "steps";
        let stepDescrs = [];
        for (let step = 0; step < outline.num_steps; step++) {
            let possible_amounts = outline.possible_amounts[step];
            let amtDescr = amountString(possible_amounts);
            let ingredDescr = ingredientString(outline.possible_ingredients[step]);
            stepDescrs.push(<li><span>{amtDescr} of {ingredDescr}</span></li>);
        }
        return <div steps={outline.num_steps}>The Recipe has <b>{outline.num_steps}</b> {stepWord}:<ol className="step_list">{stepDescrs}</ol></div>;
    }
}
// a Recipe card
class CardTypeRecipe extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.RECIPE, db);
    }
    altText() { return "Recipe" }
    iconURL() { return "pix/card_types/recipe.png" }
    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/recipe.png`;
    }
    opaqueBeforeBuying() {
        return true;
    }
    canMakeCards() {
        return true;
    }
    getInputPickerComponentName() {
        return "WorkshopInputPickerRecipe";

    }
    getNumInputs() {
        return this.db.recipe.ingredients.length;
    }    
    fullyDescribe(baseCards) {
        let recipe = this.db.recipe;
        //console.log(`recipe outline fully describe of${JSON.stringify(outline)}`);
        if (!recipe) return super.fullyDescribe(baseCards);

        let numSteps = recipe.amounts.length;

        let stepDescrs = [];
        for (let step = 0; step < numSteps; step++) {
            let amount = recipe.amounts[step];
            let ingredient = baseCards[recipe.ingredients[step]].getDisplayName();
            stepDescrs.push(<li key={`ingred_${step}`}><span>{amount} of {ingredient}</span></li>);
        }
        return <div className="recipe_description">The Recipe has <b>{numSteps}</b> steps:<ol className="step_list">{stepDescrs}</ol></div>;
    }    
}

class CardTypeRecipeForensics extends CardTypeRecipe {
    altText() { return "Forensics Lab"}
    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/forensics.png`;
    }
    fullyDescribe(baseCards) {
        return (<div>
            Given a piece of armor or weaponry of level &le; {this.getLevel()},
            returns a recipe outline for how to make that piece,
            if one exists. The input is <i>destroyed</i> in the process.
        </div>) 
    }
}

// a Weapon card
class CardTypeWeapon extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.WEAPON, db);
    }
    altText() { return "Weapon" }
    iconURL() { return "pix/card_types/weapon.png"; }

    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/${this.db.handle}.png`;
    }       
    fullyDescribe(baseCards) {
        // TODO: incorporate wear
        return super.fullyDescribe(baseCards);
    }
}

// an Armor card
class CardTypeArmor extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.ARMOR, db);
    }
    altText() { return "Armor" }
    iconURL() { return "pix/card_types/armor.png"; }


    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/${this.db.handle}.png`;
    }    
    fullyDescribe(baseCards) {
        // TODO: incorporate wear
        return super.fullyDescribe(baseCards);
    }
}


// a Ingredient card
class CardTypeIngredient extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.INGREDIENT, db);
    }
    altText() { return "Ingredient" }
    iconURL() { return "pix/card_types/ingredient.png"; }
}

// a Score card
class CardTypeScore extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.SCORE, db);
    }
    altText() { return "Score" }
    iconURL() { return "pix/card_types/score.png"; }
}

// a Learning card
class CardTypeLearning extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.LEARNING, db);
    }
    altText() { return "Learning" }
    descriptionBackgroundImageURL() {
        return `pix/card_backgrounds/learning.png`;
    }    
}

class CardTypeMonster extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.MONSTER, db);


    }
    altText() { return "Monster"}
    getSellValue() {
        return 0
    }
    descriptionBackgroundImageURL() {
        return `pix/monsters/${this.getHandle()}.png`;
    }    
}

class CardTypeCategory extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.CATEGORY, db);
    }

    isCategory() { return true; }
    isNothing() { return true; }

    cardsOfType(deck, type) {
        if (!deck) return [];
        return deck.filter((c) => c.getBase().getType() === type);
    }
}

class CardTypeCategoryArmor extends CardTypeCategory {

    getDisplayName() { return 'an Armor card with wear' };
    ContainedInDeck(cards) {
        return super.cardsOfType(cards, CARD_TYPES.ARMOR);
    }
}

class CardTypeCategoryClue extends CardTypeCategory {
    getDisplayName() { return 'a Clue card' };
    ContainedInDeck(cards) {
        return super.cardsOfType(cards, CARD_TYPES.CLUE);
    }    
}

class CardTypeCategoryGear extends CardTypeCategory {
    getDisplayName() { return 'a piece of gear' };
    ContainedInDeck(cards) {
        return super.cardsOfType(cards, CARD_TYPES.ARMOR).concat(super.cardsOfType(cards, CARD_TYPES.WEAPON))
          .filter((card) => card.getLevel() <= this.getLevel());
    }    
}

class CardTypeCategoryOutline extends CardTypeCategory {
    getDisplayName() { return 'a Recipe Outline card' };
    ContainedInDeck(cards) {
        return super.cardsOfType(cards, CARD_TYPES.RECIPE_OUTLINE);
    }    
}

class CardTypeCategoryWeapon extends CardTypeCategory {
    getDisplayName() { return 'a Weapon card' };
    ContainedInDeck(cards) {
        return super.cardsOfType(cards, CARD_TYPES.WEAPON);
    }
}


class CardTypeCategoryNumber extends CardTypeCategory {
    getDisplayName() { return 'a Number card' };
    ContainedInDeck(cards) {
        return cards.filter((c) => c.getBase().getHandle().startsWith('number_'));
    }
}