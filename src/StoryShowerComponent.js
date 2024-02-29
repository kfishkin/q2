import React from 'react';
import { Menu } from 'antd';
import CardDetail from './CardDetail';

// shows a single story.

import Card from './Card';

// TODO: sync this with the BE version.
const Trophies = {
  NONE: 0,
  KILL_1: 1,
  KILL_2: 2,
  KILL_3: 3,
  KILL_4: 4,
  KILL_5: 5,
  KILL_6: 6,
  KILL_7: 7,
  RECIPE_USE: 8,
  PURCHASE: 9,
  SALE: 10,
  RECIPE_DISCOVERY: 11,
  WIN_NO_FIGHT: 12,
  WIN_NO_CRAFT: 13,
  KILL_EACH: 14,
  WIN_FIGHT: 15,
  WIN_CRAFT: 16,
  DIED_1: 17,
  DIED_2: 18,
  DIED_3: 19,
  DIED_4: 20,
  DIED_5: 21,
  DIED_6: 22,
  DIED_7: 23,
};

const StoryTypes = {
  NONE: 0,
  DEBUG: 1,
  AWARD: 2
};

// done this way so can sync with FE in one config file someday
const StoryParts = {
  WHY: 'why',
  DEBUG: 'test',
  MERCHANDISE: 'merch',
  WHICH: 'which',
};



// props:
// story - what to show.
// beGateway - so can ping BE. 
// subclasses have more.
export class StoryShowerComponent extends React.Component {
  static Of(props) {
    let type = props.story.type;
    switch (type) {
      case StoryTypes.AWARD:
        return new StoryShowerAward(props);
      default:
        return new StoryShowerComponent(props);
    }
  }
 
  render() {
    if (!this.props.story) return "";
    return <span>{JSON.stringify(this.props.story)}</span>
  }
}

// also needs playerId, gameId in props.
export class StoryShowerAward extends StoryShowerComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      prizeCard: null
    }
  }
  componentDidMount() {
    //console.log(`award shower: mounted`);
    //console.log(`cdm: story = ${JSON.stringify(this.props.story)}`);
    let cards = this.props.story.cards;
    console.log(`cards = ${JSON.stringify(cards)}`);
    console.log(`playerId = ${this.props.playerId}, gameId = ${this.props.gameId}`);
    if (cards && (cards.length > 0) && !this.state.loading) {
      // NB: for now assume 1 prize card, doesn't load bunches.
      let cardId = cards[0];
      console.log(`looking up prize card ${cardId}`);
      this.setState({loading: true});
      this.props.beGateway.getCard(cardId).then((v) => {
        //console.log(`got card ${JSON.stringify(v)}`);
        this.setState({loading: false, prizeCard: v});
        this.forceUpdate();
      }).catch((e) => {
        console.log(`e: ${e}`);
        this.setState({loading: false, prizeCard: null});
      })
    }
  }

  componentWillUnmount() {
    this.setState({prizeCard: null});
  }

  render() {
    if (!this.props.story) return "";
    let story = this.props.story;
    let which = story.textParts.which; // TODO sync this with BE
    let why = story.textParts.why;
    let line1 = <span>You won the award for <i><b>{why}</b></i>. </span>;
    let line2 = "";
    if (story.cards && story.cards.length > 0) {
      if (this.state.loading) {
        line2 = <span>It came with a reward card! Looking it up...</span>
      } else if (!this.state.prizeCard) {
        line2 = <span>It came with a reward card! Check your inventory...</span>
      } else {
        let prizeCard = Card.Of(this.state.prizeCard);
        line2 = <div><span>It came with a reward card, a <i>{prizeCard.TerselyDescribe()}</i> card.</span>
        <CardDetail card={prizeCard} baseCards={this.props.baseCards} />
        </div>
      }
    }
    return <div>
      <div className='news_half'>
        <img src='pix/general/blue_ribbon_yes.png' width="300px"/>
      </div>
      <div className="news_half">
        {line1}
        {line2}
      </div>
    </div>
  }

}