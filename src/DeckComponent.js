import React from 'react';
import { Table } from 'antd';
import CardDetail from './CardDetail';
import { CardType } from './CardType';

// props:
// deck - array of cards
// gameInfo
class DeckComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focusCard: null
    };
  }
  // props
  // deck - array of cards in the deck.
  // gameInfo - top-level game info, a dict.
  render() {
    let deck = this.props.deck;
    if (!deck || deck.length === 0) {
      return <div>Empty deck.</div>
    }
    let forWhom = this.props.for || "player";
    let msg = (forWhom === "player") ? "Your" : "The merchant's ";
    let preamble = <span>{msg} deck has {deck.length} cards, click on one to see it in more detail:</span>;
    const columns = [
      {
        title: 'title', dataIndex: 'display_name',
        sorter: (row1, row2) => row1.display_name.localeCompare(row2.display_name)
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
        sorter: (row1, row2) => parseInt(row1.sell_value) - parseInt(row2.sell_value)
      },
      { title: 'battle_value', dataIndex: 'battle_value',
        sorter: (row1, row2) => row1.battle_value - row2.battle_value
    },
      { title: 'description', dataIndex: 'description' ,
        sorter: (row1, row2) => row1.description.localeCompare(row2.description)
    },
    ];
    let onRowClick = (row, i, e) => {
      console.log(`hello from onRowClick, i = ${i}, row = ${JSON.stringify(row)}`)
      this.setState({
        focusCard: row.card
      });
    };
    let antInnards = deck.map((card, i) => {
      let gc = card.game_card;
      return {
        key: 'tr_' + i,
        type: (typeof gc.type === 'number') ? CardType.make(gc.type) : gc.type,
        display_name: gc.display_name?gc.display_name:gc.handle,
        handle: gc.handle,
        level: gc.level,
        sell_value: gc.sell_value,
        battle_value: gc.battle_value,
        description: gc.description,
        card: card
      };
    });
    return <div className='deck' current={this.props.current}>
    <span>{preamble}</span>
    <CardDetail card={this.state.focusCard} gameInfo={this.props.gameInfo} deck={deck}/>
    <Table id="deck_table" columns={columns} dataSource={antInnards}
      pagination={{pageSize: 20}} 
      onRow={(row, i) => {
        return {
          onClick: (e) => onRowClick(row, i, e)
        };
      }}></Table>
  </div>
  }
}
export default DeckComponent;
