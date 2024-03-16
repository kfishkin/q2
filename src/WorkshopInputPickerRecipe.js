import React from 'react';
import BuyNeededComponent from './BuyNeededComponent';

// props:
// machine - the card for the machine that needs input
// beGateway - the be gateway
// deck - deck of Cards the player has
// baseCards hash of BaseCards in the game.
// gameId
// heartbeat
// onTurnCrank - callback(newPiles) when user wants to turn the crank, (newPiles) are the input cards.
// onPlayerDeckBEChange - BE deck has changed.
// in this case, we stuff it with the cards to consume, assuming they have enough.
const BAD_ID = 0;
class WorkshopInputPickerRecipe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buying: false,
      selectedCategoryCard: null,
    }
  }

  componentDidMount() {
  }

  // computes locally, does NOT set state.
  makeNeedsAndPiles() {
    let recipeCard = this.props.machine;
    let recipeInfo = recipeCard.getBase().getRecipeInfo();
    let inputPiles = [];
    let used = {};
    let needs = {};
    for (const i in recipeInfo.ingredients) {
      let amount = recipeInfo.amounts[i];
      let ingredBaseId = recipeInfo.ingredients[i];
      let haves = this.props.deck.filter((c) => (c.getBase().getId() === ingredBaseId) && !used[c.getId()]);
      let haveThis = (haves.length >= amount);
      let pile = null;
      if (haveThis) {
        pile = haves.slice(0, amount);
        pile.forEach((c) => used[c.getId()] = true);
      } else {
        // this happens if
        // (a) I just don't have it, or
        // (b) I'm a category, in which case want to wait until
        // UI has selected.
        let ingredBaseCard = this.props.baseCards[ingredBaseId];
        // this happens if a category, you don't "have" that in your deck.
        // so UI will pick, just put a placeholder:
        if (ingredBaseCard.isCategory() && this.state.selectedCategoryCard) {
          haveThis = true;
          pile = [this.state.selectedCategoryCard];
        } else if (ingredBaseCard.getDb().buyable) {
          let needed = amount - haves.length;
          // it might already have been needed...
          let curNeed = needs[ingredBaseId] ? needs[ingredBaseId].needed + needed : needed;
          needs[ingredBaseId] = { needed: curNeed, baseCard: ingredBaseCard }
        }
      }
      if (pile) {
        inputPiles.push(pile);
      }
    }

    let haveAll = (inputPiles.length >= recipeInfo.ingredients.length);
    return { needs, inputPiles, haveAll};
  }

  makePilesAndSignal() {
    let {needs, inputPiles, haveAll} = this.makeNeedsAndPiles();
    console.log(`makePiles: needs = ${JSON.stringify(needs)}`);
  }

  render() {
    // react doesn't like this, but I can't find a better way to force re-computation
    // when heartbeat changes.
    let recipeCard = this.props.machine;
    let recipeInfo = recipeCard.getBase().getRecipeInfo();
    let numSteps = recipeInfo.ingredients ? recipeInfo.ingredients.length : 0;

    const preamble = () => {
      return <span>The {recipeCard.getBase().getDisplayName()} recipe has <b>{numSteps}</b> steps:</span>;
    }

    const stepsUI = () => {
      let steps = [];
      for (const i in recipeInfo.ingredients) {
        let amount = recipeInfo.amounts[i];
        let ingredBaseId = recipeInfo.ingredients[i];
        let baseCard = this.props.baseCards[ingredBaseId];
        let ingredName = this.props.baseCards[ingredBaseId].getDisplayName();
        let candidates = baseCard.ContainedInDeck(this.props.deck);
        if (baseCard.isCategory()) {
          candidates = baseCard.ContainedInDeck(candidates);
        }

        let have = candidates.length;
        let haveThis = (have >= amount);
        let icon = 'thumbs_down.png';
        let alt = "not enough";
        if (haveThis) {
          icon = 'thumbs_up.png';
          alt = "good to go"
        }

        const categoryUI = (baseCard, candidates) => {
          let onCategorySpec = (e) => {
            let val = e.target.value;
            console.log(`you chose ${val}`);

            let card = this.props.deck.find((c) => c.getId() === val);
            //console.log(`card = ${JSON.stringify(card)}`);
            // callback is for waiting until after setState()
            // is complete.
            this.setState({ selectedCategoryCard: card }, () => this.makePilesAndSignal());
          }
          let selectOptions = candidates.map((card) => {
            return (<option value={card.getId()} selected={this.state.selectedCategoryCard && (this.state.selectedCategoryCard.getId() === card.getId())}>{card.terselyDescribe()}</option>)
          })
          // prepend the 'None' option.
          selectOptions.unshift(<option value={BAD_ID} selected={!this.state.selectedCategoryCard}> ---- None ----</option>);

          // if this was a category card, need to have user pick which one.
          return <select className='width250' onChange={(val) => onCategorySpec(val)}>
            {selectOptions}
          </select>
        }

        steps.push(<li key={Math.random()}>
          <span><b>{amount}</b> of <b>{ingredName}</b> {(baseCard.isCategory() && candidates.length > 0) ? categoryUI(baseCard, candidates) : ""}(have {have})</span>
          <img src={`pix/icons/${icon}`} className='thumb_icon' alt={alt} />
        </li>)
      }

      return <ol className='step_list'>{steps}</ol>;
    }

    const needsUI = () => {
      const onInitiate = (baseCardIds) => {
        console.log(`onInitiate: baseCardIds = ${baseCardIds.join()}`);
        this.setState({ buying: true });
        this.props.beGateway.buyBulk(this.props.gameId, this.props.playerId, baseCardIds).then((v) => {
          this.props.onPlayerDeckBEChange();
          this.setState({ buying: false });
          this.makePilesAndSignal();
        }).catch((e) => {
          console.log(e);
          this.setState({ buying: false });
        });        
      }
      
      let {needs, inputPiles, haveAll} = this.makeNeedsAndPiles();
      console.log(`haveAll = ${haveAll}, needs = ${JSON.stringify(needs)}`);

    const doitUI = () => {
      return (
      <div className="postamble">
      <button id="machine_do" disabled={!haveAll} onClick={(e) => this.props.onTurnCrank(inputPiles)}>Use it</button>
    </div>
      );
    }

      return (<div>
        <BuyNeededComponent buying={this.state.buying} deck={this.props.deck} gameId={this.props.gameId} 
          heartbeat={this.props.heartbeat}
          needs={needs} onInitiate={onInitiate} beGateway={this.props.beGateway} />
          {doitUI()}
      </div>)
    }



    return (<div>
      {preamble()}
      {stepsUI()}
      {needsUI()}
    </div >);
  }
}

export default WorkshopInputPickerRecipe;