import React from 'react';
import { CARD_TYPES, CardType } from './CardType';

// props: 
//  card - the card to show detail for.
// gameInfo - top-level game info, needed for the description/semantics.
// deck - the players current deck
class CardDetail extends React.Component {
  render() {
    if (!this.props.card) {
      return;
    }
    let card = this.props.card;
    let gc = card.game_card;
    let typeObj = CardType.make(gc.type)
    let parts = [];
    parts.push(<div className='card_face_title'>
      {gc.display_name}
    </div>,
      <div className='card_face_level_image'>
        <img src="pix/general/yellow_star.jpg" width="32" alt="level" />
      </div>,
      <div className='card_face_level_value'>
        {gc.level}
      </div>,
      <div className='card_face_value'>
        (${gc.sell_value})
      </div>,
      <div className='card_face_battle_image'>
        <img src="pix/general/sword_icon.png" width="32" alt="battle" />
      </div>,
      <div className='card_face_battle_value'>
        {gc.battle_value}
      </div>,
      <div className='card_face_description'>
        {typeObj.FullyDescribe(card, this.props.gameInfo, this.props.deck)}
      </div>);
    if (typeObj.GetType() === CARD_TYPES.BATTLE_MODIFIER) {
      parts.push(
        <div className='card_face_battle_modifier_image'>
          {typeObj.BattleModifierImage(card)}
        </div>);
      ;

    }
    return (
      <div className='card_face_border'>
        {parts}
      </div>
    )

  }
}
export default CardDetail;
