import React from 'react';
import { Modal } from 'antd';
import CardDetail from './CardDetail';

// a modal that shows 0 or more cards with simple navigation, in a modal.
// not made a subclass of Modal because I may want to tweak/specialize,
// but yeah you could.
// props: 
//  cards - the card to show.
// title - title
//  topHtml - html to show above.
//  bottomHtml - html to show below.
// onOk, onCancel - callbacks
// open - should I be open?
// baseCards - needed for description
class CardsModal extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
      cardIndex: 0
    };
  }

  componentDidMount() {
    console.log(`modal did mount: topHtml = [${this.props.topHtml}]`);
  }

  render() {
    let card = this.props.cards[this.state.cardIndex];
    console.log(`modal render: topHtml = [${this.props.topHtml}]`);

    const renderNavigation = () => {
      if (!this.props.cards || this.props.cards.length < 2) return "";
      let parts = [];
      const succ = (e) => {
        if (this.state.cardIndex + 1 < this.props.cards.length)
        this.setState({cardIndex: this.state.cardIndex + 1});
      }
      const pred = (e) => {
        if (this.state.cardIndex - 1 >= 0)
          this.setState({cardIndex: this.state.cardIndex - 1});
      }

      // bug or feature, it appears (cardIndex) stays sticky across different invocations
      // of the dialog, even if # of cards changes. So...
      let index = Math.min(this.state.cardIndex, this.props.cards.length - 1);

      if (true || index > 0) { // looks weird if the arrows appear/vanish
        parts.push(<img className="nav_arrow" onClick={pred} src="pix/icons/left_arrow.png" width="64" alt="<-"></img>);
      }
      parts.push(` .. card ${index + 1} of ${this.props.cards.length}`);
      if (true || index + 1 < this.props.cards.length) {
        parts.push(<img className="nav_arrow" onClick={succ} src="pix/icons/right_arrow.png" width="64" alt="->"></img>);
      }
      return parts;
    }

    return (<Modal className="cards_modal" open={this.props.open} title={this.props.title} onOk={this.props.onOk} onCancel={this.props.onCancel}>
      {this.props.topHtml}
       <CardDetail card={card} baseCards={this.props.baseCards} />
       {this.props.bottomHtml}
       {renderNavigation()}
  </Modal>)
  }
}
export default CardsModal;
