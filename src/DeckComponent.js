import React from 'react';
import { Table } from 'antd';
import Card from './Card';
import CardDetail from './CardDetail';
import StatusMessage from './StatusMessage';

// props:
// deck - array of cards
// gameInfo
// ronly - read-only. No buying or selling.
// onTransact - f(cards), called if user indicates they want to buy/sell the given cards.
export class DeckComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focusCard: null,
      statusMessage: "",
      statusType: "info",
      statefulSelectedRowKeys: [],
    };
    // the selected cards. Not a state variable since doesn't change display.
    this.selectedCards = [];
    // over-ridden by children
    this.forWhom = "Your";
    // default 'flavor', over-ridden by children.
    this.flavor = "player";
    this.verb = "sell";
    this.rowSelectionController =  this.props.ronly ? null : {
      selectedRowKeys: this.state.statefulSelectedRowKeys,
      onChange: (newKeys, selectedRows) => {
        console.log(`selectedRowKeys: ${newKeys}`, 'selectedRows: ', selectedRows);
        this.selectedCards = selectedRows ? (selectedRows.map((row) => row.card)) : [];
        this.rowSelectionController.selectedRowKeys = newKeys;
        this.setState({statefulSelectedRowKeys: newKeys});
        this.onSelectedRows(selectedRows);
      },
      getCheckboxProps: (record) => ({
        disabled: !this.isSelectable(record),
      }),
    };
  }

  componentDidMount() {
    if (!this.props.ronly)
      this.setState({ statusMessage: "click on the checkbox to mark something for sale", type: "info" });
  }

  // the title for the sell/buy column
  valueColumnMaker() {
    return {
      title: 'sell for ', dataIndex: 'sell_value',
      sorter: (row1, row2) => parseInt(row1.sell_value) - parseInt(row2.sell_value)
    };
  }
  // the value for the sell/buy column
  // similarly, this constructs the data for that column, and its key
  valueDataMaker(card) {
    return ['sell_value', card.game_card.sell_value]
  };

  // the title for the card - subclasses may change/obfuscate
  displayNameMaker(card) {
    if (!card || !card.game_card) return card.handle;
    let gc = card.game_card;
    return gc.display_name;
  }
  // and for description
  descriptionMaker(card) {
    return card.GetBase().description;
  }
  // and for clicking on a row in the table
  onRowClick(row) {
    this.setState({
      focusCard: row.card
    });
  };

  // and is a given row to be selectable?
  isSelectable(row) {
    return true;

  }

  onSelectedRows(rows) {
    // default is readying things for sale...
    if (!rows) {
      this.setState({ statusMessage: "click on the checkbox to mark something for sale", statusType: "info" });
      return;
    }
    let numChecked = rows.length;
    let sellValue = 0;
    rows.forEach((row) => {
      if (row.sell_value) {
        sellValue += row.sell_value;
      }
    });
    this.setState({ statusMessage: `Sell ${numChecked} for $${sellValue}`, statusType: 'clickable' });
  }

  onStatusMessageClick(e) {
    if (this.selectedCards.length > 0 && this.props.onTransact) {
      let ok = window.confirm(`Are you sure you want to ${this.verb} these ${this.selectedCards.length} cards?`);
      if (ok) {
        this.props.onTransact(this.selectedCards);
        this.rowSelectionController.onChange([], []); // clear the selection.
      }
    }
  }

  // props
  // deck - array of cards in the deck.
  // gameInfo - top-level game info, a dict.
  render() {
    let deck = this.props.deck;
    if (!deck || deck.length === 0) {
      return <div>Empty deck.</div>
    }
    let msg = this.forWhom;
    let preamble = <span>{msg} deck has {deck.length} cards, click on one to see it in more detail:</span>;
    let columns = [
      {
        title: 'title', dataIndex: 'display_name',
        sorter: (row1, row2) => row1.display_name.localeCompare(row2.display_name)
      },
      {
        title: 'type', dataIndex: 'typeObj',
        render: (val) =>
          <img width="16" src={val.IconURL()} title={val.AltText()} alt={val.AltText()} />
        ,
        sorter: (row1, row2) => row1.typeObj.GetType() - row2.typeObj.GetType()
      },
      {
        title: 'level', dataIndex: 'level',
        sorter: (row1, row2) => row1.level - row2.level,
      },
    ];
    let valueCol = this.valueColumnMaker();
    if (valueCol) {
      columns.push(valueCol);
    }
    columns.push(
      {
        title: 'battle_value', dataIndex: 'battle_value',
        sorter: (row1, row2) => row1.battle_value - row2.battle_value
      },
      {
        title: 'description', dataIndex: 'description',
        sorter: (row1, row2) => row1.description.localeCompare(row2.description)
      }
    );
    let antInnards = deck.map((card, i) => {
      let gc = card.game_card;
      let cardObj = new Card(card); // TODO: deck is card objects
      let row = {
        key: 'tr_' + i,
        type: gc.type,
        typeObj: cardObj.GetBase(),
        display_name: this.displayNameMaker(cardObj),
        handle: gc.handle,
        level: gc.level,
        battle_value: gc.battle_value,
        description: this.descriptionMaker(cardObj),
        card: card,
        cardObj: cardObj
      };
      let tuple = this.valueDataMaker(card);
      row[tuple[0]] = tuple[1];
      return row;
    });
    return <div className='deck' flavor={this.flavor} current={this.props.current}>
      <span>{preamble}</span>
      <CardDetail card={this.state.focusCard} gameInfo={this.props.gameInfo} deck={deck} />
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType}
        onClick={(e) => this.onStatusMessageClick(e)} />
      <Table columns={columns} dataSource={antInnards} rowSelection={this.rowSelectionController}
        pagination={{ pageSize: 20 }}
        onRow={(row, i) => {
          return {
            onClick: (e) => this.onRowClick(row, i, e)
          };
        }}></Table>
    </div>
  }
}

// the view of merchant inventory in a shop
export class DeckComponentMerchant extends DeckComponent {
  constructor(props) {
    super(props);
    this.forWhom = "The merchant's";
    this.flavor = "merchant";
    this.verb = "buy";
  }

  // can buy for sell value + markup, and at least $1
  valueDataMaker(card) {
    let MARKUP = 1.30; // seems about right...
    let price = Math.max(1, Math.ceil(card.game_card.sell_value * MARKUP));
    return ['price', price];
  };

  // the title for the sell/buy column
  valueColumnMaker() {
    return {
      title: `${this.verb} for`, dataIndex: 'price',
      sorter: (row1, row2) => parseInt(row1.price) - parseInt(row2.price)
    };
  }

  displayNameMaker(card) {
    if (card.GetBase().OpaqueBeforeBuying()) {
      return card.GetBase().OpaqueDisplayName();
    } else {
      return super.displayNameMaker(card);
    }
  }

  descriptionMaker(card) {
    if (card.GetBase().OpaqueBeforeBuying()) {
      return "...buy to see details";
    } else {
        return super.descriptionMaker(card);
    }
  }

  onRowClick(row) {
    let card = row.cardObj;
    if (card.GetBase().OpaqueBeforeBuying()) {
      window.alert("You can't see the details until after you buy, sorry");
    } else {
      super.onRowClick(row);
    }
  };

  componentDidMount() {
    if (!this.props.ronly)
      this.setState({ statusMessage: "click on the checkbox to mark something to buy", type: "info" });
  }

  onSelectedRows(rows) {
    // user is ready things to buy...
    if (!rows || rows.length === 0) {
      this.setState({ statusMessage: "click on the checkbox to mark something to buy", statusType: "info" });
      return;
    }
    let numChecked = rows.length;
    let buyValue = 0;
    rows.forEach((row) => {
      if (row.price) {
        buyValue += row.price;
      }
    });
    this.setState({ statusMessage: `${this.verb} ${numChecked} for $${buyValue}`, statusType: 'clickable' });
  }
}


// the view of your inventory to feed into machines
export class DeckComponentInventory extends DeckComponent {
  constructor(props) {
    super(props);
    this.flavor = "inventory";
    this.verb = "use";
  }

  componentDidMount() {
    if (!this.props.ronly)
      this.setState({ statusMessage: "click on the checkbox to mark something to use", type: "info" });
  }

  onSelectedRows(rows) {
    if (!rows || rows.length === 0) {
      this.setState({ statusMessage: "click on the checkbox to mark something to use", statusType: "info" });
      return;
    }
    let numChecked = rows.length;
    this.setState({ statusMessage: `${this.verb} ${numChecked}`, statusType: 'clickable' });
  }
}
