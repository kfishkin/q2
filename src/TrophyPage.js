import React from 'react';
import dayjs from 'dayjs';
var localizedFormat = require('dayjs/plugin/localizedFormat')
dayjs.extend(localizedFormat);

// props
// beGateway
// gameId
// playerId
class TrophyPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      trophies: [],
      awards: [],
      loading: true
    };
  }

  componentDidMount() {
    this.setState({loading: true});
    Promise.all([this.props.beGateway.getTrophies(),
    this.props.beGateway.getAwards(this.props.gameId, this.props.playerId)])
      .then((vs) => {
        this.setState({trophies: vs[0].sort((tr1, tr2) => tr2.level - tr1.level), // by level desc
          awards: vs[1]});
        this.setState({loading: false});
      }).catch((e) => {
        console.log(`getTrophies: error, ${e}`);
          this.setState({loading: false});
      });
  }

  showTrophy(trophy, awardsByWhich) {
    let attrs = {};
    let description = trophy.description;
    if (awardsByWhich[trophy.which]) {
      attrs = {'have': 'yes', 'which' : trophy.which };
      let award = awardsByWhich[trophy.which];
      let when = dayjs(award.when_granted).format("L"); // date, short
      description = `Awarded ${when} for ${award.message}`;
    }
    return (<div className='trophy' {...attrs}>
      <span>{description}</span>
    </div>);
  }

  showLevel(pile, awardsByWhich) {
    if (!pile) return <li></li>;
    let level = pile[0].level;
    return <li key={level}>
      <ul className='trophy_row'>
      <li key={`row_${level}_preamble`}><div className='trophy_row_level' level={level}>
        <span>Level </span><span level={pile[0].level}>{pile[0].level}</span><span> Trophies</span></div></li>
      {pile.map((trophy) => {
        return <li>{this.showTrophy(trophy, awardsByWhich)}</li>
      })}
      </ul>
    </li>;
  }

  render() {
    if (this.state.loading) {
      return <div>Sorry, the trophy data is being loaded, try again later.</div>
    }
    // the trophies are already sorted by level desc.
    // break that into piles.
    let piles = [];
    let pile = null;
    let lastLevel = -1;
    this.state.trophies.forEach((trophy) => {
      if (!trophy || !trophy.level) return;
      if (trophy.level === lastLevel) {
      } else {
        piles.push(pile);
        lastLevel = trophy.level;
        pile = [];
      }
      pile.push(trophy);
    });
    // don't forget the last one...
    if (pile.length > 0) {
      piles.push(pile);
    }
    // to make things just a little faster, turn the awards into a hash,
    // whose key is the 'which' of its trophy.
    let awardsByWhich = {};
    this.state.awards.forEach((award) => {
      awardsByWhich[award.trophy.which] = award;
    });

    const preamble = () => {
      <div><span><b>The Trophy Hall</b></span></div>
    }
    return (<div>
      {preamble()}
      <ul className='trophy_rows'>
        { piles.map((pile) => this.showLevel(pile, awardsByWhich))}
      </ul>
    </div>);
  }
}

export default TrophyPage;