import dayjs from 'dayjs';
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
        return <div><hr/><b>{card.game_card.display_name}</b> card: {card.game_card.description}</div>;
    }

    // factory method: make one for a given game card:
    static make(gc) {
        if (!gc) return new CardTypeNothing();
        if (gc.battle_modifier) return new CardTypeBattleModifier();
        if (gc.recipe) return new CardTypeRecipe();
        if (gc.clue) return new CardTypeClue();
        if (gc.lives) return new CardTypeLife();
        // wotta kludge. TODO: fix this.
        if (gc.machine) return (gc.handle.startsWith('horn_of_plenty_')) ? new CardHornOfPlenty() : new CardTypeMachine();
        if (gc.recipe_outline) return new CardTypeRecipeOutline();
        if (gc.handle.startsWith("ingred_")) return new CardTypeIngredient();
        if (gc.handle.startsWith("none_")) return new CardTypeNothing();
        if (gc.handle.startsWith("ticket_")) return new CardTypeTicket();
        if (gc.handle.startsWith("battle_")) return new CardTypeBattle();
        if (gc.handle.startsWith("gold_")) return new CardTypeMoney();
        console.log(`unknown card type: ${gc}`);
        return new CardTypeNothing();
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
    IconURL() { return "pix/card_types/money.png";}
}
// a Life card
class CardTypeLife extends CardType {
    constructor() {
        super(CARD_TYPES.LIVES);
    }
    AltText() { return "Life" }
    IconURL() { return "pix/card_types/life.png";}
}
// a Clue card
class CardTypeClue extends CardType {
    constructor() {
        super(CARD_TYPES.CLUE);
    }
    AltText() { return "Clue" }
    IconURL() { return "pix/card_types/clue.png";}
}
// a Machine card
class CardTypeMachine extends CardType {
    constructor() {
        super(CARD_TYPES.MACHINE);
    }
    AltText() { return "Machine" }
    IconURL() { return "pix/card_types/machine.png";}
}

class CardHornOfPlenty extends CardTypeMachine {
    constructor() {
        super(CARD_TYPES.MACHINE);
    }
    FullyDescribe(card, gameInfo, playerDeck) {
        let topPart = card.game_card.description;
        let bottomPart = "It's never been used";
        let usable = true;
        if (card.last_used) {
            let lastUsed = dayjs(card.last_used);
            let now = dayjs();
            const HYSTERESIS_HOURS = 24;
            let diff = now.diff(lastUsed, 'h');
            if (diff === 0) {
                bottomPart = "last used less than an hour ago";
            } else if (diff === 1) {
                bottomPart = "last used  an hour ago";
            } else if (diff > 48) {
                bottomPart = "last used a while ago";
            } else {
                bottomPart = `last used ${diff} hours ago`;
            }
            usable = (diff >= HYSTERESIS_HOURS);
        }
        if (usable) {
            bottomPart += " -- usable now.";
        }
        return <div><hr />{topPart}<hr />{bottomPart}</div>;
    }

}


// a Recipe Outline card
class CardTypeRecipeOutline extends CardType {
    constructor() {
        super(CARD_TYPES.RECIPE_OUTLINE);
    }
    AltText() { return "Recipe Outline" }
    IconURL() { return "pix/card_types/recipe_outline.png";}
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
            let firstPart = amtArray.slice(0,-1).join();
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
                return <span has={has?"yes":"no"}>{index > 0 ? ", " : ""}{gameInfo.baseCards[ingredId].display_name}</span>;
            };

            if (ingredArray.length === 1) return (<b>{ingredArray[0]}</b>);
            let firstPart = ingredArray.slice(0,-1).map((id, index) => ingredName(id, index));
            let lastOne = ingredName(ingredArray[ingredArray.length - 1]);
            return (<b>({firstPart} or {lastOne})</b>);
        }

        let stepWord = (outline.num_steps === 1)?"step":"steps";
        let stepDescrs = [];
        for (let step = 0; step < outline.num_steps; step++) {
            let possible_amounts = outline.possible_amounts[step];
            let amtDescr = amountString(possible_amounts);
            let ingredDescr = ingredientString(outline.possible_ingredients[step]);
            stepDescrs.push(<li><span><b>Step #{step+1}:</b></span><span>is {amtDescr} of {ingredDescr}</span></li>);
        }
        return <div>The Recipe has <b>{outline.num_steps}</b> {stepWord}:<ol>{stepDescrs}</ol>
          <br/>Ingredients look like <span has="yes">This</span> if you have them, <span has="no">That</span> if you don't</div>;
    }
}
// a Recipe card
class CardTypeRecipe extends CardType {
    constructor() {
        super(CARD_TYPES.RECIPE);
    }
    AltText() { return "Recipe" }
    IconURL() { return "pix/card_types/recipe.png"}

}
// a Battle card
class CardTypeBattle extends CardType {
    constructor() {
        super(CARD_TYPES.BATTLE);
    }
    AltText() { return "Battle" }
    IconURL() { return "pix/card_types/battle.png";}
}
// a Battle Modifier card
class CardTypeBattleModifier extends CardType {
    constructor() {
        super(CARD_TYPES.BATTLE_MODIFIER);
    }
    AltText() { return "Battle Modifier" }
    IconURL() { return "pix/card_types/battle_modifier.png";}
}
// a Ingredient card
class CardTypeIngredient extends CardType {
    constructor() {
        super(CARD_TYPES.INGREDIENT);
    }
    AltText() { return "Ingredient" }
    IconURL() { return "pix/card_types/ingredient.png";}
}
// a Golden Ticket card
class CardTypeTicket extends CardType {
    constructor() {
        super(CARD_TYPES.TICKET);
    }
    AltText() { return "Golden Ticket" }
    IconURL() { return "pix/card_types/golden_ticket.png";}
}

