import React from 'react';
import Card from './Card';
import StatusMessage from './StatusMessage';
import { CARD_TYPES } from './CardType';


// props
// beGateway
// deck
// onPlayerDeckBEChange
class CashierPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statusMessage: "",
      statusType: "info",
      moneyCards: null,
      moneyTotal: 0,
      gameId: null, // this and player id gtten from the deck.
      playerId: null,
      tightOption: null, // array of base cards
    };
    this.loading = false;
  }

  componentDidMount() {
    // find the money cards
    //console.log(`deck = ${JSON.stringify(this.props.deck)}`);
    let moneyCards = [];
    let moneyTotal = 0;
    let gameId = 0;
    let playerId = 0;
    // forEach since need to do 3 things ....
    this.props.deck.forEach((card) => {
      if (card.game_card.type === CARD_TYPES.MONEY) {
        moneyCards.push(card);
        moneyTotal += parseInt(card.game_card.sell_value);
        gameId = card.game_card.game_id;
        playerId = card.player_id;
      }
    });
    this.setState({moneyCards, moneyTotal, gameId, playerId});
    console.log(`asking for tight money option`);
    this.props.beGateway.getTightMoneyOption(gameId, moneyTotal)
      .then((v) => {
        console.log(`tight money option = ${JSON.stringify(v)}`);
        this.setState({tightOption: v});
      }).catch((e) => {
        console.error(`error ${e} getting tight money option`);
      })
  }

  render() {
    if (!this.state.moneyCards) {
      return <div>You don't have any money right now.</div>
    }

    let tightOption = this.state.tightOption;

    let doCondense = () => {
      this.setState({statusMessage: 'condensing your money...', statusType: 'info'});
      this.props.beGateway.tightenMoney(this.state.gameId, this.state.playerId)
      .then((v) => {
        console.log(`fe: tighten returned ${v}`);
        this.setState({statusMessage: 'done', statusType: 'success'});
        this.props.onPlayerDeckBEChange();
        this.forceUpdate(); // not sure why it's needed...
      }).catch((e) => {
        console.error(`fe: tighten error ${e}`);
        this.setState({statusMessage: `error: ${e.message}`, statusType: 'error'});
      });
    }
    let onStartCondense = () => {
      let tightDescr = tightOption.map((baseCard) => baseCard.display_name).join();
      let ok = window.confirm(`Are you sure you want to condense your ${this.state.moneyTotal} into (${tightDescr})?`);
      if (ok) {
        console.log("do it");
        doCondense();
      }
    };
    let tightButton = (tightOption && tightOption.length < this.state.moneyCards.length)
      ? (<button onClick={(e)=> onStartCondense()}>condense it into <b>{tightOption.length}</b> cards</button>)
      : null;
    return <div>
      <br />You have $<b>{this.state.moneyTotal}</b> on {this.state.moneyCards.length} money cards.
      <br />{tightButton}
      <br/>You can <button>make change into smaller cards</button>
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
    </div>
  }
}

export default CashierPage;