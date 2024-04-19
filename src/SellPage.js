import React from 'react';
import { DeckComponent } from './DeckComponent';

/**
 * retail shopping, including used items.
 * 
 * props
 * baseCards - { id: BaseCard}
 * beGateway
 * deck - [Card]
 * gameId
 * onBought - f() call after buying
 * playerId
 */

const UNKNOWN = -1;
class SellPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      bankroll: UNKNOWN,
      inventory: [], // [Card]
      prices: {}, // card id --> price. In future, this will come from BE.
      selling: false,
    }
  }

  componentDidMount() {
    let bankroll = 0;
    this.props.deck.filter((card) => card.getBase().isMoney()).forEach((moneyCard) => {
      bankroll += moneyCard.getBase().getSellValue();
    });

    let prices = {};
    this.props.deck.forEach((card) => {
        let basePrice = card.getBase().getSellValue();
        // TODO: incorporate wear
        prices[card.getId()] = basePrice;
    });
    this.setState({bankroll, prices});
  }

  onStartSell(cards) {
    console.log(`wants to sell cards ${JSON.stringify(cards)}`);
    // just need the IDs to send over the wire.
    if (!cards) return;
    let cardIds = cards.map((card) => card._id);
    this.setState({ selling: true});
    this.props.beGateway.sell(this.props.gameId, this.props.playerId,cardIds)
      .then((v) => {
        console.log(`onStartSell: v = ${JSON.stringify(v)}`);
        if (!v.ok) {
          console.log(`fail in onStartSell`);
        }
        this.props.onSold();
        this.setState({selling: false});
      });
  }

  sellUI() {
    return <div><hr/>      <DeckComponent deck={this.props.deck} baseCards={this.props.baseCards} current="yes"
    onTransact={(cards) => this.onStartSell(cards)} />
      </div>
  }

  render() {
    if (this.state.selling) {
      return (<div>'Selling...'</div>);
    } else {
    return (<div>
            {this.sellUI()}
    </div>)
    }
  }
}

export default SellPage;
