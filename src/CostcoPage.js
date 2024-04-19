import React from 'react';
import { InputNumber } from 'antd';
import { APP_PAGES } from './config/AppPages';

/**
 * lets user bulk-buy ingredients.
 * 
 * props
 * baseCards - { id: BaseCard}
 * beGateway
 * deck - [Card]
 * gameId
 * onPlayerDeckBEChange
 * playerId
 */
const UNKNOWN = -1;

class CartItem {
  // if baseCard === null, user hasn't selected (what) yet.
  constructor(amount, baseCard) {
    this.what = baseCard;
    this.amount = amount;
  } 
}

class CostcoPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bankroll: UNKNOWN,
      inventory: [], // [BaseCard]
      prices: {}, // id --> price. In future, this will come from BE.
      cart: [], // [CartItem]
      buying: false,
    }
  }

  componentDidMount() {
    let bankroll = 0;
    this.props.deck.filter((card) => card.getBase().isMoney()).forEach((moneyCard) => {
      bankroll += moneyCard.getBase().getSellValue();
    });

    let inventory = Object.values(this.props.baseCards).filter((baseCard) => baseCard.isBulkBuyable());
    inventory.sort((bc1, bc2) => bc1.getDisplayName().localeCompare(bc2.getDisplayName()));
    // in future, prices will come from BE.
    let prices = {};
    inventory.forEach((baseCard) => {
      const MARKUP = 2.0;
      prices[baseCard.getId()] = baseCard.getSellValue() * MARKUP;
    });
    let cart = [ new CartItem(0, null)];

    this.setState({ bankroll, inventory, prices, cart });
  }

  startBuy() {
    if (this.state.buying) return;
    this.setState({buying: true}, () => {
      // now that the flag is set, ask the BE to do its thing
      console.log(`buying from BE`);
      let baseCardIds = [];
      let amounts = [];
      this.state.cart.forEach((cartItem) => {
        if (!cartItem.what) return;
        baseCardIds.push(cartItem.what.getId());
        amounts.push(cartItem.amount);
      });
      console.log(`baseIds = ${JSON.stringify(baseCardIds)}, amts = ${JSON.stringify(amounts)}`);
      this.props.beGateway.buyBulkCondensed(this.props.gameId, this.props.playerId, baseCardIds, amounts).then((v) => {
        console.log(`Costco.startBuy: back, v = ${JSON.stringify(v)}`);
        // reset the cart. Could stay 'sticky', but worried about multiple false buys.
        this.props.onPlayerDeckBEChange().then(() => {
          let cart = [ new CartItem(0, null)];
          this.setState({buying: false, cart: cart});
          // weirdly, this isn't causing change to this.props.deck or a repaint.
          // so at least take 'em to another page.
          this.props.showPageFunc(APP_PAGES.INVENTORY_PAGE, {});

        });

      }).catch((e) => {
        console.log(`startBuy: e = ${e}`);
        this.setState({buying: false});
      })
    });
  }

  cartItemUI(cartItem) {
    const onAmountChange = ((v) => {
      console.log(`v = ${v}`);
      let cart = this.state.cart;
      cartItem.amount = Math.floor(v); // changes (cart), part of it.
      this.setState({cart});

    });

    const cartItemIngredUI = () => {
      const NONE = 0;
      const onIngredientChoice = ((val) => {
        let id = val.target.value;
        let what = null;
        if (id !== NONE) {
          // find the inventory w/this id. can't figure out how to stuff this directly into the option.
          what = this.state.inventory.find((baseCard) => baseCard.getId() === id);
        }
        let cart = this.state.cart;
        cartItem.what = what;
        // always have at least one 'empty' row (what === null)
        if (!cart.some((item) => item.what === null)) {
          cart.push(new CartItem(0, null));
        }
        this.setState({cart});
      });

      let what = cartItem.what;
      let options = this.state.inventory.map((item) => {
        return <option value={item.getId()} selected={what && item.getId() === what.getId()}>{item.getDisplayName()}</option>
      });
      // add a 'pick one' header...
      options.unshift(<option value={NONE} selected={!what}>...pick an ingredient</option>);
      return  <select className='width200' onChange={(val) => onIngredientChoice(val)}>{options}</select>;
    }

    return <li>
      <InputNumber controls={true} defaultValue={cartItem.amount} min={0} max={100} step={1} onChange={(v) => onAmountChange(v)}/>of{cartItemIngredUI()}</li>
  }

  cartRowsUI() {
    let rows = this.state.cart.map((cartItem) => this.cartItemUI(cartItem));
    return <ol className='shopping_cart'>{rows}</ol>;
  }

  cartUI() {
    // show each thing in the cart: bottom row lets them add a new one.
    let cartRows = this.cartRowsUI();
    // find the total cost...
    let totalCost = 0;
    let totalQuantity = 0;
    //let numItems = 0;
    this.state.cart.forEach((cartItem) => {
      if (cartItem.what) {
        let cost = this.state.prices[cartItem.what.getId()] * cartItem.amount;
        totalCost += cost;
        totalQuantity += cartItem.amount;
        //numItems++;
      }
    });
    if (totalQuantity === 0) {
      return cartRows;
    }
    let canBuy = totalCost <= this.state.bankroll;
    return (<div>
      {cartRows}
      <hr/>
      You've selected <b>{totalQuantity}</b> items at a total cost of ${totalCost}.
      {canBuy ? <button disabled={this.state.buying} onClick={(e) => this.startBuy()} className='buy_button'>{this.state.buying ? 'buying...' : 'Buy'}</button>: <span>exceeds your bankroll of ${this.state.bankroll}</span>}

    </div>);
  }
  
  render() {
    let imgUrl = "pix/card_backgrounds/costco.png";
    return (
      <table>
        <tbody>
          <tr>
            <td style={{'verticalAlign' : 'top'}}>
              <div className='card_face_border' horiz='yes'>
                <div className="card_face_description_bg">
                  <img src={imgUrl} width="250" alt="" />
                </div>
              </div>
            </td>
            <td style={{'verticalAlign' : 'top'}}>
              You have $<b>{this.state.bankroll === UNKNOWN ? 'unknown' : this.state.bankroll}</b> to spend.
              Indicate how many of what ingredient you wish to buy. Once you do, you can add
              another. When done, click the 'Buy' button.
              <hr/>
              {this.cartUI()}
            </td>
          </tr>
        </tbody>
      </table>
    )
  }
}

export default CostcoPage;
