import React from 'react';

// lets users repair armor/weapons for $$.
// props:
// current - am I currently being shown?
// deck - player deck.
// onTransact(cards) - indicate desire to repair (cards)
class RepairComponent extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  repairableUI() {
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
      let maxWear = Math.max(card.GetArmorWear(), card.GetWeaponWear());
      const FEE_PER_WEAR = 10;
      return maxWear * FEE_PER_WEAR;
    }

    const wantsToBuy = (card) => {
      console.log(`wantstoRepair: ${card.GetBase().GetDisplayName()}`);
      if (this.props.onTransact) {
        this.props.onTransact([card]);
      }
    };

    let ui = candidates.map((card) => {
      return <li onClick={(e) => wantsToBuy(card)}>{card.GetBase().GetDisplayName()} ... ${repairCost(card)}</li>;
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
