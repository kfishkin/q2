import React from 'react';
import Card from './Card';
import { DeckComponentMerchant } from './DeckComponent';

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
class RetailPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      bankroll: UNKNOWN,
      inventory: [], // [Card]
      prices: {}, // card id --> price. In future, this will come from BE.
      cart: [], // [CartItem]
      loading: false,
      buying: false,
    }
  }

  componentDidMount() {
    let bankroll = 0;
    this.props.deck.filter((card) => card.getBase().isMoney()).forEach((moneyCard) => {
      bankroll += moneyCard.getBase().getSellValue();
    });

    let prices = {};
    Object.values(this.props.baseCards).forEach((baseCard) => {
      const MARKUP = 2.0;
      prices[baseCard.getId()] = baseCard.getSellValue() * MARKUP;
    });


    let inventory = [];
    this.setState({ bankroll, inventory, prices, loading: true });
    this.props.beGateway.getRetail(this.props.gameId).then((v) => {
      console.log(`got retail of ${JSON.stringify(v)}`);
      inventory = v.map((cardDb) => Card.Of(cardDb));
      inventory.forEach((card) => {
        let basePrice =  prices[card.getBase().getId()];
        let rawGearValue = 0;
        let wearFraction = 0.0; // 0 if un-worn, 1 if totally worn out.
        if (card.getBase().getRawWeaponValue() > 0) {
          rawGearValue = card.getBase().getRawWeaponValue();
          wearFraction = 1.0 - (card.getNetWeaponValue() / rawGearValue);
        } else if (card.getBase().getRawArmorValue() > 0) {
          rawGearValue = card.getBase().getRawArmorValue();
          wearFraction = 1.0 - (card.getNetArmorValue() / rawGearValue);
        }
        let price = basePrice;
        if (wearFraction > 0) {
          const MAX_DISCOUNT = 0.5; // discount when fully worn out.
          let discount = wearFraction * MAX_DISCOUNT;
          price = price * (1.0 - discount);
          console.log(`marking down ${card.terselyDescribe()} by ${discount} due to wear % of {rawFraction}`);
        }
        prices[card.getId()] = price;
      });
      this.setState({prices, inventory, loading: false});
    });

  }

  onStartBuy(cards) {
    //console.log(`wants to buy cards ${JSON.stringify(cards)}`);
    // just need the IDs to send over the wire.
    if (!cards) return;
    let cardIds = cards.map((card) => card._id);
    this.setState({ buying: true});
    this.props.beGateway.buy(this.props.gameId, this.props.playerId, cardIds)
      .then((v) => {
        this.props.onBought();
        this.setState({buying: false});
      });
  }

  buyUI() {

    if (this.state.loading) {
      let preamble = <span>You have $<b>{this.state.bankroll === UNKNOWN ? 'unknown' : this.state.bankroll}</b> to spend.</span>
      return <div>{preamble}<span> Loading inventory...</span></div>;
    }
    return <div><hr/><DeckComponentMerchant
      deck={this.state.inventory}
      baseCards={this.props.baseCards}
      current="yes"
      onTransact={(cards) => this.onStartBuy(cards)} />
      </div>
  }

  render() {
    if (this.state.loading) {
      return (<div>'Loading inventory...'</div>);
    } else if (this.state.buying) {
      return (<div>'Buying...'</div>);
    } else {
    return (<div>
              You have $<b>{this.state.bankroll === UNKNOWN ? 'unknown' : this.state.bankroll}</b> to spend.
            {this.buyUI()}
    </div>)
    }
  }
}

export default RetailPage;
