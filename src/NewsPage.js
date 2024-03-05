import React from 'react';
import StatusMessage from './StatusMessage';
import dayjs from 'dayjs';
import { StoryShowerAward, StoryShowerBroadcast, StoryShowerComponent } from './StoryShowerComponent';

var localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat);


// props
// beGateway
// gameId
// playerId
// baseCards
class NewsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statusMessage: "",
      statusType: "info",
      loading: false,
      stories: [],
      selectedStory: null,
      acking: false
    };
  }

  loadNews() {
    console.log(`news page: asking for the news...`);
    let gameId = this.props.gameId;
    let playerId = this.props.playerId;
    if (!gameId || !playerId) return;
    this.setState({ loading: true, statusType: 'info', statusMessage: 'loading the news stories...' });
    this.props.beGateway.getNews(gameId, playerId).then((v) => {
      //console.log(`v = ${JSON.stringify(v)}`);
      this.setState({
        loading: false, statusType: 'success', statusMessage: 'loaded the news',
        stories: v
      });
    }).catch((e) => {
      this.setState({
        loading: false, statusType: 'error',
        statusMessage: `Error ${e.name}:${e.message} ${e.stack}`
      });
    })
  }

  componentDidMount() {
    this.loadNews();
  }

  showStory() {
    // TODO: sync this with BE.
    const StoryTypes = {
      NONE: 0,
      DEBUG: 1,
      AWARD: 2,
      BROADCAST: 3
    };
    if (!this.state.selectedStory) return "";

    let props = {
      story: this.state.selectedStory, beGateway: this.props.beGateway,
      gameId: this.props.gameId, playerId: this.props.playerId,
      baseCards: this.props.baseCards
    };
    let type = this.state.selectedStory.type;
    // if I was smarter I could call .Of() here, but I couldn't get that
    // to quite work lifecycle-wise.
    switch (type) {
      case StoryTypes.AWARD:
        return <div><StoryShowerAward {...props} /></div>;
      case StoryTypes.BROADCAST:
        return <div><StoryShowerBroadcast {...props} /></div>
      default:
        return <div><StoryShowerComponent {...props} /></div>;
    }
  }

  storyButtonUI() {
    let stories = this.state.stories;
    if (stories.length === 0) {
      return "";
    }
    // sort them, oldest on top. For speed, stuff an extra key in there,
    // the date of the message in millis since the epoch.
    stories.forEach((story) => {
      //console.log(`when_made = ${story.when_made}`);
      let asDayJs = dayjs(story.when_made);
      let asMillis = asDayJs.valueOf();
      //console.log(`asMillis = ${asMillis}`);
      story.asMillis = asMillis;
      story.asDayJs = asDayJs;
    });
    // now sort by asMillis asc.
    stories.sort((s1, s2) => s1.asMillis - s2.asMillis);
    let message = (stories.length === 1) ? 'Click on the story to read it'
      : 'Click on the story you wish to read';

    const onPickStory = (id) => {
      let story = stories.find((story) => story._id === id);
      if (story) {
        this.setState({ selectedStory: story });
      } else {
        console.log(`couldn't find story w/id ${id}??`);
      }
    }
    return <div style={{ paddingBottom: '2em' }}>
      <span>{message}</span>
      <br />
      {
        stories.map((story) => {
          return <button className='news_button' onClick={(e) => onPickStory(story._id)}>
            from: {story.asDayJs.format('LLL')} subject: {story.subject}
          </button>
        })
      }
    </div>
  }

  showDoneUI() {
    let disabled = !this.state.selectedStory;
    const onDoneWithStory = () => {
      console.log(`onDoneWithStory: called`);
      if (!this.state.selectedStory || this.state.acking) return;
      // ask the BE to zap it.
      this.setState({ acking: true, statusMessage: 'marking story as read...', statusType: 'info' });
      this.props.beGateway.ackStory(this.props.gameId, this.props.playerId, this.state.selectedStory._id).then((v) => {
        console.log(`FE: ack is acked`);
        this.setState({ acking: false, statusMessage: 'story read.', statusType: 'info' });
        // doesn't re-ping the BE, don't know why.
        // try this...
        this.loadNews();
      }).catch((e) => {
        console.log(e.stack);
        this.setState({ acking: false, statusMessage: `error: ${e.name}:${e.message}`, statusType: 'error' })
      })
    };

    return (<button onClick={(e) => onDoneWithStory()} disabled={disabled}>
      Click here when you are done with the story.
    </button>);
  }

  render() {
    if (this.state.loading) {
      return <div>Currently loading the news...</div>
    }
    if (this.state.stories.length === 0) {
      return <div>No new news at present...</div>
    }

    const preamble = () => {
      return <div><h2>Read all about it!</h2>
        Click on the button describing the story you want to see.
        The stories are listed <i>oldest</i> at the top.
        Once you've read a story, hit 'ok' and then the story will go away.
        It can't be viewed later - this ain't gmail.
      </div>
    }
    return (<div><h1>Hello from the News page</h1>
      {preamble}
      {this.storyButtonUI()}
      <div>
        {this.showStory()}
      </div>
      <div>
        {this.showDoneUI()}
      </div>
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
    </div>
    )
  }
}

export default NewsPage;