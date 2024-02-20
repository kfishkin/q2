import React from 'react';
import { Table } from 'antd';
import Card from './Card';
import CardDetail from './CardDetail';
import StatusMessage from './StatusMessage';
import CardsModal from './CardsModal';

// props:
// deck - array of cards
// baseCards
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
      showModal: false,
      verb: "sell", // needs to be in state so modal picks up changes.
      selectedCards: [] // see above
    };

    // over-ridden by children
    this.forWhom = "Your";
    // default 'flavor', over-ridden by children.
    this.flavor = "player";
    this.rowSelectionController =  this.props.ronly ? null : {
      selectedRowKeys: this.state.statefulSelectedRowKeys,
      onChange: (newKeys, selectedRows) => {
        console.log(`selectedRowKeys: ${newKeys}`, 'selectedRows: ', selectedRows);
        this.setState({selectedCards: selectedRows ? (selectedRows.map((row) => row.card)) : []});
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
    return card.TerselyDescribe();
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
    if (this.state.selectedCards.length > 0 && this.props.onTransact) {
      this.setState({showModal: true});
      // this will bring up the are-you-sure modal, which will then call
      // onConfirm or onCancel as appropriate.
/*
      let ok = window.confirm(`Are you sure you want to ${this.verb} these ${this.state.selectedCards.length} cards?`);
      if (ok) {
        this.props.onTransact(this.state.selectedCards);
        this.rowSelectionController.onChange([], []); // clear the selection.
      } */
    }
  }


  // props
  // deck - array of cards in the deck.
  // baseCards - top-level game info, a dict.
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
        title: 'description', dataIndex: 'description',
        sorter: (row1, row2) => row1.description.localeCompare(row2.description)
      },
      {
        title: 'obtained', dataIndex: 'obtained',
        sorter: (row1, row2) => row1.obtainedMillis - row2.obtainedMillis
      },      

    );
    let antInnards = deck.map((card, i) => {
      let gc = card.game_card;
      let cardObj = Card.Of(card); // TODO: deck is card objects
      let obtainedStr = cardObj.db.player_got_when;
      let obtainedDate = new Date(obtainedStr);

      let row = {
        key: 'tr_' + i,
        type: gc.type,
        typeObj: cardObj.GetBase(),
        display_name: this.displayNameMaker(cardObj),
        handle: gc.handle,
        level: gc.level,
        description: this.descriptionMaker(cardObj),
        card: card,
        cardObj: cardObj,
        obtained: obtainedDate.toLocaleString(),
        obtainedMillis: obtainedDate.valueOf()
      };
      let tuple = this.valueDataMaker(card);
      row[tuple[0]] = tuple[1];
      return row;
    });
    const onOk= () => {
      console.log(`confirmed you want to do the transaction`);
      this.setState({showModal: false});
      this.props.onTransact(this.state.selectedCards);
      this.rowSelectionController.onChange([], []); // clear the selection.
    }
  
    const onCancel= () => {
      this.setState({showModal: false});
      console.log(`you cancelled the transaction`);
    }
    let sentenceObject = (this.state.selectedCards.length === 1) ? 'this card' : `these ${this.state.selectedCards.length} cards`;
    //console.log(`baseCards has length ${this.props.baseCards.length}`);
    return <div className='deck' flavor={this.flavor} current={this.props.current}>
      <span>{preamble}</span>
      <CardDetail card={this.state.focusCard} baseCards={this.props.baseCards} />
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType}
        onClick={(e) => this.onStatusMessageClick(e)} />
      <Table columns={columns} dataSource={antInnards} rowSelection={this.rowSelectionController}
        pagination={{ pageSize: 20 }}
        onRow={(row, i) => {
          return {
            onClick: (e) => this.onRowClick(row, i, e)
          };
        }}></Table>
          <CardsModal title="Are you sure?" open={this.state.showModal} onOk={onOk} onCancel={onCancel}
  cards={this.state.selectedCards}
  topHtml={<span>Sure you want to {this.state.verb} {sentenceObject}?</span>}
  bottomHtml=""
  baseCards={this.props.baseCards}
/>
    </div>
  }
}

// the view of merchant inventory in a shop
export class DeckComponentMerchant extends DeckComponent {
  constructor(props) {
    super(props);
    this.forWhom = "The merchant's";
    this.flavor = "merchant";
    this.state.verb = "buy";
  }

  // can buy for sell value + markup, and at least $1
  valueDataMaker(card) {
    let MARKUP = 2.00; // as per Jim :)
    let price = Math.max(1, Math.ceil(card.game_card.sell_value * MARKUP));
    return ['price', price];
  };

  // the title for the sell/buy column
  valueColumnMaker() {
    return {
      title: `${this.state.verb} for`, dataIndex: 'price',
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
    this.setState({ statusMessage: `${this.state.verb} ${numChecked} for $${buyValue}`, statusType: 'clickable' });
  }
}


// the view of your inventory to feed into machines
export class DeckComponentInventory extends DeckComponent {
  constructor(props) {
    super(props);
    this.flavor = "inventory";
    this.state.verb = "use";
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
    this.setState({ statusMessage: `${this.state.verb} ${numChecked}`, statusType: 'clickable' });
  }
}
