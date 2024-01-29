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
    const columns = [
      {
        title: 'handle', dataIndex: 'handle',
      },
      {
        title: 'level', dataIndex: 'level',
      },
      {
        title: 'sell_value', dataIndex: 'sell_value',
      },
      { title: 'battle_value', dataIndex: 'battle_value' },
      { title: 'description', dataIndex: 'description' },
      { title: 'other', dataIndex: 'other'}
    ];
    let antInnards = deck.map((card, i) => {
      let gc = card.game_card;
      let other = [gc.battle_value, gc.machine, gc.recipe_outline, gc.recipe].filter((dict) => dict);
      return {
        key: 'tr_' + i,
        handle: gc.handle,
        level: gc.level,
        sell_value: gc.sell_value,
        battle_value: gc.battle_value,
        description: gc.description,
        other: JSON.stringify(other)
      };
    });
    return <div>
    <span>{preamble}</span>
    <Table id="deck_table" columns={columns} dataSource={antInnards}/>
  </div>
  }
}
export default DeckComponent;
