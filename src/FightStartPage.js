import React from 'react';
import Card from './Card';
import CardDetail from './CardDetail';
import { AffinityLabels } from './types/Affinities';

// props
// baseCards { id --> BaseCard}
// beGateway
// board
// deck: []
// onUpdatePlayerState - f(dict), update the given fields in the player state.

// playerStateBundle
const NONE = 0;
class FightStartPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statusMessage: null,
      statusType: 'info',
      noWeaponBaseCard: null,
      noArmorBaseCard: null,
    }
  }

  componentDidMount() {
    // find the 'unarmored' and 'unweaponed' base cards.
    let noWeaponBaseCard = Object.values(this.props.baseCards).find((bc) => bc.getHandle() === 'decor_fist');
    let noArmorBaseCard = Object.values(this.props.baseCards).find((bc) => bc.getHandle() === 'decor_no_armor');
    this.setState({noArmorBaseCard, noWeaponBaseCard});
  }

  monsterUI(monsterBaseCard) {
    if (!monsterBaseCard) {
      return <div>Unknown monster...</div>
    }
    let fakeCard = Card.Of({ game_card: monsterBaseCard.getDb() });
      return (<div>
        The Monster is a level {monsterBaseCard.getLevel()} <b>{monsterBaseCard.getDisplayName()}</b>
        <br />
        <CardDetail card={fakeCard} baseCards={this.props.baseCards} />
      </div>);
  }

  weaponUI(weaponCards, currentWeaponId) {
    const NONE = 0;
    const onWeaponChoice = (val) => {
      let id = val.target.value;
      this.props.onUpdatePlayerState({ weapon_id: id});
    }
    
    let weaponOptions = [{ label: 'Bare-handed', value: NONE, selected: currentWeaponId === NONE}];
    let selectedCard = null;
    weaponCards.forEach((card) => {
      let label = card.terselyDescribe();
      let opt = { label: label, value: card.getId(), selected: card.getId() === currentWeaponId};
      if (opt.selected) {
        selectedCard = card;
      }
      weaponOptions.push(opt);
    });
    weaponOptions.forEach((dict) => {
      if (dict.selected) {
        dict.label = '(current) ' + dict.label;
      }
    })
    // might not have mounted yet...
    if (!selectedCard && this.state.noWeaponBaseCard) {
      selectedCard = Card.Of({ game_card: this.state.noWeaponBaseCard.getDb()});
    }
    let htmlOpts = weaponOptions.map((dict) => {
      return (<option value={dict.value} selected={dict.selected}>{dict.label}</option>)
    });
    return (<div>
        choose your weapon: <select className='width200' onChange={(val) => onWeaponChoice(val)}>
          {htmlOpts}
        </select>
        {selectedCard ? <CardDetail card={selectedCard} baseCards={this.props.baseCards} /> : ''}
    </div>);
  }
  armorUI(armorCards, currentArmorId) {

    const onArmorChoice = (val) => {
      let id = val.target.value;
      this.props.onUpdatePlayerState({ armor_id: id});
    }
    
    let armorOptions = [{ label: 'Unarmored', value: NONE, selected: currentArmorId === NONE}];
    let selectedCard = null;
    armorCards.forEach((card) => {
      let label = card.terselyDescribe();
      let opt = { label: label, value: card.getId(), selected: card.getId() === currentArmorId};
      if (opt.selected) {
        selectedCard = card;
      }
      armorOptions.push(opt);
    });
    armorOptions.forEach((dict) => {
      if (dict.selected) {
        dict.label = '(current) ' + dict.label;
      }
    })
    let htmlOpts = armorOptions.map((dict) => {
      return (<option value={dict.value} selected={dict.selected}>{dict.label}</option>)
    });
        // might not have mounted yet...
        if (!selectedCard && this.state.noArmorBaseCard) {
          selectedCard = Card.Of({ game_card: this.state.noArmorBaseCard.getDb()});
        }
    return (<div>
        choose your armor: <select className='width200' onChange={(val) => onArmorChoice(val)}>
          {htmlOpts}
        </select>
        {selectedCard ? <CardDetail card={selectedCard} baseCards={this.props.baseCards} /> : ''}
    </div>);
  }

  render() {
    // (room) can be undefined temporarily on first load. not sure why, but...
    let monsterBaseCard = this.props.room ? this.props.baseCards[this.props.room.monster_card_id] : null;
    // pull out the weapon backback cards, and the armor backpack cards
    let backpackCards = this.props.deck ? this.props.deck.filter((card) => card.inBackpack()) : [];
    let armorCards = backpackCards.filter((card) => card.getBase().isArmor());
    let weaponCards = backpackCards.filter((card) => card.getBase().isWeapon());
    let currentArmorId = ('armor_id' in this.props.playerStateBundle) ? this.props.playerStateBundle.armor_id : NONE;
    let currentWeaponId = ('weapon_id' in this.props.playerStateBundle) ? this.props.playerStateBundle.weapon_id : NONE;
    return (<div>
      Fight in the {AffinityLabels[this.props.playerStateBundle.affinity]} biome
      <table>
        <tbody>
        <tr>
          <td style={{'verticalAlign' : 'top'}}>{this.monsterUI(monsterBaseCard)}</td>
          <td style={{'paddingLeft' : '10px'}}>
            <table>
              <tbody>
                <tr>
                  <td>{this.weaponUI(weaponCards, currentWeaponId)}</td>
                  </tr>
                  <tr>
                  <td>{this.armorUI(armorCards, currentArmorId)}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        </tbody>

      </table>
      <br/>



      </div>);
  }
}

export default FightStartPage;