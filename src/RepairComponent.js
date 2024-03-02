import React from 'react';

// lets users repair armor/weapons for $$.
// props:
// current - am I currently being shown?
// deck - player deck.
// onTransact(cards) - indicate desire to repair (cards)
// beGateway
// gameId
class RepairComponent extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
      prices: {}
    };
  }

  componentDidMount() {
    console.log(`repair page DCM: asking for prices`);
    this.props.beGateway.getArtisanPrices(this.props.gameId)
      .then((v) => {
        console.log(`repair: v = ${JSON.stringify(v)}`);
        this.setState({prices: v});

      }).catch((e) => {
        console.log(`repair: e = ${JSON.stringify(e)}`);

      });

  }

  repairableUI() {
    if (!this.state.prices.anvil) {
      return '...no price list yet, please come back later';
    }
    let candidates = [];
    if (this.props.deck) {
      candidates = this.props.deck.filter((card) => {
        //return true;
        return (card.GetArmorWear() > 0 || card.GetWeaponWear() > 0);
      });
    }
    if (candidates.length < 1) {
      return <div>You have nothing repairable.</div>;
    }
    const repairCost = (card) => {
      let level = card.GetBase().getLevel();
      let wear = card.GetArmorWear();
      let cost = 50;
      if (wear > 0) {
        cost = this.state.prices.anvil[level - 1];
      } else {
        wear = card.GetWeaponWear();
        cost = this.state.prices.whetstone[level - 1];
      }
      // TODO: should cost be a function of how worn it is?
      return cost;
    }

    const wantsToBuy = (card) => {
      console.log(`wantstoRepair: ${card.GetBase().getDisplayName()}`);
      if (this.props.onTransact) {
        this.props.onTransact([card]);
      }
    };

    let ui = candidates.map((card) => {
      return <li onClick={(e) => wantsToBuy(card)}>
        {card.GetBase().getDisplayName()} ... ${repairCost(card)}</li>;
    });
    return <div><span>Which one do you wish to repair?</span>
      <ul className='repair_list'>{ui}</ul></div>
  }

  render() {
    let imgUrl = "pix/card_backgrounds/blacksmith.png";
    return (
      <div className='repair_component' current={this.props.current}>
        <div className='card_face_border' horiz='yes'>
          <div className="card_face_description_bg">
            <img src={imgUrl} width="250" alt="" />
          </div>
        </div>
        <div horiz='yes'>
          <span>The Smith can repair worn armor/weapons, for a fee...</span>
          {this.repairableUI()}
        </div>
      </div>
    )
  }
}
export default RepairComponent;
