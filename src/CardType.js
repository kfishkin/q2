// this must match the similar enum in the BE
export const CARD_TYPES = {
    NONE: 0,
    MONEY: 1,
    LIVES: 2,
    CLUE: 3,
    MACHINE: 4,
    RECIPE_OUTLINE: 5,
    RECIPE: 6,
    BATTLE: 7,
    BATTLE_MODIFIER: 8,
    INGREDIENT: 9,
    TICKET: 10,
};

/**
 * Describes a type of card and its semantics.
 * In the future, cards could have more than one type, but for now no.
 */
export class CardType { // abstract base class
    constructor(type) {
        this.type = type;
    }

    GetType() {
        return this.type;
    }

    // the alt text for a type of card
    AltText() {
        return "";
    }

    // the URL of the small icon for this type of card
    IconURL() {
        return "pix/card_types/none.png";
    }

    
    DescriptionBackgroundImageURL(card) {
        return "";
    }

    // fully describe the semantics of this card, which is of this type
    FullyDescribe(card, gameInfo, playerDeck) {
        return <div><hr /><b>{card.game_card.display_name}</b> card: {card.game_card.description}</div>;
    }

    // factory method: make one for a given game card:
    static make(type) {
        switch (type) {
            case CARD_TYPES.NONE: return new CardTypeNothing();
            case CARD_TYPES.MONEY: return new CardTypeMoney();
            case CARD_TYPES.LIVES: return new CardTypeLife();
            case CARD_TYPES.CLUE: return new CardTypeClue();
            case CARD_TYPES.MACHINE: return new CardTypeMachine();
            case CARD_TYPES.RECIPE_OUTLINE: return new CardTypeRecipeOutline();
            case CARD_TYPES.RECIPE: return new CardTypeRecipe();
            case CARD_TYPES.BATTLE: return new CardTypeBattle();
            case CARD_TYPES.BATTLE_MODIFIER: return new CardTypeBattleModifier();
            case CARD_TYPES.INGREDIENT: return new CardTypeIngredient();
            case CARD_TYPES.TICKET: return new CardTypeTicket();
            default:
                console.warn(`gc.type of ${type} unknown`);
                return new CardTypeNothing();

        }
    }
}

// the 'Nothing' card
class CardTypeNothing extends CardType {
    constructor() {
        super(CARD_TYPES.NONE);
    }
    AltText() { return "None" }
}
// a Money card
class CardTypeMoney extends CardType {
    constructor() {
        super(CARD_TYPES.MONEY);
    }
    AltText() { return "$" }
    IconURL() { return "pix/card_types/money.png"; }

    DescriptionBackgroundImageURL(card) {
        return `pix/card_backgrounds/money_${card.game_card.sell_value}.png`;
    }
}
// a Life card
class CardTypeLife extends CardType {
    constructor() {
        super(CARD_TYPES.LIVES);
    }
    AltText() { return "Life" }
    IconURL() { return "pix/card_types/life.png"; }
    DescriptionBackgroundImageURL(card) {
        return `pix/card_backgrounds/life2.png`;
    }
}

// a Clue card
class CardTypeClue extends CardType {
    constructor() {
        super(CARD_TYPES.CLUE);
    }
    AltText() { return "Clue" }
    IconURL() { return "pix/card_types/clue.png"; }
    DescriptionBackgroundImageURL(card) {
        return `pix/card_backgrounds/clue.png`;
    }
}

// a Machine card
class CardTypeMachine extends CardType {
    constructor() {
        super(CARD_TYPES.MACHINE);
    }
    AltText() { return "Machine" }
    IconURL() { return "pix/card_types/machine.png"; }

    DescriptionBackgroundImageURL(card) {
        // TODO: clean this up.
        if (!card || !card.game_card || !card.game_card.machine) {
            return "";
        }
        // must match with BE: TODO - put enum defs in a shared place.
        const MachineType = {
            NONE: 0,
            JUDGE: 1,
            CRYSTAL_BALL: 2,
            HORN_OF_PLENTY: 3,
            FORENSICS: 4
        };
        let typ = card.game_card.machine.type;
        switch (typ) {
            case MachineType.HORN_OF_PLENTY:
                return "pix/general/horn_of_plenty_big.jpg";
            case MachineType.JUDGE:
                return "pix/card_backgrounds/judge2.png";
            default: // shut up linter
        }
        return "";
    }
}

// a Recipe Outline card
class CardTypeRecipeOutline extends CardType {
    constructor() {
        super(CARD_TYPES.RECIPE_OUTLINE);
    }
    AltText() { return "Recipe Outline" }
    IconURL() { return "pix/card_types/recipe_outline.png"; }
    FullyDescribe(card, gameInfo, playerDeck) {
        let outline = card.game_card.recipe_outline;
        console.log(`recipe outline fully describe of${JSON.stringify(outline)}`);
        if (!outline) return super.FullyDescribe(card);

        let preamble = card.game_card.description;
        if (outline.num_steps === 0) {
            return <div>{preamble}, which has <i>no</i> inputs</div>
        }
        let baseCardCounts = {}; // key: base card id. value: # of times found.
        if (playerDeck) playerDeck.forEach((card) => {
            let prev = (card.game_card._id in baseCardCounts) ? baseCardCounts[card.game_card._id] : 0;
            baseCardCounts[card.game_card._id] = prev + 1;
        });
        console.log(`baseCardCounts = ${JSON.stringify(baseCardCounts)}`);

        let amountString = (amtArray) => {
            if (amtArray.length === 1) return (<b>{amtArray[0]}</b>);
            let firstPart = amtArray.slice(0, -1).join();
            let lastOne = amtArray[amtArray.length - 1];
            return (<b>({firstPart} or {lastOne})</b>);
        }
        let ingredientString = (ingredArray) => {
            let ingredName = (ingredId, index) => { // note it returns html.
                if (!ingredId) return "null";
                if (!gameInfo || !gameInfo.baseCards) return ingredId + "A";
                if (!(ingredId in gameInfo.baseCards)) return ingredId + "B";
                let amtHave = (ingredId in baseCardCounts) ? baseCardCounts[ingredId] : 0;
                let has = (amtHave > 0);
                return <span has={has ? "yes" : "no"}>{index > 0 ? ", " : ""}{gameInfo.baseCards[ingredId].display_name}</span>;
            };

            if (ingredArray.length === 1) return (<b>{ingredArray[0]}</b>);
            let firstPart = ingredArray.slice(0, -1).map((id, index) => ingredName(id, index));
            let lastOne = ingredName(ingredArray[ingredArray.length - 1]);
            return (<b>({firstPart} or {lastOne})</b>);
        }

        let stepWord = (outline.num_steps === 1) ? "step" : "steps";
        let stepDescrs = [];
        for (let step = 0; step < outline.num_steps; step++) {
            let possible_amounts = outline.possible_amounts[step];
            let amtDescr = amountString(possible_amounts);
            let ingredDescr = ingredientString(outline.possible_ingredients[step]);
            stepDescrs.push(<li><span><b>Step #{step + 1}:</b></span><span>is {amtDescr} of {ingredDescr}</span></li>);
        }
        return <div>The Recipe has <b>{outline.num_steps}</b> {stepWord}:<ol>{stepDescrs}</ol>
            <br />Ingredients look like <span has="yes">This</span> if you have them, <span has="no">That</span> if you don't</div>;
    }
}
// a Recipe card
class CardTypeRecipe extends CardType {
    constructor() {
        super(CARD_TYPES.RECIPE);
    }
    AltText() { return "Recipe" }
    IconURL() { return "pix/card_types/recipe.png" }
    DescriptionBackgroundImageURL(card) {
        return `pix/card_backgrounds/recipe.png`;
    }

}
// a Battle card
class CardTypeBattle extends CardType {
    constructor() {
        super(CARD_TYPES.BATTLE);
    }
    AltText() { return "Battle" }
    IconURL() { return "pix/card_types/battle.png"; }
    BattleModifierImage(card) {
        return "";
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
class CardTypeBattleModifier extends CardType {
    constructor() {
        super(CARD_TYPES.BATTLE_MODIFIER);
    }
    AltText() { return "Battle Modifier" }
    IconURL() { return "pix/card_types/battle_modifier.png"; }

    BattleModifierImage(card) {
        let modType = card.game_card.battle_modifier.type;

        switch (modType) {
            case BattleModifierType.FOG:
                return <img src="pix/general/fog.png" width="32" alt="fog" />
            case BattleModifierType.RECON:
                return <img src="pix/general/binocs_64.png" width="32" alt="recon" />
            case BattleModifierType.ENCHANTMENT:
                let modValue = card.game_card.battle_modifier.value;
                let url = `pix/general/plus_${modValue}.png`;
                return <img src={url} width="32" alt="enchantment" />
            default:
                return "";


        }
    }
}
// a Ingredient card
class CardTypeIngredient extends CardType {
    constructor() {
        super(CARD_TYPES.INGREDIENT);
    }
    AltText() { return "Ingredient" }
    IconURL() { return "pix/card_types/ingredient.png"; }
}
// a Golden Ticket card
class CardTypeTicket extends CardType {
    constructor() {
        super(CARD_TYPES.TICKET);
    }
    AltText() { return "Golden Ticket" }
    IconURL() { return "pix/card_types/golden_ticket.png"; }
}

