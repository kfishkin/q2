import React from 'react';

// little component in the side bar to show
// player status:
//    best weapon
//    best armor
//    other stuff to come.
//
//
// props
// playerId - if null, not logged in
// deck - if null, no game or deck yet. Expects class elements.

class PlayerStatus extends React.Component {
  render() {
    if (!this.props.playerId) {
      return;
    }
    if (!this.props.deck || this.props.deck.length === 0) {
      return;
    }

    const bestWeaponUI = () => {
      let bestValue = -1;
      let bestCard = 0;
      this.props.deck.forEach(card => {
        let val = card.getNetWeaponValue();
        if (val > bestValue) {
          bestValue = val;
          bestCard = card;
        }
      });
      let body = (bestCard && bestValue > 0) ? `best weapon (${bestValue}): ${bestCard.terselyDescribe()}`
        : `you have no weapons`;
      return <div>{body}</div>
    }

    const bestArmorUI = () => {
      let bestValue = -1;
      let bestCard = 0;
      this.props.deck.forEach(card => {
        let val = card.getNetArmorValue();
        if (val > bestValue) {
          bestValue = val;
          bestCard = card;
        }
      });
      let body = (bestCard && bestValue > 0) ? `best armor (${bestValue}): ${bestCard.terselyDescribe()}`
        : `you have no useful armor`;
      return <div>{body}</div>
    }

    const livesUI = () => {
      let numLives = 0;
      this.props.deck.forEach((card) => {
        if (card.getBase().isLife()) {
          numLives++;
        }
      });
      return <div>Lives: {numLives}</div>

    }

    return (<div className='player_status'>
      {bestWeaponUI()}
      {bestArmorUI()}
      {livesUI()}
    </div>);
  }
}
export default PlayerStatus;
