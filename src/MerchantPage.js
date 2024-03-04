import React from 'react';
import Card from './Card';
import CardsModal from './CardsModal';
import StatusMessage from './StatusMessage';
import { DeckComponent, DeckComponentMerchant } from './DeckComponent';
import RepairComponent from './RepairComponent';
import SeerComponent from './SeerComponent';

// props
// owner: the player structure for the merchant that owns this shop.
// beGateway
// gameInfo
// playerInfo
// onPlayerDeckBEChange
const Action = {
  BUYING: 0,
  SELLING: 1,
  BLACKSMITH: 2,
  SEER: 3
}

class MerchantPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      merchantDeck: null,
      statusMessage: "",
      statusType: "info",
      action: Action.BUYING,
      showDialog: false,
      dialogCards: [],
      dialogTop: ""
    };
    this.loadingMerchant = false;
  }

  componentDidMount() {

    //console.log(`component did mount, owner = ${JSON.stringify(this.props.owner)}`);
    this.loadMerchantDeck();
    let bankroll = 0;
    this.props.playerInfo.deck.forEach((card) => {
      // TODO: (deck) argument is array of Cards.
      let cardObj = Card.Of(card);
      if (cardObj.getBase().isMoney()) {
        bankroll += cardObj.getBase().getSellValue();
      }
    });
    this.setState({ bankroll });
  }

  loadMerchantDeck() {
    let gameInfo = this.props.gameInfo;
    if (!this.loadingMerchant) {
      this.setState({ statusMessage: `loading inventory...`, statusType: 'info' });
      console.log(`asking for inventory, game.gameId = ${gameInfo.gameId}, game._id=${gameInfo._id}, owner _id = ${this.props.owner._id}`);
      this.loadingMerchant = true;
      this.props.beGateway.oldGetPlayerCardsForGame(gameInfo.gameId, this.props.owner._id)
        .then((v) => {
          //console.log(`got shopkeeper inventory of ${JSON.stringify(v)}`);
          this.loadingMerchant = false;
          let deck = v.map((dbObj) => Card.Of(dbObj));
          console.log(`raw merchant deck has length ${deck.length}`);
          deck.forEach((c) => {
            if (!c.getBase().isBuyable()) {
              console.log(`card ${c.getBase().getHandle()} is not IsBuyable`);
            }
          })
          deck = deck.filter((c) => c.getBase().isBuyable());
          console.log(`filtered merchant deck has length ${deck.length}`);
          this.setState({ statusMessage: `loaded ${v.length}-card inventory...`, statusType: 'success', merchantDeck: deck });
        }).catch((e) => {
          this.loadingMerchant = false;
          console.error(`error getting merchant inventory: ${e}`);
          this.setState({ statusMessage: `failure loading merchant inventory: ${e}`, statusType: 'error' });
        })
    }

  }

  onStartBuy(cards) {
    console.log(`wants to buy cards ${JSON.stringify(cards)}`);
    // just need the IDs to send over the wire.
    if (!cards) return;
    let cardIds = cards.map((card) => card._id);
    this.setState({ statusMessage: `buying...`, statusType: 'info' });
    this.props.beGateway.buy(this.props.gameInfo.gameId, this.props.playerInfo.playerId,
      this.props.owner._id, cardIds)
      .then((v) => {
        console.log(`onStartBuy: v = ${JSON.stringify(v)}`);
        if (!v.ok) {
          this.setState({ statusMessage: `error ${v.status} on buy: ${v.statusText}`, statusType: 'error' });
        }
        this.setState({ statusMessage: 'bought!', statusType: 'success' });
        // and the merchant deck has changed
        this.loadMerchantDeck();
        this.props.onPlayerDeckBEChange();
      }).catch((e) => {
        this.setState({ statusMessage: JSON.stringify(e), statusType: 'error' });
      });
  }

  onStartSell(cards) {
    console.log(`wants to sell cards ${JSON.stringify(cards)}`);
    // just need the IDs to send over the wire.
    if (!cards) return;
    let cardIds = cards.map((card) => card._id);
    this.setState({ statusMessage: `selling...`, statusType: 'info' });
    this.props.beGateway.sell(this.props.gameInfo.gameId, this.props.playerInfo.playerId,
      this.props.owner._id, cardIds)
      .then((v) => {
        console.log(`onStartSell: v = ${JSON.stringify(v)}`);
        if (!v.ok) {
          console.log(`fail in onStartSell`);
          this.setState({ statusMessage: `error ${v.status} on sell: ${v.statusText}`, statusType: 'error' });
        }
        console.log(`updating state, this.setState = ${this.setState}`);
        this.setState({ statusMessage: 'sold!', statusType: 'success' });
        console.log(`notifying top level of BE change`);
        this.props.onPlayerDeckBEChange(); // the player deck has changed
        // and the merchant deck has changed
        this.loadMerchantDeck();
      }).catch((e) => {
        this.setState({ statusMessage: JSON.stringify(e), statusType: 'error' });
      });
  }

  onStartRepair(cards) {
    console.log(`wants to repair cards ${JSON.stringify(cards)}`);
    // just need the IDs to send over the wire.
    if (!cards) return;
    let cardIds = cards.map((card) => card._id);
    this.setState({ statusMessage: `repairing...`, statusType: 'info' });
    this.props.beGateway.repair(this.props.gameInfo.gameId, this.props.playerInfo.playerId, cardIds)
      .then((v) => {
        console.log(`onStartRepair: v = ${JSON.stringify(v)}`);
        if (v.ok) {
          this.setState({ statusMessage: 'repaired!', statusType: 'success' });
          this.props.onPlayerDeckBEChange(); // the player deck has changed
        } else {
          console.log(`fail in onStartRepair`);
          this.setState({ statusMessage: v.statusText, statusType: 'error' });
        }

      }).catch((e) => {
        this.setState({ statusMessage: JSON.stringify(e), statusType: 'error' });
      });
  }

  onStartCluing(cards) {
    console.log(`wants to clue in on cards ${JSON.stringify(cards)}`);
    this.props.beGateway.seer(this.props.gameInfo.gameId, this.props.playerInfo.playerId,
      cards[0].getId(), cards[1].getId(), cards[2].getId()).then((v) => {
        console.log(`fe: beGateway.seer.ok = ${v.ok}, v = ${JSON.stringify(v)}`);
        if (!v.ok) {
          this.setState({ statusMessage: v.errorText, statusType: 'error' });
        } else {
          // v is a dict.
          // delete - ids of cards deleted.
          // add - cardDbs of cards added
          // change - cardDbs of adds changed
          // topHtml, bottomHtml - for modal
          let deletedIds = v.delete;
          console.log(`deleted ids = ${JSON.stringify(deletedIds)}`);
          let numDeleted = deletedIds ? deletedIds.length : 0;
          let addedCardNames = [];
          let addedCards = v.add;
          console.log(`added cards = ${JSON.stringify(addedCards)}`);
          if (addedCards) {
            addedCardNames = addedCards.map((c) =>
              (c && c.game_card && c.game_card.display_name) ? c.game_card.display_name : "???");
          }
          let msg = "Success!";
          if (numDeleted === 1) {
            msg += " 1 card consumed";
          } else {
            msg += ` ${numDeleted} cards consumed`;
          }
          msg += ` Added: ${addedCardNames.join()}`;
          this.setState({
            statusMessage: msg, statusType: 'success',
            dialogCards: addedCards,
            dialogTop: v.topHtml
          });
          this.setState({ showDialog: true }); // wait until after other stuff set

          if (this.props.onPlayerDeckBEChange) {
            this.props.onPlayerDeckBEChange();
          }
        }
      })
  }

  render() {
    if (!this.props.owner) {
      return <div>Oops, merchant page, but no merchant supplied</div>
    }
    // modal as in 'what mode are they in in the mall', not modal as in 'a dialog box'.
    let showModalUI = () => {
      let setAction = (val) => {
        this.setState({ action: val }
        )
      };

      let buying = this.state.action === Action.BUYING;
      let selling = this.state.action === Action.SELLING;
      let repairing = this.state.action === Action.BLACKSMITH;
      let seeing = this.state.action === Action.SEER;

      let bankroll = 0;
      this.props.playerInfo.deck.forEach((card) => {
        // TODO: (deck) argument is array of Cards.
        let cardObj = Card.Of(card);
        if (cardObj.getBase().isMoney()) {
          bankroll += cardObj.getBase().getSellValue();
        }
      });

      return (<div> You have <b>${bankroll}</b>. <button className="merchant" current={buying ? "yes" : "no"} onClick={(e) => setAction(Action.BUYING)}>Buy</button>
        <button className="merchant" current={selling ? "yes" : "no"} onClick={(e) => setAction(Action.SELLING)}>Sell</button>
        <button className="merchant" current={repairing ? "yes" : "no"} onClick={(e) => setAction(Action.BLACKSMITH)}>Repair</button>
        <button className="merchant" current={seeing ? "yes" : "no"} onClick={(e) => setAction(Action.SEER)}>Use Clue</button>
      </div>);

    }


    let buying = this.state.action === Action.BUYING;
    let selling = this.state.action === Action.SELLING;
    let repairing = this.state.action === Action.BLACKSMITH;
    let seeing = this.state.action === Action.SEER;
    // TODO: remove once playerInfo.deck is real cards.
    let deckObjs = this.props.playerInfo.deck.map((dbObj) => Card.Of(dbObj));
    deckObjs = deckObjs.filter((c) => c.getBase().isSellable());

    const closeDialog = () => {
      this.setState({showDialog: false});
    }
    
    return <div>Hello from the merchant page for merchant {this.props.owner.name}'s store.
      <br />{showModalUI()}
      <DeckComponentMerchant deck={this.state.merchantDeck} baseCards={this.props.gameInfo.baseCards} current={buying ? "yes" : "no"}
        onTransact={(cards) => this.onStartBuy(cards)} />
      <DeckComponent deck={deckObjs} baseCards={this.props.gameInfo.baseCards} current={selling ? "yes" : "no"}
        onTransact={(cards) => this.onStartSell(cards)} />
      <RepairComponent deck={deckObjs} current={repairing ? "yes" : "no"}
        beGateway={this.props.beGateway}
        gameId={this.props.gameInfo.gameId}
        onTransact={(cards) => this.onStartRepair(cards)} />
      <SeerComponent deck={deckObjs} current={seeing ? "yes" : "no"}
        beGateway={this.props.beGateway}
        gameId={this.props.gameInfo.gameId}
        baseCards={this.props.gameInfo.baseCards}
        bankroll={this.state.bankroll}
        onTransact={(cards) => this.onStartCluing(cards)} />
        <CardsModal title="Clue results" open={this.state.showDialog} onOk={closeDialog} onCancel={closeDialog}
          cards={this.state.dialogCards}
          topHtml={this.state.dialogTop}
          bottomHtml=""
          baseCards={this.props.gameInfo.baseCards}
        />
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType}
      />
    </div>;
  }
}

export default MerchantPage;