import React from 'react';
import { Table } from 'antd';
import { CardType } from './CardType';

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
        title: 'title', dataIndex: 'title',
      },
      {
        title: 'type', dataIndex: 'type',
        render: (val) => 
          <img width="16" src={val.IconURL()} title={val.AltText()} alt={val.AltText()}/>
        ,
          sorter: (row1, row2) => row1.type.GetType() - row2.type.GetType()
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
        type: gc.type,
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
