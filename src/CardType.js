import dayjs from 'dayjs';
import { USE_SETTINGS, USE_STATUS } from './Card';
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

    // fully describe the semantics of this card, which is of this type
    FullyDescribe(card, gameInfo, playerDeck) {
        return <div><hr /><b>{card.game_card.display_name}</b> card: {card.game_card.description}</div>;
    }

    /**
     * Is this card usable now for this context?
     * Returns a tuple:
     *   entry 0 - YES, NO, or UNKNOWN
     *   entry 1 - a React node indicating why/why not.
     * I return UNKNOWN if the answer is a function of the details of the particular instance
     * of the card - I only return an answer if the answer is the same for all instances.
     */
    DetermineUsability(card, useSetting, deck, baseCards) {
        // everything can be sold, everything can be used in battle:
        if (useSetting === USE_SETTINGS.BATTLE) {
            return [USE_STATUS.YES, <span>All cards can be used as battle cards</span>];
        }
        if (useSetting === USE_SETTINGS.SELLING) {
            return [USE_STATUS.YES, <span>All cards can be sold</span>]; // maybe not later...
        }
        if (useSetting === USE_SETTINGS.BUYING) {
            return [USE_STATUS.YES, <span>All cards can be bought</span>]; // maybe not later...
        }
        // otherwise...
        return [USE_STATUS.UNKNOWN, <span>Don't know yet...</span>];
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
                console.warn(`gc.type of ${type.type} unknown`);
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
    DetermineUsability(card, useSetting, deck, baseCards) {
        let tuple = super.DetermineUsability(card, useSetting, deck, baseCards);
        if (tuple[0] === USE_STATUS.UNKNOWN) {
            return [USE_STATUS.NO, <span>The 'nothing' card has no special use.</span>]
        }
    }
}
// a Money card
class CardTypeMoney extends CardType {
    constructor() {
        super(CARD_TYPES.MONEY);
    }
    AltText() { return "$" }
    IconURL() { return "pix/card_types/money.png"; }
    DetermineUsability(card, useSetting, deck, baseCards) {
        let tuple = super.DetermineUsability(card, useSetting, deck, baseCards);
        if (tuple[0] === USE_STATUS.UNKNOWN) {
            return [USE_STATUS.NO, <span>Money cards have no special use outside of buying or selling.</span>]
        }
    }
}
// a Life card
class CardTypeLife extends CardType {
    constructor() {
        super(CARD_TYPES.LIVES);
    }
    AltText() { return "Life" }
    IconURL() { return "pix/card_types/life.png"; }
    DetermineUsability(card, useSetting, deck, baseCards) {
        let tuple = super.DetermineUsability(card, useSetting, deck, baseCards);
        if (tuple[0] === USE_STATUS.UNKNOWN) {
            return [USE_STATUS.NO, <span>Money cards have no special use outside of buying or selling.</span>]
        }
    }
}

// a Clue card
class CardTypeClue extends CardType {
    constructor() {
        super(CARD_TYPES.CLUE);
    }
    AltText() { return "Clue" }
    IconURL() { return "pix/card_types/clue.png"; }
    DetermineUsability(card, useSetting, deck, baseCards) {
        let tuple = super.DetermineUsability(card, useSetting, deck, baseCards);
        if (tuple[0] === USE_STATUS.UNKNOWN) {
            return [USE_STATUS.UNKNOWN, <span>TODO: see if clue can be used on an outline</span>]
        }
    }
}

// a Machine card
class CardTypeMachine extends CardType {
    constructor() {
        super(CARD_TYPES.MACHINE);
    }
    AltText() { return "Machine" }
    IconURL() { return "pix/card_types/machine.png"; }
    DetermineUsability(card, useSetting, deck, baseCards) {
        let tuple = super.DetermineUsability(card, useSetting, deck, baseCards);
        if (tuple[0] === USE_STATUS.UNKNOWN) {
            return [USE_STATUS.UNKNOWN, <span>TODO: see if machine can be used now</span>]
        }
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

}
// a Battle card
class CardTypeBattle extends CardType {
    constructor() {
        super(CARD_TYPES.BATTLE);
    }
    AltText() { return "Battle" }
    IconURL() { return "pix/card_types/battle.png"; }
    DetermineUsability(card, useSetting, deck, baseCards) {
        let tuple = super.DetermineUsability(card, useSetting, deck, baseCards);
        if (tuple[0] === USE_STATUS.UNKNOWN) {
            return [USE_STATUS.NO, <span>Battle cards have no special use outside of buying or selling.</span>]
        }
    }
}
// a Battle Modifier card
class CardTypeBattleModifier extends CardType {
    constructor() {
        super(CARD_TYPES.BATTLE_MODIFIER);
    }
    AltText() { return "Battle Modifier" }
    IconURL() { return "pix/card_types/battle_modifier.png"; }
    DetermineUsability(card, useSetting, deck, baseCards) {
        let tuple = super.DetermineUsability(card, useSetting, deck, baseCards);
        if (tuple[0] === USE_STATUS.UNKNOWN) {
            return [USE_STATUS.NO, <span>Battle Modifier cards have no special use outside of buying or selling.</span>]
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

