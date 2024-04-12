import React from 'react';
import { NAV_ITEM_PAGES } from './NavMenuItemComponent';
import { PlayerStates } from './PlayerStates';

// props:
// beGateway
// gameId
// playerId
// playerName - String
// playerState - enum
// props.showPageFunc - f(page, extra) to jump to that page
class ButtonBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pinging: false,
      newsCount: 0
    };
    // can't find a nicer OO way to do this in react without a lot of hair,
    // because each needs to be its own component.
    this.imgUrls = {};
    this.imgUrls[PlayerStates.AWAY] = 'pix/general/away.png';
    this.imgUrls[PlayerStates.DEAD] = 'pix/general/dead.png';
    this.imgUrls[PlayerStates.FIGHTING] = 'pix/general/fighting.png';
    this.imgUrls[PlayerStates.HOME] = 'pix/general/home.png';
    this.imgTitles = {};
    this.imgTitles[PlayerStates.AWAY] = 'away';
    this.imgTitles[PlayerStates.DEAD] = 'dead';
    this.imgTitles[PlayerStates.FIGHTING] = 'fighting';
    this.imgTitles[PlayerStates.HOME] = 'home';

  }

  newsPinger() {
    if (this.props.gameId && this.props.playerId && this.props.beGateway && !this.state.pinging) {
      this.setState({ pinging: true });
      this.props.beGateway.getNewsCount(this.props.gameId, this.props.playerId)
        .then((v) => {
          console.log(`newsCount now ${v}`);
          this.setState({ pinging: false, newsCount: parseInt(v) });
        }).catch((e) => {
          console.log(`e = ${e}`);
          this.setState({ pinging: false });
        });
    }
  }

  componentDidMount() {
    // need the bind so 'this' in newsPinger isn't the window...
    this.intervalId = window.setInterval(this.newsPinger.bind(this), 10000); // every 10 sec.
    //console.log(`news cdm: intervalid = ${this.intervalId}`);
  }

  componentWillUnmount() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }

  imageUI() {
    let imgUrl = this.imgUrls[this.props.playerState];
    let title = this.imgTitles[this.props.playerState];
    return imgUrl ? <img src={imgUrl} width="64" alt={title} title={title} /> : '';
  }

  textUI() {
    return <span>You can </span>;
  }

  buttonsUI() {
    switch (this.props.playerState) {
      case PlayerStates.HOME:
        let newsText = (this.state.newsCount > 0) ?  (<span><span>News</span><span className='new_news'>({this.state.newsCount})</span></span>) :
        (<span disabled="disabled">News</span>);
        return [
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.LOGIN_PAGE)}>Logout</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
          <span>Shop Retail</span>,
          <span>Shop Wholesale</span>,
          <span>Pack your backpack</span>,
          <span>Go adventuring with your backpack</span>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.CASHIER_PAGE)}>See the Cashier</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.WORKSHOP_PAGE)}>Go to the Workshop</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.NEWS_PAGE)}>{newsText}</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.TROPHY_PAGE)}>View Trophies</button>
        ];
      default:
        return '';
    }
  }

  render() {
    // can't find a clean OO way to do this in React...
    return <div className='button_bar'>
      <div className='button_bar_image'>
        {this.imageUI()}
      </div>
      <div className='button_bar_buttons_and_text'>
        {this.textUI()}
        <br />
        {this.buttonsUI()}
      </div>
    </div>
  }
}

export default ButtonBar;
