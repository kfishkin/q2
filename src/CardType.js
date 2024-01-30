
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

    // factory method: make one for a given game card:
    static make(gc) {
        if (!gc) return new CardTypeNothing();
        if (gc.battle_modifier) return new CardTypeBattleModifier();
        if (gc.recipe) return new CardTypeRecipe();
        if (gc.clue) return new CardTypeClue();
        if (gc.lives) return new CardTypeLife();
        if (gc.machine) return new CardTypeMachine();
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
// a Recipe Outline card
class CardTypeRecipeOutline extends CardType {
    constructor() {
        super(CARD_TYPES.RECIPE_OUTLINE);
    }
    AltText() { return "Recipe Outline" }
    IconURL() { return "pix/card_types/recipe_outline.png";}
}
// a Recipe card
class CardTypeRecipe extends CardType {
    constructor() {
        super(CARD_TYPES.RECIPE);
    }
    AltText() { return "Recipe" }
    IconURL() { return "pix/card_types/recipe.png";}
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

