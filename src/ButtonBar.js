import React from 'react';
import { APP_PAGES } from './config/AppPages';
import { PlayerStates } from './types/PlayerStates';

// props:
// beGateway
// gameId
// onFlee - f() to flee
// playerId
// playerName - String
// playerState - enum
// props.onStartFighting - f() to start the fight going.
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

  onStartFight() {
    this.props.onStartFighting();
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
      // (key) fields are to shut up Chrome inspector.
      case PlayerStates.DEAD:
        return [
          <button key="dLogin" onClick={(e) => this.props.showPageFunc(APP_PAGES.LOGIN_PAGE)}>Logout</button>,
          <button  key="dAdmin" onClick={(e) => this.props.showPageFunc(APP_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
          <button  key="dInv"onClick={(e) => this.props.showPageFunc(APP_PAGES.INVENTORY_PAGE)}>See your inventory</button>,
          <button key="dNews" onClick={(e) => this.props.showPageFunc(APP_PAGES.NEWS_PAGE)}>{newsText}</button>,
          <button key="dTrophy" onClick={(e) => this.props.showPageFunc(APP_PAGES.TROPHY_PAGE)}>View Trophies</button>
        ];      
      case PlayerStates.HOME:
        return [
          <button key="hLOGIN" onClick={(e) => this.props.showPageFunc(APP_PAGES.LOGIN_PAGE)}>Logout</button>,
          <button key="hADMIN" onClick={(e) => this.props.showPageFunc(APP_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
          <button key="hINV" onClick={(e) => this.props.showPageFunc(APP_PAGES.INVENTORY_PAGE)}>See your inventory</button>,
          <button key="hPack" onClick={(e) => this.props.showPageFunc(APP_PAGES.BACKPACK_PAGE)}>Pack your backpack</button>,
          <button key="hAway" onClick={(e) => this.maybeStartAdventuring()}>Go adventuring!</button>,
          <button key="hBuy" onClick={(e) => this.props.showPageFunc(APP_PAGES.COSTCO_PAGE)}>Buy wholesale</button>,
          <button key="hRetail" onClick={(e) => this.props.showPageFunc(APP_PAGES.RETAIL_PAGE)}>Buy retail</button>,
          <button key="hSell" onClick={(e) => this.props.showPageFunc(APP_PAGES.SELL_PAGE)}>Sell retail</button>,
          <button key="hCash" onClick={(e) => this.props.showPageFunc(APP_PAGES.CASHIER_PAGE)}>See the Cashier</button>,
          <button key="hWork" onClick={(e) => this.props.showPageFunc(APP_PAGES.WORKSHOP_PAGE)}>Go to the Workshop</button>,
          <button key="hBlack" onClick={(e) => this.props.showPageFunc(APP_PAGES.REPAIR_PAGE)}>Go to the Blacksmith</button>,
          <button key="hStudy" onClick={(e) => this.props.showPageFunc(APP_PAGES.STUDY_PAGE)}>Study lore</button>,
          <button key="hDistill" onClick={(e) => this.props.showPageFunc(APP_PAGES.DISTILL_PAGE)}>Dissassemble stuff</button>,
          <button key="hSee" onClick={(e) => this.props.showPageFunc(APP_PAGES.SEER_PAGE)}>Go to the Seer</button>,
          <button key="hNews" onClick={(e) => this.props.showPageFunc(APP_PAGES.NEWS_PAGE)}>{newsText}</button>,
          <button key="hTroph" onClick={(e) => this.props.showPageFunc(APP_PAGES.TROPHY_PAGE)}>View Trophies</button>
        ];
        case PlayerStates.AWAY:
          return [
            <button key="aLog" onClick={(e) => this.props.showPageFunc(APP_PAGES.LOGIN_PAGE)}>Logout</button>,
            <button key="aAdm" onClick={(e) => this.props.showPageFunc(APP_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
            <button key="aView" onClick={(e) => this.props.showPageFunc(APP_PAGES.BACKPACK_PAGE)}>View your backpack</button>,
            <button key="aBoard" onClick={(e) => this.props.showPageFunc(APP_PAGES.AWAY_PAGE)}>View the game board</button>,
            <button key="aHome" onClick={(e) => this.maybeEndAdventure()}>Go Home</button>,
            <button key="aNews" onClick={(e) => this.props.showPageFunc(APP_PAGES.NEWS_PAGE)}>{newsText}</button>,
            <button key="aTroph" onClick={(e) => this.props.showPageFunc(APP_PAGES.TROPHY_PAGE)}>View Trophies</button>
          ]
        case PlayerStates.FIGHT_START:
          return [
            <button key="fsFlee" className='run_away_button' onClick={(e) => this.maybeFlee()}>FLEE</button>,
            <button key="fsLog" onClick={(e) => this.props.showPageFunc(APP_PAGES.LOGIN_PAGE)}>Logout</button>,
            <button key="fsAdmin" onClick={(e) => this.props.showPageFunc(APP_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
            <button key="fsBack" onClick={(e) => this.props.showPageFunc(APP_PAGES.BACKPACK_PAGE)}>View your backpack</button>,
            <button key="fsSetup" onClick={(e) => this.props.showPageFunc(APP_PAGES.FIGHT_START_PAGE)}>View the fight setup</button>,
            <button key="fsDo" onClick={(e) => this.onStartFight()} className='fight_button' title='no changes to gear once the fight starts'>Start the Fight</button>,
          ];
          case PlayerStates.FIGHTING:
            return [
              <button key="FiFlee" className='run_away_button' onClick={(e) => this.maybeFlee()}>FLEE</button>,
              <button key="FiLog" onClick={(e) => this.props.showPageFunc(APP_PAGES.LOGIN_PAGE)}>Logout</button>,
              <button key="FiAdmin" onClick={(e) => this.props.showPageFunc(APP_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
              <button key="FiBack" onClick={(e) => this.props.showPageFunc(APP_PAGES.BACKPACK_PAGE)}>View your backpack</button>,
              <button key="FiFigh" onClick={(e) => this.props.showPageFunc(APP_PAGES.FIGHT_PAGE)}>Return to the fight</button>,
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
