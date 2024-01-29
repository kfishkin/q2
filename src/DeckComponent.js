import React from 'react';
import { Table } from 'antd';

class DeckComponent extends React.Component {
  // props
  // deck - array of cards in the deck.
  render() {
    let deck = this.props.deck;
    if (!deck || deck.length === 0) {
      return <div>Empty deck.</div>
    }
    let preamble = <span>The deck has {deck.length} cards:</span>;

    const CARD_TYPES = {
      NONE: "None",
      MONEY: "Money",
      LIVES: "Life",
      CLUE: "Clue",
      MACHINE: "Machine",
      RECIPE_OUTLINE: "Recipe Outline",
      RECIPE: "Recipe",
      BATTLE: "Battle",
      BATTLE_MODIFIER: "Battle Modifier",
      INGREDIENT: "Ingredient",
      TICKET: "Golden Ticket"
    };

    // given a game card, returns its 'type' for display.
    // things can have more than one type, but not for display...
    let cardType = (gc) => {
      if (!gc) return CARD_TYPES.NONE;
      if (gc.battle_modifier) return CARD_TYPES.BATTLE_MODIFIER;
      if (gc.recipe) return CARD_TYPES.RECIPE;
      if (gc.clue) return CARD_TYPES.CLUE
      if (gc.lives) return CARD_TYPES.LIVES;
      if (gc.machine) return CARD_TYPES.MACHINE;
      if (gc.recipe_outline) return CARD_TYPES.RECIPE_OUTLINE;
      if (gc.handle.startsWith("ingred_")) return CARD_TYPES.INGREDIENT;
      if (gc.handle.startsWith("none_")) return CARD_TYPES.NONE;
      if (gc.handle.startsWith("ticket_")) return CARD_TYPES.TICKET;
      if (gc.handle.startsWith("battle_")) return CARD_TYPES.BATTLE;
      if (gc.handle.startsWith("gold_")) return CARD_TYPES.MONEY;
      console.log(`unknown card type: ${gc}`);
      return CARD_TYPES.NONE;
    }
    const columns = [
      {
        title: 'title', dataIndex: 'title',
      },
      {
        title: 'type', dataIndex: 'type',
        render: (val) => (
          <img width="16" src={"pix/card_types/" + val.toLowerCase().replace(/ /g,'_') +".png"} title={val} alt={val}/>),
          sorter: (row1, row2) => row1.type.localeCompare(row2.type)
      },
      {
        title: 'level', dataIndex: 'level',
        sorter: (row1, row2) => row1.level - row2.level,
      },
      {
        title: 'sell for ', dataIndex: 'sell_value',
        sorter: (row1, row2) => row1.sell_value - row2.sell_value
      },
      { title: 'battle_value', dataIndex: 'battle_value',
        sorter: (row1, row2) => row1.battle_value - row2.battle_value
    },
      { title: 'description', dataIndex: 'description' ,
        sorter: (row1, row2) => row1.description.localeCompare(row2.description)
    },
    ];
    let antInnards = deck.map((card, i) => {
      let gc = card.game_card;
      let other = [gc.battle_value, gc.machine, gc.recipe_outline, gc.recipe].filter((dict) => dict);
      return {
        key: 'tr_' + i,
        type: cardType(gc),
        title: gc.title?gc.title:gc.handle,
        handle: gc.handle,
        level: gc.level,
        sell_value: gc.sell_value,
        battle_value: gc.battle_value,
        description: gc.description,
      };
    });
    return <div>
    <span>{preamble}</span>
    <Table id="deck_table" columns={columns} dataSource={antInnards}
      pagination={{pageSize: 20}}/>
  </div>
  }
}
export default DeckComponent;
