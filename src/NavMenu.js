import React from 'react';
import { Menu } from 'antd';

export const CONFIG_PAGE='config';
export const LOGIN_PAGE='login';
export const FIGHT_PAGE = "fight";
export const GAME_ADMIN_PAGE='game admin';
export const GAME_PAGE="game";
export const HOME_PAGE='home';
export const MERCHANT_PAGE = "merchant";
export const TROPHY_PAGE = "trophy";
export const LOOT_PAGE = "loot";
export const CASHIER_PAGE = "cashier";
export const WORKSHOP_PAGE = "workshop";
// props:
// pageTemplates - the page templates


class NavMenu extends React.Component {
  render() {
    let menuItems = this.props.pageTemplates.map((template, i) => template.render());
    return (
<div><Menu theme="light" mode="inline">
{menuItems}
</Menu></div>
    );
  }
}

export default NavMenu;