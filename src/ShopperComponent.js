import React from 'react';

// lets users use a personal shopper for common tasks.
class ShopperComponent extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
      prices: {},
    };
  }

  componentDidMount() {
    this.props.beGateway.getArtisanPrices(this.props.gameId)
      .then((v) => {
        this.setState({prices: v});
      }).catch((e) => {
      });

  }

  sellLearningsUI() {
    // any scores or learnings they have for recipe outlines
    // for recipes they already know can be tossed.
    let disabled = true;
    let recipes = this.props.deck.filter((card) => card.getBase().isRecipe());
    let sellDescrs = [];
    let sellCards = [];
    recipes.forEach((recipeCard) => {
      let recipeDescr = recipeCard.terselyDescribe();
      let outlineBaseId = recipeCard.getBase().getRecipe().outline;
      let learnings = this.props.deck.filter((card) => card.isLearningFor(outlineBaseId));
      learnings.forEach((learningCard) => {
        sellCards.push(learningCard);
      });
      if (learnings.length > 0) {
        // sigh. English.
        let preamble = (learnings.length === 1) ? "There is 1 Learning card"
          : `There are ${learnings.length} Learning cards `;
        sellDescrs.push(<li>{preamble} that you used to learn the '{recipeDescr}' recipe: no longer needed.</li>)
      };
      // same thing, but for outlines.
      let outlines = this.props.deck.filter((card) => card.getBase().getRecipeOutline() && card.getBase().getId() === outlineBaseId);
      outlines.forEach((outlineCard) => {
        sellCards.push(outlineCard);
      })
      if (outlines.length > 0) {
        // sigh. English.
        let preamble = (outlines.length === 1) ? "There is 1 Recipe Outline card"
          : `There are ${outlines.length} Recipe Outline cards `;
        sellDescrs.push(<li>{preamble} that you used to learn the '{recipeDescr}' recipe: no longer needed.</li>)
      };
    })
    if (sellDescrs.length === 0) {
      return (<div>
        <span>If you had some, I could...</span><br/>
      <button disabled={disabled}>Sell Score and Learning cards you don't need anymore </button>
      </div>);
    }
    return (<div>
      <ul>{sellDescrs}</ul>
    <button onClick={(e) => this.props.onStartSell(sellCards)}>Sell 'em'</button>
    </div>);
  }

  shopperUI() {
    return (<div>
      <span>I can...</span>
      <hr/>
      {this.sellLearningsUI()}
      <hr/>
      <button disabled='disabled'>Buy ingredients for you</button>
    </div>)

  }

  render() {
    let imgUrl = "pix/card_backgrounds/shopping_bags.png";
    return (
      <div className='shopper_component' current={this.props.current}>
        <div horiz='yes' style={{verticalAlign: 'top'}}>
          <span>The Personal Shopper can take some of the tedcium out of shopping...</span>
        <div className='card_face_border'>
          <div className="card_face_description_bg">
            <img src={imgUrl} width="250" alt="" />
          </div>
        </div>
        </div>
        <div horiz='yes'>
          {this.shopperUI()}
        </div>
      </div>
    )
  }
}
export default ShopperComponent;
