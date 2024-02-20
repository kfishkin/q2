import React from 'react';
import { Select } from 'antd';
import Card from './Card';
import CardDetail from './CardDetail';
import CardsModal from './CardsModal';
import StatusMessage from './StatusMessage';
import { GAME_PAGE } from './NavMenu';

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
// beGateway
// row, col - of the room
// playerId
// onPlayerDeckBEChange={() => this.onPlayerDeckBEChange()}
// showPageFunc={(which, extra) => this.handleShowPage(which, extra)}
class FightPage extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);

    this.state = {
      selectedArmor: null,
      selectedWeapon: null,
      statusMessage: '',
      statusType: 'info',
      buttonText: 'Fight!',
      lootCards: [],
      showModal: false,
      fighting: false
    };
  }

  // if there's no monster/weapon/armor card, first choice is to use a base
  // card image with the given handle, second choice is to use the given card.
  makeFallback(firstOptionHandle, secondOptionCard) {
      let firstCard = Object.values(this.props.baseCards)
        .find((bc) => bc.GetHandle() === firstOptionHandle);
      if (firstCard) {
        let fake2 = { game_card: firstCard.db };
        return Card.Of(fake2);
      }
      return secondOptionCard;
    }    

  monsterUI(monsterCard) {
    if (monsterCard.GetBase().IsNothing()) {
      return (<li>
        The Monster is dead!
        <br />
        <CardDetail card={monsterCard} baseCards={this.props.baseCards} />
      </li>);

    } else {
      return (<li>
        The Monster is a level {monsterCard.GetBase().GetLevel()} <b>{monsterCard.GetBase().GetDisplayName()}</b>
        <br />
        <CardDetail card={monsterCard} baseCards={this.props.baseCards} />
      </li>);
    }
  }

  weaponUI(weaponCards, nothingCard) {
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
    let weaponOptions = [{ label: 'Bare-handed', value: 0 }];
    let selectedValue = 0;
    if (weaponCards && weaponCards.length > 0) {
      weaponCards.forEach((card) => {
        let optDict = {
          label: card.TerselyDescribe(),
          value: card.GetId()
        }
        weaponOptions.push(optDict);
      });

    }
    let weaponCard = this.state.selectedWeapon ? this.state.selectedWeapon
      : this.makeFallback('decor_fist', nothingCard);

    return (
      <li>
        choose your weapon: <Select style={{ width: 200 }} onChange={(val) => onWeaponChoice(val)}
         options={weaponOptions} defaultValue={selectedValue} />
        <br />
        <CardDetail card={weaponCard} baseCards={this.props.baseCards} />
      </li>)
  }

  armorUI(armorCards, nothingCard) {
    const onArmorChoice = (val) => {
      console.log(`armorChoice: ${val}`);
      if (val === 0) {
        this.setState({ selectedArmor: null });
      } else {
        let armorCard = armorCards.find((c) => c.GetId() === val);
        if (armorCard) {
          this.setState({ selectedArmor: armorCard });
        }
      }
    }
    let armorOptions = [{ label: 'None', value: 0 }];
    if (armorCards && armorCards.length > 0) {
      armorOptions = armorOptions.concat(armorCards.map((c) => { return { label: c.TerselyDescribe(), value: c.GetId() } }));
    }
    let armorCard = this.state.selectedArmor ? this.state.selectedArmor : nothingCard;

    return (
      <li>
        choose your armor: <Select style={{ width: 200 }} onChange={(val) => onArmorChoice(val)} options={armorOptions} />
        <br />
        <CardDetail card={armorCard} baseCards={this.props.baseCards} />
      </li>)
  }

  lowerPart() {
    const onStartFight = () => {
      console.log(`onStartFight: called`);
      this.setState({ statusMessage: 'fighting...', statusType: 'info', fighting: true });
      let p = this.props.beGateway.fight(this.props.gameId, this.props.playerId,
        this.props.row, this.props.col,
        this.state.selectedArmor ? this.state.selectedArmor.GetId() : null,
        this.state.selectedWeapon ? this.state.selectedWeapon.GetId() : null);
      let msg;
      let statusType = 'info';
      const playByPlay = (v) => {
        if (v.weaponRoll) {
          msg += `You rolled a '${v.weaponRoll}' for your attack.`;
        }
        if (v.armorRoll) {
          msg += `You rolled a '${v.armorRoll}' for your defense.`;
        }
        if (v.armorDegraded) {
          msg += ' Your armor was damaged.';
        }
        if (v.weaponDegraded) {
          msg += ' Your weapon was damaged.';
        }
        if (v.lifeLost) {
          msg += ' You lost a life!';
        }
      }
      p.then((v) => {
        console.log(`fe.fight: BE returned ${JSON.stringify(v)}`);
        // odds are something changed...
        let reloadDeck = false;
        let reloadGame = false; // whenever map OR what's in a room change


        switch (v.status) {
          case 'CONTINUE':
            msg = 'The fighting will continue.';
            playByPlay(v);
            msg += ` Press the '${this.state.buttonText}' button again for the next round`;
            statusType = 'info';
            reloadDeck = (v.armorDegraded || v.weaponDegraded || v.lifeLost);
            break;
          case 'DEAD':
            msg = "You've died!";
            // TODO: lots of stuff
            statusType = 'error';
            reloadDeck = reloadGame = true;
            break;
          case 'WIN':
            msg = 'You won!';
            playByPlay(v);
            if (v.loot && v.loot.length > 0) {
              msg += " You got some loot! Press the 'see loot' button to see it";
              this.setState({ lootCards: v.loot, buttonText: 'see loot' });
            }
            reloadDeck = (v.armorDegraded || v.weaponDegraded || v.lifeLost ||
              (v.loot && v.loot.length > 0));
            reloadGame = true;
            statusType = 'success';
            break;
            default:
              console.warn(`unknown fight status: ${v.status}`);
              msg += `unknown fight status: ${v.status}`;
              statusType = 'error';
        }
        if (reloadDeck) {
          this.props.onPlayerDeckBEChange();
        }
        if (reloadGame) {
          this.props.onGameDeckBEChange();
        }
        this.setState({ statusMessage: msg, statusType: statusType, fighting: false });
        window.alert(msg);
      }).catch((e) => {
        console.log(`fe.fight: e = ${e.name}:${e.message} ${e.stack}`);
        msg = `error: ${e.name}:${e.message}`;
        statusType = 'error';
        this.setState({ statusMessage: msg, statusType: statusType, fighting: false });
        window.alert(msg);
      });
    }

    const onShowLoot = () => {
      this.setState({ showModal: true });
    }

    let handler = (this.state.lootCards && this.state.lootCards.length > 0) ? onShowLoot : onStartFight;
    const handleOk = () => {
      this.setState({ showModal: false });
      this.props.showPageFunc(GAME_PAGE, {});
    }

    return (
      <div>
        <button disabled={this.state.fighting} onClick={(e) => handler()}>{this.state.buttonText}</button>
        <CardsModal title="Spoils of war" open={this.state.showModal} onOk={handleOk} onCancel={handleOk}
          cards={this.state.lootCards}
          topHtml={<span>You have just added spoils of war to your deck</span>}
          bottomHtml=""
          baseCards={this.props.baseCards}
        />
      </div>
    )
  }


  render() {
    let affinity = this.props.room.affinity;
    // find the base card for the monster. Might have gone if rendering after a win...

    let nothingBaseCard = Object.values(this.props.baseCards)
      .find((bc) => bc.IsNothing());
    // make a fake id card-card so can use CardDetail
    let fakeDb = { game_card: nothingBaseCard.db }
    // make a fake 'nothing' card for display
    let nothingCard = Card.Of(fakeDb);
    let baseCard = nothingCard;
    let monsterCard = null;
    if (this.props.room && this.props.room.owner && this.props.room.owner.handle) {
      let monsterHandle = this.props.room.owner.handle;
      baseCard = Object.values(this.props.baseCards)
        .find((bc) => bc.GetHandle() === monsterHandle);
      if (baseCard) {
        let fake2 = { game_card: baseCard.db };
        monsterCard = Card.Of(fake2);
      }
    }
    if (!monsterCard) {
      monsterCard = this.makeFallback('decor_grave', nothingCard);
    }

    // find the weapon and armor cards....
    let armorCards = this.props.deck.filter((c) => c.GetBase().GetRawArmorValue() > 0);
    let weaponCards = this.props.deck.filter((c) => c.GetBase().GetRawWeaponValue() > 0);
    let lifeCards = this.props.deck.filter((c) => c.GetBase().IsLife());
    let numLives = lifeCards.length;
    let lifeMsg;
    switch (numLives) {
      case 0: lifeMsg = "You are dead!"; break;
      case 1: lifeMsg = <span className='warning'>You only have 1 life to live. If the monster gets through your armor, you will die!</span>;
        break;
      default:
        lifeMsg = <span>You have {numLives} lives. If the monster gets through your armor, you will have {numLives - 1} left</span>;
    }

    return (<div>
      <div className='fight_header' affinity={this.props.room.affinity}>
        This fight takes place in the <b>{AffinityNames[affinity]}</b> biome.
        {lifeMsg}
      </div>

      <div className='fight_outer' >
        <ul className='fight_room'>
          {this.monsterUI(monsterCard)}
          {this.weaponUI(weaponCards, nothingCard)}
          {this.armorUI(armorCards, nothingCard)}
        </ul>
        {this.lowerPart()}
        <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />

      </div>
    </div>
    )
  }
}
export default FightPage;