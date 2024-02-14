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
    BATTLE_MODIFIER: 8,
    INGREDIENT: 9,
    TICKET: 10,
    SCORE: 11,
    ARMOR: 12
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

    GetType() {
        return this.type;
    }

    GetRawArmorValue() {
        return 'armor_value' in this.db ? this.db.armor_value : 0;
    }

    GetRawWeaponValue() {
        return 'weapon_value' in this.db ? this.db.weapon_value : 0;
    }
    
    GetId() {
        return this.db._id;
    }

    GetInputPickerComponentName() {
        return "none";
    }

    GetLevel() {
        return this.db.level;
    }

    GetGameId() {
        return this.db.game_id;
    }

    GetSellValue() {
        return this.db.sell_value;
    }

    // all the below can/should be over-ridden by subclasses..
    // the alt text for a type of card
    AltText() {
        return "";
    }
    OpaqueBeforeBuying() {
        return false;
    }

    GetDescription() {
        return this.db.description;
    }

    GetDisplayName() {
        return this.db.display_name;
    }
    OpaqueDisplayName() {
        return this.db.display_name;
    }
    // the URL of the small icon for this type of card
    IconURL() {
        return "pix/card_types/none.png";
    }
    
    IsMoney() {
        return false;
    }
    IsJudgeable() {
        return false;
    }
    IsScore() {
        return false;
    }

    DescriptionBackgroundImageURL() {
        return "";
    }
    CanMakeCards() {
        return false;
    }

    // fully describe the semantics of this card, which is of this type
    FullyDescribe(baseCards) {
        return <div><hr /><b>{this.db.display_name}</b> card: {this.db.description}</div>;
    }

    GetNumInputs() {
        return 0;
    }
    GetRecipeOutline() {
        return null;
    }

    GetRecipeInfo() {
        return this.db.recipe;
    }

    // factory method: make one for a given game card:
    static make(type, db) {
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
            case CARD_TYPES.RECIPE: return new CardTypeRecipe(db);
            case CARD_TYPES.WEAPON: return new CardTypeWeapon(db);
            case CARD_TYPES.ARMOR: return new CardTypeArmor(db);
            case CARD_TYPES.BATTLE_MODIFIER: return new CardTypeBattleModifier(db);
            case CARD_TYPES.INGREDIENT: return new CardTypeIngredient(db);
            case CARD_TYPES.TICKET: return new CardTypeTicket(db);
            case CARD_TYPES.SCORE: return new CardTypeScore(db);
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
    AltText() { return "None" }
}
// a Money card
class CardTypeMoney extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.MONEY, db);
    }
    AltText() { return "$" }
    IconURL() { return "pix/card_types/money.png"; }
    IsMoney() {
        return true;
    }

    DescriptionBackgroundImageURL() {
        return `pix/card_backgrounds/money_${this.db.sell_value}.png`;
    }
}
// a Life card
class CardTypeLife extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.LIVES, db);
    }
    AltText() { return "Life" }
    IconURL() { return "pix/card_types/life.png"; }
    DescriptionBackgroundImageURL(card) {
        return `pix/card_backgrounds/life2.png`;
    }
}

// a Clue card
class CardTypeClue extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.CLUE, db);
    }
    AltText() { return "Clue" }
    IconURL() { return "pix/card_types/clue.png"; }
    DescriptionBackgroundImageURL() {
        return `pix/card_backgrounds/clue.png`;
    }
}

// a Machine card
class CardTypeMachine extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.MACHINE, db);
    }
    AltText() { return "Machine" }
    IconURL() { return "pix/card_types/machine.png"; }
    CanMakeCards() {
        return true;
    }
    GetNumInputs() {
        return this.db.machine.num_inputs;
    }    
}

// a Machine card
class CardTypeMachineHornOfPlenty extends CardTypeMachine {
    DescriptionBackgroundImageURL() {
                return "pix/general/horn_of_plenty_big.jpg";
    }
}

// a Machine card
class CardTypeMachineJudge extends CardTypeMachine {

    DescriptionBackgroundImageURL() {
        return "pix/card_backgrounds/judge2.png";
    }
    GetInputPickerComponentName() {
        return "WorkshopInputPickerJudge";

    }
}

// a Recipe Outline card
class CardTypeRecipeOutline extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.RECIPE_OUTLINE, db);
    }
    AltText() { return "Recipe Outline" }
    IconURL() { return "pix/card_types/recipe_outline.png"; }
    IsJudgeable() {
        return true;
    }
    GetRecipeOutline() {
        return this.db.recipe_outline;
    }    
    OpaqueBeforeBuying() {
        return true;
    }
    OpaqueDisplayName() {
        return "Recipe Outline"; // don't tell 'em what it's an outline for.
    }    
    FullyDescribe(baseCards) {
        let outline = this.db.recipe_outline;
        //console.log(`recipe outline fully describe of${JSON.stringify(outline)}`);
        if (!outline) return super.FullyDescribe(baseCards);

        let preamble = this.GetDescription();
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
                return baseCards[ingredId].GetDisplayName();
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
        return <div>The Recipe has <b>{outline.num_steps}</b> {stepWord}:<ol>{stepDescrs}</ol></div>;
    }
}
// a Recipe card
class CardTypeRecipe extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.RECIPE, db);
    }
    AltText() { return "Recipe" }
    IconURL() { return "pix/card_types/recipe.png" }
    DescriptionBackgroundImageURL() {
        return `pix/card_backgrounds/recipe.png`;
    }
    OpaqueBeforeBuying() {
        return true;
    }
    CanMakeCards() {
        return true;
    }
    GetInputPickerComponentName() {
        return "WorkshopInputPickerRecipe";

    }
    GetNumInputs() {
        return this.db.recipe.ingredients.length;
    }    
    FullyDescribe(baseCards) {
        let recipe = this.db.recipe;
        //console.log(`recipe outline fully describe of${JSON.stringify(outline)}`);
        if (!recipe) return super.FullyDescribe(baseCards);

        let numSteps = recipe.amounts.length;

        let stepDescrs = [];
        for (let step = 0; step < numSteps; step++) {
            let amount = recipe.amounts[step];
            let ingredient = baseCards[recipe.ingredients[step]].GetDisplayName();
            stepDescrs.push(<li><span>{amount} of {ingredient}</span></li>);
        }
        return <div className="recipe_description">The Recipe has <b>{numSteps}</b> steps:<ol>{stepDescrs}</ol></div>;
    }    

}
// a Weapon card
class CardTypeWeapon extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.WEAPON, db);
    }
    AltText() { return "Weapon" }
    IconURL() { return "pix/card_types/weapon.png"; }
    BattleModifierImage() {
        return "";
    }
    DescriptionBackgroundImageURL() {
        return `pix/card_backgrounds/${this.db.handle}.png`;
    }       
    FullyDescribe(baseCards) {
        // TODO: incorporate wear
        return super.FullyDescribe(baseCards);
    }
}

// an Armor card
class CardTypeArmor extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.ARMOR, db);
    }
    AltText() { return "Armor" }
    IconURL() { return "pix/card_types/armor.png"; }
    BattleModifierImage() {
        return "";
    }

    DescriptionBackgroundImageURL() {
        return `pix/card_backgrounds/${this.db.handle}.png`;
    }    
    FullyDescribe(baseCards) {
        // TODO: incorporate wear
        return super.FullyDescribe(baseCards);
    }
}


// must match what's in BE.
const BattleModifierType = {
    NONE: 0,
    FOG: 1,
    ENCHANTMENT: 2,
    RECON: 3
};
// a Battle Modifier card
class CardTypeBattleModifier extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.BATTLE_MODIFIER, db);
    }
    AltText() { return "Battle Modifier" }
    IconURL() { return "pix/card_types/battle_modifier.png"; }

    BattleModifierImage(card) {
        let modType = this.db.battle_modifier.type;

        switch (modType) {
            case BattleModifierType.FOG:
                return <img src="pix/general/fog.png" width="32" alt="fog" />
            case BattleModifierType.RECON:
                return <img src="pix/general/binocs_64.png" width="32" alt="recon" />
            case BattleModifierType.ENCHANTMENT:
                let modValue = this.db.battle_modifier.value;
                let url = `pix/general/plus_${modValue}.png`;
                return <img src={url} width="32" alt="enchantment" />
            default:
                return "";
        }
    }
}
// a Ingredient card
class CardTypeIngredient extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.INGREDIENT, db);
    }
    AltText() { return "Ingredient" }
    IconURL() { return "pix/card_types/ingredient.png"; }
}
// a Golden Ticket card
class CardTypeTicket extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.TICKET, db);
    }
    AltText() { return "Golden Ticket" }
    IconURL() { return "pix/card_types/golden_ticket.png"; }
}
// a Score card
class CardTypeScore extends BaseCard {
    constructor(db) {
        super(CARD_TYPES.SCORE, db);
    }
    AltText() { return "Score" }
    IconURL() { return "pix/card_types/score.png"; }
    IsScore() { return true; }
}

