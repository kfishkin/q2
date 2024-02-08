import React from 'react';
import StatusMessage from './StatusMessage';
import { CARD_TYPES } from './BaseCard';
import Card from './Card';


// props
// beGateway
// deck
// onPlayerDeckBEChange
// baseCards
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
      baseMoneyCards: [],
    };
  }

  componentDidMount() {
    // find the money cards in the game, and sort by value desc.
    let baseMoneyCards = [];
    if (this.props.baseCards) {
      // it's a dict, not an array. keys are ids, don't care about those..
      baseMoneyCards = Object.values(this.props.baseCards).filter((bc) => bc.IsMoney());
      baseMoneyCards.sort((a,b) => b.sell_value - a.sell_value);
      //console.log(`baseMoneyCards = ${baseMoneyCards}`);
    }
    // find the player's money cards, and the game's
    //console.log(`deck = ${JSON.stringify(this.props.deck)}`);
    let moneyCards = [];
    let moneyTotal = 0;
    let gameId = 0;
    let playerId = 0;
    // forEach since need to do 3 things ....
    this.props.deck.forEach((card) => {
      // TODO: (deck) argument is array of Cards.
      let cardObj = new Card(card);
      if (cardObj.GetBase().IsMoney()) {
        moneyCards.push(card);
        moneyTotal += parseInt(card.game_card.sell_value);
        gameId = card.game_card.game_id;
        playerId = card.player_id;
      }
    });
    moneyCards.sort((a,b) => b.game_card.sell_value - a.game_card.sell_value);
    this.setState({moneyCards, moneyTotal, gameId, playerId, baseMoneyCards});
    this.props.beGateway.getTightMoneyOption(gameId, moneyTotal)
      .then((v) => {
        console.log(`tight money option = ${JSON.stringify(v)}`);
        this.setState({tightOption: v});
      }).catch((e) => {
        console.error(`error ${e} getting tight money option`);
      })
  }

  
  makeChangeUI() {
    if (!this.state.baseMoneyCards) {
      return <div>no base money cards yet.</div>
    }
    // if you have at least one bill of a denom higher than the lowest value in that currency,
    // you can make change.
    let minDenom = this.state.baseMoneyCards[this.state.baseMoneyCards.length - 1].sell_value;
    let couldDos = [];
    let lastValue = -1;

    let doBreak = (from, to) => {
      this.setState({statusMessage: `breaking your ${from}s into ${to}s...`, statusType: 'info'});
      this.props.beGateway.breakMoney(this.state.gameId, this.state.playerId, from, to)
      .then((v) => {
        console.log(`fe: break returned ${v}`);
        this.setState({statusMessage: 'done', statusType: 'success'});
        this.props.onPlayerDeckBEChange();
        this.forceUpdate(); // not sure why it's needed...
      }).catch((e) => {
        console.error(`fe: break error ${e}`);
        this.setState({statusMessage: `error: ${e.message}`, statusType: 'error'});
      });
    };

    let onBreakStart = (from, to) => {
      // console.log(`user wants to convert ${from} to ${to}`);
      let ok = window.confirm(`Are you sure you want to condense your ${from}s into (${to}s)?`);
      if (ok) {
        doBreak(from, to);
      }
    }

    let optionsShown = {};
    this.state.moneyCards.forEach((card) => {
      let fromValue = card.game_card.sell_value;
      if (fromValue > 2*minDenom && fromValue !== lastValue) {
        this.state.baseMoneyCards.forEach((baseCard) => {
          let toValue = baseCard.sell_value;
          let key = `${fromValue} to ${toValue}`;
          if ((fromValue > toValue) && (toValue * 2 < this.state.moneyTotal)
            && !(key in optionsShown)) {
            couldDos.push(<button onClick={(e) => onBreakStart(fromValue, toValue)}>convert ${fromValue}s to ${toValue}s</button>);
            optionsShown[key] = true;
          }
      });
    }
    });
    if (couldDos.length > 0) {
      return <div><span>Would you like to:<ul>{couldDos}</ul></span></div>
    }
    return <span/>;
  }

  render() {
    if (!this.state.moneyCards) {
      return <div>You don't have any money right now.</div>
    }

    let tightOption = this.state.tightOption;


    let doTighten = () => {
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
    let onStartTighten = () => {
      let tightDescr = tightOption.map((baseCard) => baseCard.display_name).join();
      let ok = window.confirm(`Are you sure you want to condense your ${this.state.moneyTotal} into (${tightDescr})?`);
      if (ok) {
        console.log("do it");
        doTighten();
      }
    };
    let tightButton = (tightOption && tightOption.length < this.state.moneyCards.length)
      ? (<button onClick={(e)=> onStartTighten()}>condense it into <b>{tightOption.length}</b> cards</button>)
      : null;
    return <div>
      <br />You have $<b>{this.state.moneyTotal}</b> on {this.state.moneyCards.length} money cards.
      <br />{tightButton}
      {this.makeChangeUI()}

      <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
    </div>
  }
}

export default CashierPage;