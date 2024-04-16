import React from 'react';
import { NAV_ITEM_PAGES } from './NavMenuItemComponent';
import { PlayerStates } from './PlayerStates';

// props:
// beGateway
// gameId
// onFlee - f() to flee
// playerId
// playerName - String
// playerState - enum
// props.showPageFunc - f(page, extra) to jump to that page
// props.startAdventureFunc - f() to start adventuring.
// props.endAdventureFunc - f() to end adventuring.
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
    this.imgUrls[PlayerStates.FIGHT_START] = 'pix/general/prefight.jpg';
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
    return <span>You can ({this.props.playerState})</span>;
  }

  maybeStartAdventuring() {
    let ok = window.confirm('Are you sure you want to leave home? Anything in your backpack will be available, but at risk');
    if (ok) {
      this.props.startAdventureFunc();
    }
  }

  maybeEndAdventure() {
    let ok = window.confirm('Are you sure you want to go home? The dungeon will restock with harder foes');
    if (ok) {
      this.props.endAdventureFunc();
    }    
  }

  maybeFlee() {
    let ok = window.confirm('Are you sure you want to flee? You will lose ALL items in your backpack');
    if (ok) {
      this.props.onFlee();
    }    
  }

  buttonsUI() {
    // for backward compat, NB: remove this...
    let state = this.props.playerState;
    if (state === PlayerStates.UNKNOWN) {
      state = PlayerStates.HOME;
    }
    let newsText = (this.state.newsCount > 0) ?  (<span><span>News</span><span className='new_news'>({this.state.newsCount})</span></span>) :
    (<span disabled="disabled">News</span>);
    switch (state) {
      case PlayerStates.HOME:
        return [
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.LOGIN_PAGE)}>Logout</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
          <span>Shop Retail</span>,
          <span>Shop Wholesale</span>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.INVENTORY_PAGE)}>See your inventory</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.BACKPACK_PAGE)}>Pack your backpack</button>,
          <button onClick={(e) => this.maybeStartAdventuring()}>Go adventuring!</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.CASHIER_PAGE)}>See the Cashier</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.WORKSHOP_PAGE)}>Go to the Workshop</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.NEWS_PAGE)}>{newsText}</button>,
          <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.TROPHY_PAGE)}>View Trophies</button>
        ];
        case PlayerStates.AWAY:
          return [
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.LOGIN_PAGE)}>Logout</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.BACKPACK_PAGE)}>View your backpack</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.AWAY_PAGE)}>View the game board</button>,
            <button onClick={(e) => this.maybeEndAdventure()}>Go Home</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.NEWS_PAGE)}>{newsText}</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.TROPHY_PAGE)}>View Trophies</button>
          ]
        case PlayerStates.FIGHT_START:
          return [
            <button className='run_away_button' onClick={(e) => this.maybeFlee()}>FLEE</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.LOGIN_PAGE)}>Logout</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.BACKPACK_PAGE)}>View your backpack</button>,
            <button onClick={(e) => this.props.showPageFunc(NAV_ITEM_PAGES.FIGHT_START_PAGE)}>View the fight setup</button>,
            <button className='fight_button' title='no changes to gear once the fight starts'>Start the Fight</button>,
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
