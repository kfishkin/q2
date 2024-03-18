import React from 'react';

/**
 * Given a dictionary of needs, shows a UI allowing players to initiate
 * bulk-buy of those needs.
 * props:
 *   buying - {Boolean} am I in the midst of buying.
 *   deck - {[Card]} their money cards
 *   gameId - {id}
 *   needs - { baseCardId : { needed: Number, baseCard: BaseCard}}
 *   onInitiate - callback([BaseCard]) when they want to buy. Caller needs to check
 *   beGateway - for prices
 * bankroll etc.
 */
// lets users use a personal shopper for common tasks.
class BuyNeededComponent extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
      prices: null,
      bankroll: 0,
    };
  }

  componentDidMount() {
    this.props.beGateway.getArtisanPrices(this.props.gameId)
      .then((v) => {
        this.setState({prices: v});
      }).catch((e) => {
        console.log(`cdm:BuyNeededComponent: ${e}`);
      });
      let bankroll = 0;
      this.props.deck.filter((card) => card.getBase().isMoney()).forEach((moneyCard) => {
        bankroll += moneyCard.getBase().getSellValue();
      });
      this.setState({bankroll});
      //console.log(`cdm.BuyNeededComponent: bankroll = ${bankroll}`);
  }

   needsUI() {
    let needs = this.props.needs;
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
      parts.push(<li key={Math.random()}>{neededObj.baseCard.getDisplayName()}: {neededObj.needed} @ {unitPrice} --&gt; ${cost}</li>);
      totalCost += cost;
    });

    const buyButtonUI = (totalCost) => {
      const onBuy = () => {
        let baseCardIds = [];
        Object.values(this.props.needs).forEach((blob) => {
          let n = blob.needed;
          let id = blob.baseCard.getId();
          for (let i = 0; i < n; i++) {
            baseCardIds.push(id);
          }
        });
        if (this.props.onInitiate) {
          this.props.onInitiate(baseCardIds);
        }
      }

        return (this.props.buying ? (<div>....buying....</div>) : 
          (<div><button onClick={onBuy}>Buy for ${totalCost}</button> (you have ${this.state.bankroll})</div>));
      
    }
    <button>buy for ${totalCost}</button>
    return (<div className='buy_needed'>
      <hr />
      <span>Missing ingredients:</span>
      <br />
      <ol style={{ textAlign: 'left' }}>
        {parts}
      </ol>
      <br />
      {buyButtonUI(totalCost)}

    </div>)

  }

  render() {
    if (!this.state.prices) {
      return (<div className='buy_needed'>Finding prices...</div>);
    }
    if (this.props.buying) {
      return (<div className='buy_needed'>Buying...</div>);
    }
    //console.log(`buyNeeded: ${JSON.stringify(this.props.needs)}`);
    let needs = Object.values(this.props.needs);
    if (needs.length === 0) {
      return (<div className='buy_needed'/>);
    }

    return this.needsUI();

  }
}
export default BuyNeededComponent;
