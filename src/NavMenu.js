import React from 'react';
import { Menu } from 'antd';

export const CONFIG_PAGE='config';
export const LOGIN_PAGE='login';
export const CRAFT_PAGE='craft';
export const FIGHT_PAGE = "fight";
export const GAME_ADMIN_PAGE='game admin';
export const GAME_PAGE="game";
export const HOME_PAGE='home';
export const MERCHANT_PAGE = "merchant";
export const LOOT_PAGE = "loot";
export const CASHIER_PAGE = "cashier";
export const WORKSHOP_PAGE = "workshop";
// props:
// pageTemplates - the page templates
// showPageFunc - func to invoke to show a new page

class NavMenu extends React.Component {
  render() {
    let menuItems = this.props.pageTemplates.map((template, i) => {
      return (<Menu.Item key={`menu_${i}`} onClick={(e) => this.props.showPageFunc(template.PageDescriptor())} disabled={template.IsEnabledNow()?"":"disabled"}>
        <span>{template.SideBarText()}</span>
      </Menu.Item>)
    })
    return (
<div><Menu theme="light" mode="inline">
{menuItems}
</Menu></div>
    );
  }
}

export default NavMenu;