import React from 'react';
import { Menu } from 'antd';


// props:
// handleShowPage(string) ask app to display the given page

class NavMenu extends React.Component {

  DumpIngredients() {
    return <p>Dumping Ingredients</p>
  }
  render() {
    return (
<div><Menu theme="light" mode="inline">
<Menu.Item onClick={() => this.props.handleShowPage('guess')}><span>Guess at a recipe</span></Menu.Item>    
<Menu.Item onClick={() => this.props.handleShowPage('dump recipes')}><span>dump recipes</span></Menu.Item>
<Menu.Item onClick={() => this.props.handleShowPage('dump ingredients')}><span>dump ingredients</span></Menu.Item>
<Menu.Item onClick={() => this.props.handleShowPage('dump preps')}><span>dump preparations</span></Menu.Item>
<Menu.Item onClick={() => this.props.handleShowPage('dump step configs')}><span>dump step configs</span></Menu.Item>
</Menu><p>Below the Menu</p></div>
    );
  }
}

export default NavMenu;