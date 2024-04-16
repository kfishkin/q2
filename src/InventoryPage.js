import React from 'react';
import {DeckComponent} from './DeckComponent';

class InventoryPage extends React.Component {
  // props:
// deck
// baseCards

  render() {
    return (<div>
      <DeckComponent deck={this.props.deck} baseCards={this.props.baseCards} ronly={true}/>
    </div>);
  }
}
export default InventoryPage;
