import React from 'react';
import { CARD_TYPES } from './BaseCard';
import Card from './Card';

// props: 
//  card - the card to show detail for.
// baseCards - the base cards
class CardDetail extends React.Component {
  render() {
    if (!this.props.card) {
      return;
    }
    let card = this.props.card;
    if (!(card.GetType)) {
      console.warn(`non-card passed to CardDetail`);
      card = Card.Of(card);
    }
    let baseCard = card.GetBase();
    let parts = [];
    parts.push(<div className='card_face_title'>
      {baseCard.GetDisplayName()}
    </div>,
      <div className='card_face_level_image'>
        <img src="pix/general/yellow_star.jpg" width="32" alt="level" />
      </div>,
      <div className='card_face_level_value'>
        {baseCard.GetLevel()}
      </div>,
      <div className='card_face_value'>
        ({baseCard.GetSellValue()})
      </div>);

    if (baseCard.GetRawArmorValue() > 0) {
      parts.push(
        <div className='card_face_armor_image'>
          <img src="pix/icons/armor.png" width="32" alt="armor" />
        </div>,
        <div className='card_face_armor_value'>
          {card.GetNetArmorValue()}
        </div>)
    };

    if (baseCard.GetRawWeaponValue() > 0) {
      parts.push(
        <div className='card_face_weapon_image'>
          <img src="pix/general/sword_icon.png" width="32" alt="weapon" />
        </div>,
        <div className='card_face_weapon_value'>
          {card.GetNetWeaponValue()}
        </div>)
    };

      parts.push(<div className='card_face_description'>
        {card.FullyDescribe(this.props.baseCards)}
      </div>);
    let imgUrl = baseCard.DescriptionBackgroundImageURL();
    if (imgUrl) {
      parts.push(
        <div className="card_face_description_bg">
          <img src={imgUrl} width="250" alt="" />
        </div>
      );
    }

    if (baseCard.GetType() === CARD_TYPES.BATTLE_MODIFIER) {
      parts.push(
        <div className='card_face_battle_modifier_image'>
          {baseCard.BattleModifierImage()}
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
