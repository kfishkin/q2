import React from 'react';
import { Select } from 'antd';
import CardDetail from './CardDetail';

// TODO: sync this with BE
const AffinityNames = {
  0: 'None',
  1: 'Earth',
  2: 'Air',
  3: 'Fire',
  4: 'Ice'
}

// fighting UI.
// props:
// room - the room for the fight
// deck - player deck as Card objects
// baseCards - base cards
// deck - player deck.
class FightPage extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
      selectedArmor: null,
      selectedWeapon: null
    };
  }

  playerUI() {
    // find the weapon and armor cards....
    let armorCards = this.props.deck.filter((c) => c.GetBase().GetRawArmorValue() > 0);
    let weaponCards = this.props.deck.filter((c) => c.GetBase().GetRawWeaponValue() > 0);
    // you can always try no armor/weapons...
    let armorOptions = [{ label: 'No armor', value: 0 }];
    if (armorCards && armorCards.length > 0) {
      // appears the value can't be an object, react gets mad :(.)
      armorOptions = armorOptions.concat(armorCards.map((c) => { return { label: c.GetBase().GetDisplayName(), value: c.GetId() } }));
    }
    let weaponOptions = [{ label: 'Bare-handed', value: 0 }];
    if (weaponCards && weaponCards.length > 0) {
      weaponOptions = weaponOptions.concat(weaponCards.map((c) => { return { label: c.GetBase().GetDisplayName(), value: c.GetId() } }));
    }
    const onWeaponChoice = (val) => {
      console.log(`weaponChoice: ${val}`);
      if (val === 0) {
        this.setState({ selectedWeapon: null });
      } else {
        let weaponCard = weaponCards.find((c) => c.GetId() === val);
        if (weaponCard) {
          this.setState({ selectedWeapon: weaponCard });
        }
      }
    }

    /*
    const showWeaponCard = () => {
      if (!this.state.selectedWeapon) return "";
      return <CardDetail card={this.state.selectedWeapon} baseCards={this.props.baseCards}/>
    }
    const showArmorCard = () => {
      if (!this.state.selectedArmor) return "";
      return <CardDetail card={this.state.selectedArmor} baseCards={this.props.baseCards}/>
    } 
    */   

    const onArmorChoice = (val) => {
      console.log(`armorChoice: ${val}`);
      if (val === 0) {
        this.setState({ selectedWeapon: null });
      } else {
        let armorCard = armorCards.find((c) => c.GetId() === val);
        if (armorCard) {
          this.setState({ selectedWeapon: armorCard });
        }
      }
    }

    const onStartFight = () => {
      console.log(`onStartFight: called`);

    };


    return (<li>
      choose your weapon: <Select style={{ width: 200 }} onChange={(val) => onWeaponChoice(val)} options={weaponOptions} />
      <br />
      <CardDetail card={this.state.selectedWeapon} baseCards={this.props.baseCards}/>
      <br />choose your armor: <Select style={{ width: 200 }} onChange={(val) => onArmorChoice(val)} options={armorOptions} />
      <CardDetail card={this.state.selectedArmor} baseCards={this.props.baseCards}/>
      <br />
      <button onClick={(e) => onStartFight()}>Start the Fight!</button>
    </li>);
  }

  render() {
    let affinity = this.props.room.affinity;
    // find the base card for the monster.
    let monsterHandle = this.props.room.owner.handle;
    let monsterBaseCard = Object.values(this.props.baseCards)
      .find((bc) => bc.GetHandle() === monsterHandle);
    // make a fake id card-card so can use CardDetail
    //let fakeDb = { game_card: monsterBaseCard.db }
    //let monsterCard = Card.Of(fakeDb);
    return (<div>
      <div>
        This fight takes place in the <b>{AffinityNames[affinity]}</b> biome.
        Other blah blah blah
      </div>

      <div className='fight_outer' affinity={this.props.room.affinity}>
        <ul className='fight_room'>
          <li>
            The Monster is a level {monsterBaseCard.GetLevel()} <b>{monsterBaseCard.GetDisplayName()}</b>
            <br />
            <img className='fight_image' src={monsterBaseCard.DescriptionBackgroundImageURL()} alt=''></img>
          </li>
          {this.playerUI()}
        </ul>
      </div>
    </div>
    )
  }
}
export default FightPage;
