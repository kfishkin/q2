import React from 'react';
import CardDetail from './CardDetail';
import { CARD_TYPES } from './CardType';
import StatusMessage from './StatusMessage';


// props
// owner: the player structure for the merchant that owns this shop.
// beGateway
// gameInfo
// playerInfo
// onPlayerDeckBEChange
class WorkshopPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      machineCards: null, // the possible machine cards
      machineCard: null, // the chosen one
      statusMessage: "",
      statusType: 'info',
      goodToGo: false,
      inputPiles: []
    }
  }

  componentDidMount() {
    let canMakeCards = (card) => {
      if (!card || !card.game_card) return false;
      let type = card.game_card.type;
      return type === CARD_TYPES.MACHINE
        || type === CARD_TYPES.RECIPE
        ;
    }

    console.log(`player deck handles = ${this.props.playerInfo.deck.map((c) => c.game_card.handle).join()}`);
    let machineCards = this.props.playerInfo.deck.filter((c) => canMakeCards(c));
    console.log(`machine card handles = ${machineCards.map((c) => c.game_card.handle).join()}`);
    this.setState({ machineCards: machineCards });
  }

  onMachineSelect(card) {
    console.log(`you clicked on ${JSON.stringify(card)}`);
    console.log(`num inputs = ${card.game_card.machine.num_inputs}`);
    let canTryNow = (card.game_card.machine.num_inputs === 0);
    let statusMessage = `Workshop for the ${card.game_card.display_name}`;
    // fire off a request to see if it's immediately usable...
    if (canTryNow) {
      let gameId = card.game_card.game_id;
      let playerId = card.player_id;
      let machineId = card._id;
      statusMessage = '..checking to see if the card is usable right now';

      this.props.beGateway.canUse(gameId, playerId, machineId, []).then((v) => {
        console.log(`fe: beGateway.ok = ${v.ok}, v = ${JSON.stringify(v)}`);
        if (v.ok) {
          this.setState({ statusMessage: 'good to go!', statusType: 'info', goodToGo: true });
        } else {
          this.setState({ statusMessage: v.statusText, statusType: 'error', goodToGo: false });
        }
      }).catch((e) => {
        console.log(`fe:beGateway e = ${e}, e.name = ${e.name}, message=${e.message}`);
        this.setState({ statusMessage: e.message, statusType: 'error' });
      });
    }

    this.setState({
      machineCard: card,
      statusMessage: statusMessage,
      statusType: 'info',
    });
  }

  chooseMachineCard() {
    let cardBoxes = this.state.machineCards.map((card) => {
      //return (<li style={{"display":"inline-block"}}>{card.game_card.handle}</li>)
      return (<li style={{ "display": "inline-block" }} onClick={(e) => this.onMachineSelect(card)}><CardDetail card={card} gameInfo={this.props.gameInfo} deck={this.props.gameInfo.deck} /></li>)
    })
    return (<div>
      Click on the card you would like to use:
      <ul className='machine_select'>
        {cardBoxes}
      </ul>
    </div>)

  }

  render() {
    if (this.state.machineCards === null || this.state.machineCards.length === 0) {
      return <div>
        The 'Workshop' is where you can use Recipe and Machine cards
        to make more cards. Presently, you don't have any cards of those types.
      </div>
    }
    if (this.state.machineCard === null) {
      return this.chooseMachineCard();
    }
    let onChooseDifferent = () => {
      this.setState({ machineCard: null });
    }

    let onTurnCrank = () => {
      console.log(`fire in the hole!`);
      let card = this.state.machineCard;
      let gameId = card.game_card.game_id;
      let playerId = card.player_id;
      let machineId = card._id;
      let statusMessage = `..trying to use the ${card.game_card.display_name}`;
      this.setState({statusMessage: statusMessage, statusType: 'info'});

      this.props.beGateway.use(gameId, playerId, machineId, this.state.inputPiles).then((v) => {
        console.log(`fe: beGateway.use.ok = ${v.ok}, v = ${JSON.stringify(v)}`);
        if (v.ok) {
          // this should be a tuple, first is the IDs of deleted cards,
          // second is the body of new cards
          let deletedIds = v[0];
          console.log(`deleted ids = ${JSON.stringify(deletedIds)}`);
          let numDeleted = deletedIds ? deletedIds.length : 0;
          let addedCardNames = [];
          let addedCards = v[1];
          console.log(`added cards = ${JSON.stringify(v[1])}`);
          if (addedCards) {
            addedCardNames = addedCards.map((c) => c.game_card.display_name);
          }
          let msg = "Success!";
          if (numDeleted === 1) {
            msg += " 1 card consumed";
          } else {
            msg += ` ${numDeleted} cards consumed`;
          }
          msg += ` Added: ${addedCardNames.join()}`;
          this.setState({ statusMessage: msg, statusType: 'info' });
          if (this.props.onPlayerDeckBEChange) {
            this.props.onPlayerDeckBEChange();
          }
        } else {
          this.setState({ statusMessage: v.statusText, statusType: 'error', goodToGo: false });
        }
      }).catch((e) => {
        console.log(`fe:beGateway.use e = ${e}, e.name = ${e.name}, message=${e.message}`);
        this.setState({ statusMessage: e.message, statusType: 'error' });
      });
    }

    // status message across the top, so it doesn't get lost.
    // on the left, show the machine card, with the 'use it' button below that.
    // on the right, the input playground.
    return <div className='workshop'>
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
      <div className="workshop_inandout">
        <div className='workshop_machine'>
          <div className="preamble">
            The workshop is using a <b>{this.state.machineCard.game_card.display_name}</b> card.
            <br /> You can also <button onClick={(e) => onChooseDifferent()}>choose a different one</button>
          </div>
          <CardDetail card={this.state.machineCard} gameInfo={this.props.gameInfo} deck={this.props.gameInfo.deck} />

          <div className="postamble">
            <button id="machine_do" disabled={!this.state.goodToGo} onClick={(e) => onTurnCrank()}>Use it</button>
          </div>
        </div>
        <div className='workshop_inputs'>
          <span class="fooble">Here is where the inputs go</span>
          <br />
          line 1
          <br />
          line 2
        </div>
      </div>
    </div >;
  }
}

export default WorkshopPage;