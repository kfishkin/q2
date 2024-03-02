import React from 'react';
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
    if (!(card.getType)) {
      //console.warn(`non-card passed to CardDetail`);
      card = Card.Of(card);
    }
    let baseCard = card.GetBase();
    let parts = [];

    parts.push(<div className='card_face_title'>
      {baseCard.getDisplayName()}
    </div>,
      <div className='card_face_level_image'>
        <img src="pix/general/yellow_star.jpg" width="32" alt="level" />
      </div>,
      <div className='card_face_level_value'>
        {baseCard.getLevel()}
      </div>);
    if (baseCard.isSellable()) {
      parts.push(<div className='card_face_value'>
        ({baseCard.getSellValue()})
      </div>);
    }
    if (card.GetDb().awardedFor) {
      console.log(`have something that was awarded`);
      let awardName = `prize from the '${card.GetDb().awardedFor.message}' award`;
      parts.push(
        <div className='card_face_prize_image'>
          <img src="pix/general/blue_ribbon_yes.png" width="64" title={awardName} alt={awardName} />
        </div>);

    }
    

    if (baseCard.getRawArmorValue() > 0) {
      parts.push(
        <div className='card_face_armor_image'>
          <img src="pix/icons/armor.png" width="32" alt="armor" />
        </div>,
        <div className='card_face_armor_value'>
          {card.GetNetArmorValue()}
        </div>)
    };

    if (baseCard.getRawWeaponValue() > 0) {
      parts.push(
        <div className='card_face_weapon_image'>
          <img src="pix/general/sword_icon.png" width="32" alt="weapon" />
        </div>,
        <div className='card_face_weapon_value'>
          {card.GetNetWeaponValue()}
        </div>)
    };

    parts.push(<div className='card_face_description'>
      {card.fullyDescribe(this.props.baseCards)}
    </div>);
    let imgUrl = baseCard.descriptionBackgroundImageURL();
    if (imgUrl) {
      parts.push(
        <div className="card_face_description_bg">
          <img src={imgUrl} width="250" alt="" />
        </div>
      );
    }

    return (
      <div className='card_face_border'>
        {parts}
      </div>
    )

  }
}
export default CardDetail;
