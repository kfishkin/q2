import React from 'react';
import { Select } from 'antd';

// props:
// machine - the card for the machine that needs input
// beGateway - the be gateway
// deck - deck of Cards the player has
// baseCards hash of BaseCards in the game.
// onPilesChange - callback(newPiles) whenever piles have changed, and we think it's good to go.
// in this case, we stuff it with the cards to consume, assuming they have enough.
class WorkshopInputPickerRecipe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      piles: [], // one per step
      haveAll: false,
    }
  }

  componentDidMount() {
    this.makePilesAndSignal();
  }

  makePilesAndSignal() {
    let recipeCard = this.props.machine;
    let recipeInfo = recipeCard.getBase().getRecipeInfo();
    let inputPiles = [];
    for (const i in recipeInfo.ingredients) {
      let amount = recipeInfo.amounts[i];
      let ingredBaseId = recipeInfo.ingredients[i];
      let haves = this.props.deck.filter((c) => c.getBase().getId() === ingredBaseId);
      let haveThis = (haves.length >= amount);
      let pile;
      if (haveThis) {
        pile = haves.slice(0, amount);
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
        }
      }
      if (pile) {
        inputPiles.push(pile);
      }
    }
    let haveAll = (inputPiles.length >= recipeInfo.ingredients.length);
    this.setState({ piles: inputPiles, haveAll: haveAll });
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
          let onCategorySpec = (val) => {
            console.log(`you chose ${val}`);
            let card = this.props.deck.find((c) => c.getId() === val);
            //console.log(`card = ${JSON.stringify(card)}`);
            if (card) {
              let newPiles = this.state.piles;
              newPiles[0] = [card];
              this.setState({ piles: newPiles, goodToGo: true });
              this.props.onPilesChange(newPiles);
            }
          }
          let selectOptions = candidates.map((card) => {
            return {
              label: card.terselyDescribe(),
              value: card.getId(),
            }
          })

          // if this was a category card, need to have user pick which one.
          return <Select style={{ width: 210 }} onChange={(val) => onCategorySpec(val)} options={selectOptions} />
        }

        steps.push(<li>
          <span><b>{amount}</b> of <b>{ingredName}</b> {(baseCard.isCategory() && candidates.length > 0) ? categoryUI(baseCard, candidates) : ""}(have {have})</span>
          <img src={`pix/icons/${icon}`} className='thumb_icon' alt={alt} />
        </li>)
      }

      return <ol className='step_list'>{steps}</ol>;
    }


    return (<div>
      {preamble()}
      {stepsUI()}
    </div>);
  }
}

export default WorkshopInputPickerRecipe;