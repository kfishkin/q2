import React from 'react';
import { CARD_TYPES } from './BaseCard';
import Card from './Card';

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
      </div>,
      <div className='card_face_battle_image'>
        <img src="pix/general/sword_icon.png" width="32" alt="battle" />
      </div>,
      <div className='card_face_battle_value'>
        {baseCard.GetBattleValue()}
      </div>,
      <div className='card_face_description'>
        {card.FullyDescribe(this.props.gameInfo, this.props.deck)}
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
