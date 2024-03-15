import React from 'react';

// props:
// machine - the card for the machine that needs input
// beGateway - the be gateway
// deck - deck of Cards the player has
// baseCards hash of BaseCards in the game.
// onPilesChange - callback(newPiles) whenever piles have changed, and we think it's good to go.
// onPlayerDeckBEChange - BE deck has changed.
// in this case, we stuff it with the cards to consume, assuming they have enough.
class WorkshopInputPickerRecipe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      piles: [], // one per step
      buyableNeeds: {}, // map from needed base id to {# needed, base card}
      buying: false,
      haveAll: false,
      selectedCategoryId: 0,
    }
  }

  componentDidMount() {
    this.makePilesAndSignal();
  }

  makePilesAndSignal() {
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
      let pile;
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
        if (ingredBaseCard.isCategory()) {
          pile = ['category_placeholder'];
        } else if (ingredBaseCard.getDb().buyable) {
          let needed = amount - haves.length;
          needs[ingredBaseId] = { needed: needed, baseCard: ingredBaseCard }
        }
      }
      if (pile) {
        inputPiles.push(pile);
      }
    }
    let haveAll = (inputPiles.length >= recipeInfo.ingredients.length);
    this.setState({ piles: inputPiles, haveAll: haveAll, buyableNeeds: needs });
    if (haveAll) {
      this.props.onPilesChange(inputPiles);
    }

  }

  render() {
    let recipeCard = this.props.machine;
    let recipeInfo = recipeCard.getBase().getRecipeInfo();
    let numSteps = recipeInfo.ingredients.length;

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
            if (card) {
              let newPiles = this.state.piles;
              newPiles[0] = [card];
              this.setState({ piles: newPiles, goodToGo: (val !== 0), selectedCategoryId: val });
              this.props.onPilesChange(newPiles);
            }
          }
          let selectOptions = candidates.map((card) => {
            return (<option value={card.getId()} selected={card.getId() === this.state.selectedCategoryId}>{card.terselyDescribe()}</option>)
          })
          // prepend the 'None' option.
          selectOptions.unshift(<option value="0" selected={0 === this.state.selectedCategoryId}> ---- None ----</option>);

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
      let needs = this.state.buyableNeeds;
      // sort 'em by alpha.
      if (!needs || Object.keys(needs).length === 0) {
        return '';
      }
      let needObjs = Object.values(needs);
      needObjs.sort((blob1, blob2) => blob1.baseCard.getDisplayName().localeCompare(blob2.baseCard.getDisplayName()));
      let totalCost = 0;
      let parts = [];
      needObjs.forEach((neededObj) => {
        const MARKUP = 2.0;
        let unitPrice = Math.round(neededObj.baseCard.getSellValue() * MARKUP);
        let cost = neededObj.needed * unitPrice;
        parts.push(<li key={Math.random()}>{neededObj.baseCard.getDisplayName()}:{neededObj.needed} @ {unitPrice} --&gt; ${cost}</li>);
        totalCost += cost;
      });

      const buyButtonUI = (totalCost) => {
        const onBuy = () => {
          let baseCardIds = [];
          Object.values(this.state.buyableNeeds).forEach((blob) => {
            let n = blob.needed;
            let id = blob.baseCard.getId();
            for (let i = 0; i < n; i++) {
              baseCardIds.push(id);
            }
          });
          console.log(`onBuy: called, gameId = ${this.props.gameId}, playerId = ${this.props.playerId}, bcIds = ${baseCardIds.join()}`);
          this.setState({buying: true});
          this.props.beGateway.buyBulk(this.props.gameId, this.props.playerId, baseCardIds).then((v) => {
            this.props.onPlayerDeckBEChange();
            this.setState({buying: false});
            this.makePilesAndSignal();
          }).catch((e) => {
            console.log(e);
            this.setState({buying: false});
          });
        }

        if (this.state.buying) {
          return <span>buying...</span>;
        } else {
          return <button onClick={onBuy}>Buy for ${totalCost}</button>
        }
      }
      <button>buy for ${totalCost}</button>
      return (<div>
        <hr/>
        <span>Missing ingredients:</span>
        <br/>
        <ol style={{textAlign: 'left'}}>
          {parts}
        </ol>
        <br/>
        {buyButtonUI(totalCost)}

      </div>)

    }


    return (<div>
      {preamble()}
      {stepsUI()}
      {needsUI()}
    </div>);
  }
}

export default WorkshopInputPickerRecipe;