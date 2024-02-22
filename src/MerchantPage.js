import React from 'react';
import Card from './Card';
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
      action: Action.BUYING
    };
    this.loadingMerchant = false;
  }

  componentDidMount() {

    //console.log(`component did mount, owner = ${JSON.stringify(this.props.owner)}`);
    this.loadMerchantDeck();
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
          deck.forEach((c) =>{
            if (!c.GetBase().IsBuyable()) {
              console.log(`card ${c.GetBase().GetHandle()} is not IsBuyable`);
            }
          })
          deck = deck.filter((c) => c.GetBase().IsBuyable());
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
    this.props.beGateway.repair(this.props.gameInfo.gameId, this.props.playerInfo.playerId,cardIds)
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
  }  

  render() {
    if (!this.props.owner) {
      return <div>Oops, merchant page, but no merchant supplied</div>
    }
    let showModalUI = () => {
      let setAction = (val) => { 
        this.setState({ action: val }
          ) };

      let buying = this.state.action === Action.BUYING;
      let selling = this.state.action === Action.SELLING;
      let repairing = this.state.action === Action.BLACKSMITH;
      let seeing = this.state.action === Action.SEER;

      let bankroll = 0;
      this.props.playerInfo.deck.forEach((card) => {
        // TODO: (deck) argument is array of Cards.
        let cardObj = Card.Of(card);
        if (cardObj.GetBase().IsMoney()) {
          bankroll += cardObj.GetBase().GetSellValue();
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
    deckObjs.forEach((c) => {
      if (!c.GetBase().IsSellable()) {
        console.log(`player card ${c.GetBase().GetHandle()} is not sellable`);
      }
    });
    deckObjs = deckObjs.filter((c) => c.GetBase().IsSellable());
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
        onTransact={(cards) => this.onStartCluing(cards)} />
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType}
      />
    </div>;
  }
}

export default MerchantPage;