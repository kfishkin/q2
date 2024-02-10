import React from 'react';

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
    let recipeCard = this.props.machine;
    let recipeInfo = recipeCard.GetBase().GetRecipeInfo();
    let inputPiles = [];
    for (const i in recipeInfo.ingredients) {
      let amount = recipeInfo.amounts[i];
      let ingredBaseId = recipeInfo.ingredients[i];
      let haves = this.props.deck.filter((c) => c.GetBase().GetId() === ingredBaseId);
      let haveThis = (haves.length >= amount);
      if (haveThis) {
        let pile = haves.slice(0, amount);
        inputPiles.push(pile);
      }
    }
    let haveAll = (inputPiles.length >= recipeInfo.ingredients.length);
    this.setState({piles: inputPiles, haveAll: haveAll});
    if (haveAll) {
      this.props.onPilesChange(inputPiles);
    }
  }

  render() {
    let recipeCard = this.props.machine;
    let recipeInfo = recipeCard.GetBase().GetRecipeInfo();
    let numSteps = recipeInfo.ingredients.length;

      const preamble = () => {
        return <span>The {recipeCard.GetBase().GetDisplayName()} recipe has <b>{numSteps}</b> steps:</span>;
      }

      const stepsUI = () => {
        let steps = [];
        for (const i in recipeInfo.ingredients) {
          let amount = recipeInfo.amounts[i];
          let ingredBaseId = recipeInfo.ingredients[i];
          let ingredName = this.props.baseCards[ingredBaseId].GetDisplayName();
          let haves = this.props.deck.filter((c) => c.GetBase().GetId() === ingredBaseId);
          let haveThis = (haves.length >= amount);
          let icon = 'thumbs_down.png';
          let alt = "not enough";
          if (haveThis) {
            icon = 'thumbs_up.png';
            alt = "good to go"
          }
          steps.push(<li>
            <span><b>{amount}</b> of <b>{ingredName}</b> (have {haves.length})</span>
            <img src={`pix/icons/${icon}`} className='thumb_icon' alt={alt}/>
          </li>)
        }

        return <ol>{steps}</ol>;
      }


      return (<div>
        {preamble()}
        {stepsUI()}
          </div>);
    }
}

export default WorkshopInputPickerRecipe;