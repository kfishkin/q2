import React from 'react';
import StatusMessage from './StatusMessage';

// lets users spend money to learn mundane lore.
// props:
// beGateway
// deck
// gameId
// onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()} -- tells FE the deck has changed.
// playerId
const NONE = -1;
class StudyPage extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
      lorePrices: [],
      bankroll: 0,
      studying: false,
      statusText: null,
      statusType: null,
    };
  }

  componentDidMount() {
    let bankroll = 0;
    this.props.deck.filter((card) => card.getBase().isMoney()).forEach((moneyCard) => {
      bankroll += moneyCard.getBase().getSellValue();
    });
    this.props.beGateway.getArtisanPrices(this.props.gameId)
      .then((v) => {
        console.log(`study: v = ${JSON.stringify(v)}`);
        this.setState({lorePrices: v.lore, bankroll: bankroll});

      }).catch((e) => {
        console.log(`study: e = ${JSON.stringify(e)}`);

      });

  }

  chooseLevelUI() {
    if (this.state.studying) {
      return <span>Studying...</span>;
    }
    const onLevelChoose = (option) => {
      console.log(`val = ${option}`);
      let index = option.target.value;
      let price = this.state.lorePrices[index];
      console.log(`index = ${index}, price = ${price}`);
      if (index === NONE) return;
      if (this.state.studying) return;
      this.setState({statusText: 'studying...', statusType: 'info', studying: true}, () => {
        this.props.beGateway.study(this.props.gameId, this.props.playerId, price).then((v) => {
          console.log(`study: v= ${JSON.stringify(v)}`);
          this.props.onPlayerDeckBEChange();
          this.setState({statusText: 'done!', statusType: 'success', studying: false});
        }).catch((e) => {
          console.log(`err: e = ${e}`);
          this.setState({statusText: `error! ${e}`, statusType: 'error', studying: false});
        })
      })

    }
    let bankroll = this.state.bankroll;
    let options = this.state.lorePrices.map((price, level) => {
      return <option value={level} disabled={price > bankroll}>learn {level + 1} lore for ${price}</option>
    });
    // add a 'pick one' header...
    options.unshift(<option value={NONE}>...pick a level of study...</option>);
    return  <select className='width200' onChange={(val) => onLevelChoose(val)}>{options}</select>;
  }

  studyUI() {
    return (<div>
      <span>The more you spend, the more lore you get, and there's a volume discount.
        <i>However,</i> there is no 'change back' when you use lore.
      </span>
      <span>You have <b>${this.state.bankroll}</b> to possibly spend. How many lore points do you wish to buy?</span>
      <hr/>
      {this.chooseLevelUI()}
      {this.state.statusText ? <StatusMessage message={this.state.statusText} type={this.state.statusType} /> : ''}
      </div>);
  }

  render() {
    let imgUrl = "pix/general/study.png";
    return (<div>
      <span>Here you can spend money to learn 'mundane' (aka 'generic') lore. This can
        then be spent to unlock recipes.
      </span>
      <table>
        <tbody>
          <tr>
            <td>
              <img src={imgUrl} />
            </td>
            <td>
              {this.studyUI()}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    )
  }
}
export default StudyPage;
