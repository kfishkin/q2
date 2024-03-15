import React from 'react';
import CardDetail from './CardDetail';
import parse from 'html-react-parser';

// shows a single story.

import Card from './Card';

// TODO: sync this with the BE version.
const StoryTypes = {
  NONE: 0,
  DEBUG: 1,
  AWARD: 2,
  GOODY: 3
};
const StoryParts = {
  WHY: 'why',
  DEBUG: 'test',
  MERCHANDISE: 'merch',
  WHICH: 'which',
  BROADCAST_HTML: 'bhtml'
}

// props:
// story - what to show.
// beGateway - so can ping BE. 
// baseCards
// subclasses have more.
export class StoryShowerComponent extends React.Component {
  static Of(props) {
    let type = props.story.type;
    switch (type) {
      case StoryTypes.AWARD:
        return new StoryShowerAward(props);
      case StoryTypes.GOODY:
        return new StoryShowerGoody(props);
      default:
        return new StoryShowerComponent(props);
    }
  }

  render() {
    if (!this.props.story) return "";
    return <span>{JSON.stringify(this.props.story)}</span>
  }
}

export class StoryShowerBroadcast extends StoryShowerComponent {
  render() {
    let story = this.props.story;
    if (!story) return <span>? no story ?</span>;
    // story.subject - subject.
    // story.textparts.bhtml - the html to show.
    let p = parse(story.textParts[StoryParts.BROADCAST_HTML]);
    return <div>{p}</div>;
    // return <div dangerouslySetInnerHTML={{ __html: story.textParts.html }} />
    //return <div dangerouslySetInnerHTML={{ __html: "<h1>Hi there!</h1>" }} />
  }
}

export class StoryShowerGoody extends StoryShowerComponent {
  render() {
    let story = this.props.story;
    let why = story.textParts[StoryParts.WHY];
    let merch = story.textParts[StoryParts.MERCHANDISE];
    return <div>For {why}, you earned {merch}</div>
  }
}

// also needs playerId, gameId in props.
export class StoryShowerAward extends StoryShowerComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      prizeBaseCard: null
    }
  }
  componentDidMount() {
    //console.log(`award shower: mounted`);
    //console.log(`cdm: story = ${JSON.stringify(this.props.story)}`);
    let base_card_ids = this.props.story.base_card_ids;
    console.log(`playerId = ${this.props.playerId}, gameId = ${this.props.gameId}`);
    if (base_card_ids && (base_card_ids.length > 0)) {
        // NB: for now assume 1 prize card, doesn't load bunches.
        let baseCardId = base_card_ids[0];
        console.log(`looking up prize card ${baseCardId}`);
        let prizeBaseCard = this.props.baseCards.find((bc) => bc.getId() === baseCardId);
          this.setState({ prizeBaseCard: prizeBaseCard });
          this.forceUpdate();
    } else {
      this.setState({ prizeBaseCard: null });
    }
  }

  componentWillUnmount() {
    this.setState({ prizeBaseCard: null });
  }

  render() {
    if (!this.props.story) return "";
    let story = this.props.story;
    let why = story.textParts.why;
    let line1 = <span>You won the award for <i><b>{why}</b></i>. </span>;
    let line2 = "";
    if (story.base_cards && story.base_card_ids.length > 0) {
      let baseId = story.base_card_ids[0];
      let storyBaseCard = this.props.baseCards.find((bc) => bc.getId() === baseId);
      if (!storyBaseCard) {
        // couldn't find it.
        console.log(`couldn't find prize base card w/id ${story.base_card_ids[0]}`);
        line2 = <span>It came with a reward card!</span>
      } else {
        let fakeCard = Card.Of({ game_card: storyBaseCard.getDb() });
        line2 = <div><span>It came with a reward card, a <i>{storyBaseCard.getDisplayName()}</i> card.</span>
          <CardDetail card={fakeCard} baseCards={this.props.baseCards} />
        </div>
      }
    }
    return <div>
      <div className='news_half'>
        <img src='pix/general/blue_ribbon_yes.png' alt="" width="300px" />
      </div>
      <div className="news_half">
        {line1}
        {line2}
      </div>
    </div>
  }

}