import React from 'react';
import { CARD_TYPES } from './BaseCard';
import CardDetail from './CardDetail';

// lets users repair armor/weapons for $$.
// props:
// current - am I currently being shown?
// deck - player deck.
// onTransact(cards) - indicate desire to repair (cards)
// beGateway
// gameId
// baseCards
// bankroll
class SeerComponent extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
      prices: {},
      selectedOutlineCard: null,
      selectedClueCard: null,
      selectedStep: 0,
      outlineCards: [],
      clueCards: [],
      detailCard: null
    };
  }

  componentDidMount() {
    console.log(`repair page DCM: asking for prices`);
    this.props.beGateway.getArtisanPrices(this.props.gameId)
      .then((v) => {
        console.log(`seer: v = ${JSON.stringify(v)}`);
        this.setState({prices: v});
      }).catch((e) => {
        console.log(`seer: e = ${JSON.stringify(e)}`);
      });
    // do they have any outline cards?
    let outlineCards = this.props.deck.filter((card) => {
      return card.GetBase().GetRecipeOutline() != null;
    });    
    // do they have any clue cards?
    let clueCards = this.props.deck.filter((card) => {
      return card.GetBase().GetType() === CARD_TYPES.CLUE;
    });
    let selectedOutlineCard =  (outlineCards.length === 1) ? outlineCards[0] : null;
    let selectedClueCard = (clueCards.length === 1) ? clueCards[0] : null;
    let detailCard = selectedOutlineCard ? selectedOutlineCard
      : (selectedClueCard ? selectedClueCard : null);
    this.setState({ outlineCards, clueCards, selectedOutlineCard,
      selectedClueCard, detailCard});
  }

  outlineUI() {
    const onOutlineChoice = (e) => {
      let val = e.target.value;
      console.log(`val = ${val}`);
      let card = this.state.outlineCards.find((c) => c.GetId() === val);
      if (card) {
        this.setState({selectedOutlineCard: card, detailCard: card});
      } else {
        console.warn(`no outline with id ${val}`);
      }
    }
    let outlineCards = this.state.outlineCards;
    if (!outlineCards || outlineCards.length === 0) {
      return (<span>No recipe outline cards.</span>);
    }
    if (outlineCards.length === 1) {
      return (<span>Outline to analyze: {outlineCards[0].TerselyDescribe()}</span>) 
    }
    // do the UI thing.
    let selectedId = this.state.selectedOutlineCard ? this.state.selectedOutlineCard.GetId() : 0;
    let htmlOpts = outlineCards.map((card) => {
      return (<option value={card.GetId()} selected={card.GetId() === selectedId}>{card.TerselyDescribe()}</option>)
    });
    return (<span><span>Outline to analyze:</span>
      <select style={{width:200}} onChange={(e) => onOutlineChoice(e)}>
        {htmlOpts}
      </select>
    </span>)
  }

  clueUI() {
    const onClueChoice = (e) => {
      let val = e.target.value;
      console.log(`val = ${val}`);
      let card = this.state.clueCards.find((c) => c.GetId() === val);
      if (card) {
        this.setState({selectedClueCard: card, detailCard: card});
      } else {
        console.warn(`no clue with id ${val}`);
      }
    }
    let clueCards = this.state.clueCards;
    if (!clueCards || clueCards.length === 0) {
      return (<span>No clue cards.</span>);
    }
    if (clueCards.length === 1) {
      return (<span>Clue to use: {clueCards[0].TerselyDescribe()}</span>) 
    }
    // do the UI thing.
    let selectedId = this.state.selectedClueCard ? this.state.selectedClueCard.GetId() : 0;
    let htmlOpts = clueCards.map((card) => {
      return (<option value={card.GetId()} selected={card.GetId() === selectedId}>{card.TerselyDescribe()}</option>)
    });
    return (<span><span>Clue to use:</span>
      <select style={{width:200}} onChange={(e) => onClueChoice(e)}>
        {htmlOpts}
      </select>
    </span>)
  }

  stepUI() {
    const onStepChoice = (e) => {
      let val = e.target.value;
      console.log(`val = ${val}`);
        this.setState({selectedStep: val});
    }
    // do the UI thing.
    if (!this.state.selectedOutlineCard) {
      return "";
    }
    let selectedStep = this.state.selectedStep ? this.state.selectedStep : 0;
    let numSteps = this.state.selectedOutlineCard.GetBase().GetRecipeOutline().num_steps;
    let vals = Array(numSteps).fill(0); // without the .fill, .map doesn't work...
    vals = vals.map((v, i) => i+1);
    let htmlOpts = vals.map((val) => {
      return (<option value={val} selected={val === selectedStep}>{val}</option>)
    });
    return (<span><span>Step to analyze:</span>
      <select style={{width:200}} onChange={(e) => onStepChoice(e)}>
        {htmlOpts}
      </select>
    </span>)
  }

  priceUI() {
    if (!this.state.selectedClueCard || !this.state.selectedOutlineCard) {
      return "";
    }
    // the seer can do it all, price is F(max(input card level)).
    let level = Math.max(
      this.state.selectedOutlineCard.GetBase().GetLevel(),
      this.state.selectedClueCard.GetBase().GetLevel(),
    )
    const PRICE_KEY = 'crystal_ball';
    let price = this.state.prices[PRICE_KEY][level - 1];
    return <span>The analysis will cost <b>${price}</b></span>
  }

  showLastSelectedCardUI() {
    if (!this.state.detailCard) {
      return "";
    }
    return <CardDetail card={this.state.detailCard} baseCards={this.props.baseCards}/>;
  }

  doitUI() {
    if (!this.state.selectedClueCard || !this.state.selectedOutlineCard || !this.state.selectedStep) {
      return "";
    }
    let level = Math.max(
      this.state.selectedOutlineCard.GetBase().GetLevel(),
      this.state.selectedClueCard.GetBase().GetLevel(),
    )
    const PRICE_KEY = 'crystal_ball';
    let price = this.state.prices[PRICE_KEY][level - 1];    
    let bankroll = this.props.bankroll;
    if (price > bankroll) {
      return <div>Not enough money yet for the analysis.</div>
    }

  }

  seerUI() {
    if (!this.state.prices.crystal_ball) {
      return '...no price list yet, please come back later';
    }
    return (<div>
      {this.showLastSelectedCardUI()}
      <ul className='seer_input_list'>
      <li>{this.outlineUI()}</li>
      <li>{this.clueUI()}</li>
      <li>{this.stepUI()}</li>
      </ul>
      {this.priceUI()}
      {this.doitUI()}
      </div>);
  }

  render() {
    let imgUrl = "pix/card_backgrounds/jigsaw_puzzle_player.png";
    return (
      <div className='seer_component' current={this.props.current}>
        <div horiz='yes' style={{verticalAlign: 'top'}}>
          <span>The Seer can turn Clues into Knowledge...</span>
        <div className='card_face_border'>
          <div className="card_face_description_bg">
            <img src={imgUrl} width="250" alt="" />
          </div>
        </div>
        </div>
        <div horiz='yes'>
          {this.seerUI()}
        </div>
      </div>
    )
  }
}
export default SeerComponent;
