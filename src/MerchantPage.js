import React from 'react';
import Card from './Card';
import StatusMessage from './StatusMessage';
import {DeckComponent, DeckComponentMerchant} from './DeckComponent';


  // props
  // owner: the player structure for the merchant that owns this shop.
  // beGateway
  // gameInfo
  // playerInfo
  // onPlayerDeckBEChange
class MerchantPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      merchantDeck: null,
      statusMessage: "",
      statusType: "info",
      buying: true
    };
    this.loadingMerchant = false;
  }
  
  componentDidMount() {
    let gameInfo = this.props.gameInfo;
    console.log(`component did mount, owner = ${JSON.stringify(this.props.owner)}`);
    if (!this.state.merchantDeck && !this.loadingMerchant) {
      this.setState({ statusMessage: `loading inventory...`, statusType: 'info'});
      console.log(`asking for inventory, game.gameId = ${gameInfo.gameId}, game._id=${gameInfo._id}, owner _id = ${this.props.owner._id}`);
      this.loadingMerchant = true;
      this.props.beGateway.getPlayerCardsForGame(gameInfo.gameId, this.props.owner._id)
        .then((v) => {
          //console.log(`got shopkeeper inventory of ${JSON.stringify(v)}`);
          this.loadingMerchant = false;
          let deck = v.map((dbObj) => new Card(dbObj));
          this.setState({ statusMessage: `loaded ${v.length}-card inventory...`, statusType: 'success', merchantDeck: deck});
        }).catch((e) => {
          this.loadingMerchant = false;
          console.error(`error getting merchant inventory: ${e}`);
          this.setState({ statusMessage: `failure loading merchant inventory: ${e}`, statusType: 'error'});
        })
    }
  }

  onStartBuy(cards) {
    console.log(`wants to buy cards ${JSON.stringify(cards)}`);
    // just need the IDs to send over the wire.
    if (!cards) return;
    let cardIds = cards.map((card) => card._id);
    this.setState({statusMessage: `buying...`, statusType: 'info'});
    this.props.beGateway.buy(this.props.gameInfo.gameId, this.props.playerInfo.playerId, 
      this.props.owner._id, cardIds)
    .then((v) => {
      console.log(`onStartBuy: v = ${JSON.stringify(v)}`);
      if (!v.ok) {
        this.setState({statusMessage: `error ${v.status} on buy: ${v.statusText}`, statusType: 'error'});
      }
      this.setState({statusMessage: 'bought!', statusType: 'success'});
      this.props.onPlayerDeckBEChange();
    }).catch((e) => {
      this.setState({statusMessage: JSON.stringify(e), statusType: 'error'});
    });
  }

  onStartSell(cards) {
    console.log(`wants to sell cards ${JSON.stringify(cards)}`);
    // just need the IDs to send over the wire.
    if (!cards) return;
    let cardIds = cards.map((card) => card._id);
    this.setState({statusMessage: `selling...`, statusType: 'info'});
    this.props.beGateway.sell(this.props.gameInfo.gameId, this.props.playerInfo.playerId, 
      this.props.owner._id, cardIds)
    .then((v) => {
      console.log(`onStartSell: v = ${JSON.stringify(v)}`);
      if (!v.ok) {
        this.setState({statusMessage: `error ${v.status} on sell: ${v.statusText}`, statusType: 'error'});
      }
      this.setState({statusMessage: 'sold!', statusType: 'success'});
      this.props.onPlayerDeckBEChange();
    }).catch((e) => {
      this.setState({statusMessage: JSON.stringify(e), statusType: 'error'});
    });
  }

  render() {
    if (!this.props.owner) {
      return <div>Oops, merchant page, but no merchant supplied</div>
    }
    let showModalUI = () => {
      let setBuying = (val) => { this.setState({ buying: val }) };

      let buying = this.state.buying;

      return <div><button className="merchant" current={buying ? "yes" : "no"} onClick={(e) => setBuying(true)}>Buy</button>
        <button className="merchant" current={buying ? "no" : "yes"} onClick={(e) => setBuying(false)}>Sell</button>
      </div>;

    }
      

    let buying = this.state.buying;
    return <div>Hello from the merchant page for merchant {this.props.owner.name}'s store.
    <br/>{showModalUI()}
    <DeckComponentMerchant deck={this.state.merchantDeck} gameInfo={this.props.gameInfo} current={buying?"yes":"no"}
    onTransact={(cards) => this.onStartBuy(cards)}/>
    <DeckComponent deck={this.props.playerInfo.deck} gameInfo={this.props.gameInfo} current={buying?"no":"yes"}
    onTransact={(cards) => this.onStartSell(cards)}/>
    <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
    </div>;
  }
}

export default MerchantPage;