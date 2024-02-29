import React from 'react';
import { Menu } from 'antd';

// little bitty guy that just shows the side item on the nav menu.
// made a component so that the News one can regularly ping the BE
// and update its display accordingly. Sigh.
export const NAV_ITEM_PAGES = {
  LOGIN_PAGE: "Login",
  GAME_ADMIN_PAGE: "Game Admin",
  GAME_PAGE: "Game",
  WORKSHOP_PAGE: "Workshop",
  MERCHANT_PAGE: "Mall",
  CASHIER_PAGE: "Cashier",
  TROPHY_PAGE: "Trophies",
  NEWS_PAGE: "News",
  HOME_PAGE: "home"
}

// props:
// showPageFunc - func to invoke to show a new page
// fighting - am I presently in a fight.
// loggedIn - am I logged in.
// haveDeck - do I have a deck of cards.
// haveGame - do I have a current game.
class NavMenuItemComponent extends React.Component {
  isEnabledNow() {
    return this.props.haveGame && this.props.haveDeck && !this.props.fighting; // the default
  }

  pageDescriptor() {
    return "BOGUS"; // over-ride in subclasses.
  }
  sideBarText() {
    return "OVER_RIDE ME";
  }

  render() {
    // return a Menu.item with key, onClick, 'disabled' if disabled,
    // and then the text.

    return (<Menu.Item key={`menu_${this.pageDescriptor()}`} onClick={(e) => this.props.showPageFunc(this.pageDescriptor())} disabled={this.isEnabledNow() ? "" : "disabled"}>
      <span>{this.sideBarText()}</span>
    </Menu.Item>)
  }
}

export class NavMenuItemLogin extends NavMenuItemComponent {
  isEnabledNow() { return !this.props.fighting }
  pageDescriptor() { return NAV_ITEM_PAGES.LOGIN_PAGE }
  sideBarText() {
    return this.props.loggedIn ? "Logout" : "Login"
  }
}

export class NavMenuItemGameAdmin extends NavMenuItemComponent {
  isEnabledNow() { return this.props.loggedIn && !this.props.fighting }
  pageDescriptor() { return NAV_ITEM_PAGES.GAME_ADMIN_PAGE }
  sideBarText() {
    return "Game Admin"
  }
}

export class NavMenuItemGame extends NavMenuItemComponent {
  isEnabledNow() { return this.props.loggedIn && this.props.haveGame && !this.props.fighting }
  pageDescriptor() { return NAV_ITEM_PAGES.GAME_PAGE }
  sideBarText() {
    return "Game"
  }
}

export class NavMenuItemWorkshop extends NavMenuItemComponent {
  pageDescriptor() { return NAV_ITEM_PAGES.WORKSHOP_PAGE }
  sideBarText() {
    return "Workshop"
  }
}

export class NavMenuItemMerchant extends NavMenuItemComponent {
  pageDescriptor() { return NAV_ITEM_PAGES.MERCHANT_PAGE }
  sideBarText() {
    return "Mall"
  }
}

export class NavMenuItemCashier extends NavMenuItemComponent {
  pageDescriptor() { return NAV_ITEM_PAGES.CASHIER_PAGE }
  sideBarText() {
    return "Cashier"
  }
}

export class NavMenuItemTrophies extends NavMenuItemComponent {
  pageDescriptor() { return NAV_ITEM_PAGES.TROPHY_PAGE }
  sideBarText() {
    return "Trophies"
  }
}

// I take more props so that I can talk to the BE:
// beGateway
// gameId,
// playerId
export class NavMenuItemNews extends NavMenuItemComponent {
  constructor(props) {
    super(props);
    console.log(`newsItem: prop keys = ${Object.keys(this.props).join()}`);
    this.intervalId = 0;
    this.state = {
      newsCount: 0,
      pinging: false,
    }
  }
  pageDescriptor() { return NAV_ITEM_PAGES.NEWS_PAGE }
  sideBarText() {
    if (this.state.newsCount === 0) {
      return (<span disabled="disabled">News</span>);
    } else {
      return (<span><span>News</span><span className='new_news'>({this.state.newsCount})</span></span>)
    }
  }

  newsPinger() {
    if (this.props.gameId && this.props.playerId && this.props.beGateway && !this.state.pinging) {
      this.setState({pinging: true});
      this.props.beGateway.getNewsCount(this.props.gameId, this.props.playerId)
        .then((v) => {
          this.setState({pinging: false, newsCount: parseInt(v)});
        }).catch((e) => {
          console.log(`e = ${e}`);
          this.setState({pinging: false});          
        });
    }
  }

  componentDidMount() {
    // need the bind so 'this' in newsPinger isn't the window...
    this.intervalId = window.setInterval(this.newsPinger.bind(this), 30000); // every 30 sec.
    console.log(`news cdm: intervalid = ${this.intervalId}`);
  }

  componentWillUnmount() {
    window.clearInterval(this.intervalId);
  }

}
