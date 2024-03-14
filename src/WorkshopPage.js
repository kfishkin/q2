import React from 'react';
import CardsModal from './CardsModal';
import Card from './Card';
import CardDetail from './CardDetail';
import StatusMessage from './StatusMessage';
import WorkshopInputPickerJudge from './WorkshopInputPickerJudge';
import WorkshopInputPickerRecipe from './WorkshopInputPickerRecipe';


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
      inputPiles: [],
      showModal: false,
      modalTopHtml: '',
      modalBottomHtml: '',
      modalCards: {},
    }
  }

  componentDidMount() {
    // TODO: playerInfo.deck is Card objects.
    let asObjects = this.props.playerInfo.deck.map((c) => Card.Of(c));
    let machineCards = asObjects.filter((card) => {
      return card.getBase().canMakeCards()
    });
    this.setState({ machineCards: machineCards });
  }

  onMachineSelect(card) {
    let canTryNow = (card.getBase().getNumInputs() === 0);
    let statusMessage = `Workshop for the ${card.game_card.display_name}`;
    // fire off a request to see if it's immediately usable...
    if (canTryNow) {
      let gameId = card.getBase().getGameId();
      let playerId = card.getPlayerId();
      let machineId = card.getId();
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
      return (<li style={{ "display": "inline-block" }} onClick={(e) => this.onMachineSelect(card)}><CardDetail card={card.getDb()} baseCards={this.props.gameInfo.baseCards} deck={this.props.gameInfo.deck} /></li>)
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

    let onPilesChange = (newPiles) => {
      //console.log(`newPiles:called`);
      this.setState({inputPiles: newPiles, goodToGo: true});
    }

    let makeInputAreaUI = () => {
      let base = this.state.machineCard.getBase();
      if (base.getNumInputs() === 0) {
        return "";
      }
      // at least for the judge, the first input drives all the others.
      // Plus there are typically only a few options for each.
      // also, recipes and the judge require _two_ things per step (amount and ingredient).
      // also, some machines don't care about order input, others do (e.g. the judge
      // requires that the outline be supplied first)
      // doing this all at this level leads to generalization hell. Instead, punt it
      // to the particular machine, which just tell me when the piles change,
      // and when all are specified.
      // I can't quite see how to have classes return components, like
      //         <{this.state.machineCard.getBase().GetInputUI()} life="42"/>
      // so instead for once hard-wire things, sorry...
      let pickerName = base.getInputPickerComponentName();
      // onPilesChange - f(newPiles) -
      // complete means that there's something in each required input,
      // needs to take deck as input so can show candidates
      // 
      let picker = "";
      // TODO: remove when playerInfo.deck is Cards.
      let deckCards = this.props.playerInfo.deck.map((c) => Card.Of(c));
      switch (pickerName) {
        case 'WorkshopInputPickerJudge':

          picker = <WorkshopInputPickerJudge machine={this.state.machineCard} beGateway={this.props.beGateway}
            deck={deckCards} baseCards={this.props.gameInfo.baseCards} onPilesChange={(newPiles) => onPilesChange(newPiles)} />
          break;
        case 'WorkshopInputPickerRecipe':
          picker = <WorkshopInputPickerRecipe gameId={this.props.gameInfo.gameId} playerId={this.props.playerInfo.playerId} 
            machine={this.state.machineCard} beGateway={this.props.beGateway}
            deck={deckCards} baseCards={this.props.gameInfo.baseCards} onPilesChange={(newPiles) => onPilesChange(newPiles)}/>;
          break;
        default:
      }
      return <div className='workshop_inputs'>
        {picker}
      </div>
    }


    let onTurnCrank = () => {
      console.log(`fire in the hole!`);
      let card = this.state.machineCard;
      let gameId = card.getBase().getGameId();
      let playerId = card.getPlayerId();
      let machineId = card.getId();
      let statusMessage = `..trying to use the ${card.game_card.display_name}`;
      this.setState({statusMessage: statusMessage, statusType: 'info'});

      // the input piles for the BE are cards
      let pilesOfIds = [];
      for (let step = 0; step < this.state.inputPiles.length; step++) {
        let pileOfIds = this.state.inputPiles[step].map((card) => card.getId());
        pilesOfIds.push(pileOfIds);
      }
      this.props.beGateway.use(gameId, playerId, machineId, pilesOfIds).then((v) => {
        console.log(`fe: beGateway.use.ok = ${v.ok}, v = ${JSON.stringify(v)}`);
        if (!v.ok) {
          this.setState({ statusMessage: v.errorText, statusType: 'error', goodToGo: false });
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
            modalCards: addedCards,
            modalTopHtml: v.topHtml, modalBottomHtml: v.bottomHtml
          });
          console.log(`set top to ${v.topHtml}, bottom to ${v.bottomHtml}`);
          this.setState({ showModal: true }); // wait until after other stuff set

          if (this.props.onPlayerDeckBEChange) {
            this.props.onPlayerDeckBEChange();
          }
        }

      }).catch((e) => {
        console.log(`fe:beGateway.use e = ${e}, e.name = ${e.name}, message=${e.message}`);
        this.setState({ statusMessage: e.message, statusType: 'error' });
      });
    }

    const handleOk = () => {
      this.setState({showModal: false});
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
          <CardDetail card={this.state.machineCard} baseCards={this.props.gameInfo.baseCards} />

          <div className="postamble">
            <button id="machine_do" disabled={!this.state.goodToGo} onClick={(e) => onTurnCrank()}>Use it</button>
          </div>
          <CardsModal title="Workshop" open={this.state.showModal} onOk={handleOk} onCancel={handleOk}
            cards={this.state.modalCards}
            topHtml={this.state.modalTopHtml}
            bottomHtml={this.state.modalBottomHtml}
            baseCards={this.props.baseCards}
          />
        </div>
          {makeInputAreaUI()}
      </div>
    </div >;
  }
}

export default WorkshopPage;

// title - title
//  topHtml - html to show above.
//  bottomHtml - html to show below.
// onOk, onCancel - callbacks
// open - should I be open?
// gameInfo - needed for description
// deck - needed for description