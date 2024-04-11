import React from 'react';
import { NAV_ITEM_PAGES } from './NavMenuItemComponent';
import { PlayerStates } from './PlayerStates';

// props:
// playerName - String
// playerState - enum
// loggedIn - am I logged in.
// haveDeck - do I have a deck of cards.
// haveGame - do I have a current game.
// showPageFunc - f(page, extra) to jump to that page
class ButtonBar extends React.Component {
  isEnabledNow() {
    return this.props.haveGame && this.props.haveDeck && !this.props.fighting && !this.props.isDead; // the default
  }

  pageDescriptor() {
    return "BOGUS"; // over-ride in subclasses.
  }
  sideBarText() {
    return "OVER_RIDE ME";
  }

  static Of(state, props) {
    switch (state) {
      /*
      case PlayerStates.AWAY: return new ButtonBarFillerAway();
      case PlayerStates.DEAD: return new ButtonBarFillerDead();
      case PlayerStates.FIGHTING: return new ButtonBarFillerFighting();
      
      case PlayerStates.UNKNOWN:
        */
      case PlayerStates.HOME: return new ButtonBarFillerHome(props.playerName, props.showPageFunc);
        default:
          return new ButtonBarFillerUnknown(props.playerName);
    }
  }


  render() {
    // can't find an OO way to do this in React...
    let buttonBarFiller = ButtonBar.Of(this.props.playerState, this.props);
    return <div className='button_bar'>
      <div className='button_bar_image'>
      {buttonBarFiller.imageUI()}
      </div>
      <div className='button_bar_buttons_and_text'>
        {buttonBarFiller.textUI()}
        <br/>
        {buttonBarFiller.buttonsUI()}
      </div>
    </div>
  }
}

class ButtonBarFillerHome {
  constructor(playerName, showPageFunc) {
    this.playerName = playerName;
    this.showPageFunc = showPageFunc;
  }

  imageUI() {
    let imgUrl = "pix/general/home.png";
    return (
            <img src={imgUrl} width="64" alt="home" title='home' />
    )
  }

  textUI() {
    return 'You are at home. From here you can: ';
  }
  buttonsUI() {
    return [
      <button onClick={(e) => this.showPageFunc(NAV_ITEM_PAGES.LOGIN_PAGE)}>Logout</button>,
      <button onClick={(e) => this.showPageFunc(NAV_ITEM_PAGES.GAME_ADMIN_PAGE)}>Administer Games</button>,
      <span>Shop Retail</span>,
      <span>Shop Wholesale</span>,
      <button onClick={(e) => this.showPageFunc(NAV_ITEM_PAGES.CASHIER_PAGE)}>See the Cashier</button>,
      <button onClick={(e) => this.showPageFunc(NAV_ITEM_PAGES.WORKSHOP_PAGE)}>Go to the Workshop</button>,
      <button onClick={(e) => this.showPageFunc(NAV_ITEM_PAGES.NEWS_PAGE)}>Look at news</button>,
      <button onClick={(e) => this.showPageFunc(NAV_ITEM_PAGES.TROPHY_PAGE)}>View Trophies</button>
    ];
  }  
}

class ButtonBarFillerUnknown {
  constructor(playerName) {
    this.playerName = playerName;
  }

  imageUI() {
    return "imageUI";
  }
  textUI() {
    return this.playerName ? `Welcome, ${this.playerName}` : '';
  }
  buttonsUI() {
    return "buttonsUI";
  }
}

export default ButtonBar;
