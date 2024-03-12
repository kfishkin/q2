import React from 'react';
import Card from './Card';
import CardDetail from './CardDetail';
import FightRoundDialog from './FightRoundDialog';
import StatusMessage from './StatusMessage';

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
      fighting: false,
      fightDialogProps: {},
      showFightDialog: false
    };
  }

  componentDidMount() {
    // selected armor and weapon default to the best available.
    let armorCards = this.props.deck.filter((c) => c.getBase().getRawArmorValue() > 0);
    let weaponCards = this.props.deck.filter((c) => c.getBase().getRawWeaponValue() > 0);
    if (armorCards.length > 0) {
      let bestArmor = null;
      let bestValue = 0;
      armorCards.forEach((c) => {
        if (c.getNetArmorValue() > bestValue) {
          bestValue = c.getNetArmorValue();
          bestArmor = c;
        }
      });
      if (bestArmor !== null) {
        this.setState({ selectedArmor: bestArmor });
      }
    }
    if (weaponCards.length > 0) {
      let bestWeapon = null;
      let bestValue = 0;
      weaponCards.forEach((c) => {
        if (c.getNetWeaponValue() > bestValue) {
          bestValue = c.getNetWeaponValue();
          bestWeapon = c;
        }
      });
      if (bestWeapon !== null) {
        this.setState({ selectedWeapon: bestWeapon });
      }
    }


  }

  // if there's no monster/weapon/armor card, first choice is to use a base
  // card image with the given handle, second choice is to use the given card.
  makeFallback(firstOptionHandle, secondOptionCard) {
    let firstCard = Object.values(this.props.baseCards)
      .find((bc) => bc.getHandle() === firstOptionHandle);
    if (firstCard) {
      let fake2 = { game_card: firstCard.db };
      return Card.Of(fake2);
    }
    return secondOptionCard;
  }

  monsterUI(monsterCard) {
    if (monsterCard.getBase().isNothing()) {
      return (<div>
        The Monster is dead!
        <br />
        <CardDetail card={monsterCard} baseCards={this.props.baseCards} />
      </div>);

    } else {
      return (<div>
        The Monster is a level {monsterCard.getBase().getLevel()} <b>{monsterCard.getBase().getDisplayName()}</b>
        <br />
        <CardDetail card={monsterCard} baseCards={this.props.baseCards} />
      </div>);
    }
  }

  weaponUI(weaponCards, nothingCard) {
    const NONE = "none";
    const onWeaponChoice = (val) => {
      val = val.target.value;
      console.log(`weaponChoice: ${val}`);
      if (val === NONE) {
        this.setState({ selectedWeapon: null });
      } else {
        let weaponCard = weaponCards.find((c) => c.getId() === val);
        if (weaponCard) {
          this.setState({ selectedWeapon: weaponCard });
        }
      }
    }
    let weaponOptions = [{ label: 'Bare-handed', value: NONE, selected: !this.state.selectedWeapon }];

    if (weaponCards && weaponCards.length > 0) {
      weaponCards.forEach((card) => {
        let optDict = {
          label: card.terselyDescribe(),
          value: card.getId(),
          selected: card === this.state.selectedWeapon
        }
        weaponOptions.push(optDict);
      });

    }
    // moved away from ant select, too hard to set initial value.weird.
    let htmlOpts = weaponOptions.map((dict) => {
      return (<option value={dict.value} selected={dict.selected}>{dict.label}</option>)
    });

    let weaponCard = this.state.selectedWeapon ? this.state.selectedWeapon
      : this.makeFallback('decor_fist', nothingCard);
    //let selectedValue = this.state.selectedWeapon ? this.state.selectedWeapon.getId() : 0;

    return (
      <span>
        choose your weapon: <select style={{ width: 200 }} onChange={(val) => onWeaponChoice(val)}>
          {htmlOpts}
        </select>
        <br />
        <CardDetail card={weaponCard} baseCards={this.props.baseCards} />
      </span>)
  }

  armorUI(armorCards, nothingCard) {
    const NONE = "none";
    const onArmorChoice = (val) => {
      console.log(`armorChoice: ${val}`);
      val = val.target.value;
      if (val === NONE) {
        this.setState({ selectedArmor: null });
      } else {
        let armorCard = armorCards.find((c) => c.getId() === val);
        if (armorCard) {
          this.setState({ selectedArmor: armorCard });
        }
      }
    }
    let selectedValue = this.state.selectedArmor ? this.state.selectedArmor.getId() : 0;
    let armorOptions = [{ label: 'None', value: NONE, selected: !this.state.selectedArmor }];
    armorOptions = armorOptions.concat(armorCards.map((c) => {
      return { label: c.terselyDescribe(), value: c.getId(), selected: c === this.state.selectedArmor }
    }));
    let htmlOpts = armorOptions.map((dict) => {
      return (<option value={dict.value} selected={dict.selected}>{dict.label}</option>)
    });
    let armorCard = this.state.selectedArmor ? this.state.selectedArmor
      : this.makeFallback('decor_no_armor', nothingCard);


    return (
      <span>
        choose your armor: <select style={{ width: 200 }} value={selectedValue}
          onChange={(val) => onArmorChoice(val)} >
          {htmlOpts}
        </select>
        <br />
        <CardDetail card={armorCard} baseCards={this.props.baseCards} />
      </span>)
  }

  buttonPart() {
    const onStartFight = () => {
      this.setState({ statusMessage: 'fighting...', statusType: 'info', fighting: true });

      const onContinue = () => {
        console.log(`onContinue: called`);
        onStartFight();
      }
      const onRunAway = () => {
        console.log(`wants to run away!`);
        let p = this.props.beGateway.runaway(this.props.gameId, this.props.playerId,
          this.props.row, this.props.col)
        p.then((v) => {
          if (!v.ok) {
            this.setState({ statusMessage: `backend error: ${v.statusMessage}`, statusType: 'error' });
          } else {
            let fightDialogProps = {
              status: 'RANAWAY',
              lost: v.lost || [],
              open: true,
              onEndFight: (dict) => onEndFight(dict),
            }
            this.setState({ fightDialogProps: fightDialogProps, showFightDialog: true });
          }
        });
      }

      const onEndFight = (dict) => {
        console.log(`onEndFight: dict = ${JSON.stringify(dict)}`);
        this.setState({ showFightDialog: false });
        let { reloadDeck, reloadGame, nextPage } = dict;
        if (reloadDeck) {
          this.props.onPlayerDeckBEChange();
        }
        if (reloadGame) {
          this.props.onGameDeckBEChange();
        }
        if (nextPage) {
          gotoPage(nextPage);
        }
      }

      let p = this.props.beGateway.fight(this.props.gameId, this.props.playerId,
        this.props.row, this.props.col,
        this.state.selectedArmor ? this.state.selectedArmor.getId() : null,
        this.state.selectedWeapon ? this.state.selectedWeapon.getId() : null);
      p.then((v) => {
        if (!v.ok) {
          this.setState({ statusMessage: `backend error: ${v.statusMessage}`, statusType: 'error' });
        } else {
          let fightDialogProps = {
            weaponRoll: v.weaponRoll,
            armorRoll: v.armorRoll,
            armorDegraded: v.armorDegraded,
            weaponDegraded: v.weaponDegraded,
            lifeLost: v.lifeLost,
            loot: v.loot,
            status: v.status,
            open: true,
            onEndFight: (dict) => onEndFight(dict),
            onContinue: () => onContinue(),
            onRunAway: () => onRunAway()
          }

          this.setState({ fightDialogProps: fightDialogProps, showFightDialog: true });
        }
      });
    }

    const gotoPage = (page) => {
      this.setState({ showFightDialog: false });
      this.props.showPageFunc(page, {});
    }

    return (
      <div>
        <button className='fight_button' disabled={this.state.fighting} onClick={(e) => onStartFight()}>Fight!</button>
        <FightRoundDialog open={this.state.showFightDialog} {...this.state.fightDialogProps} baseCards={this.props.baseCards} />
      </div>
    )
  }


  render() {
    let affinity = this.props.room.affinity;
    // find the base card for the monster. Might have gone if rendering after a win...

    let nothingBaseCard = Object.values(this.props.baseCards)
      .find((bc) => bc.isNothing());
    // make a fake id card-card so can use CardDetail
    let fakeDb = { game_card: nothingBaseCard.db }
    // make a fake 'nothing' card for display
    let nothingCard = Card.Of(fakeDb);
    let baseCard = nothingCard;
    let monsterCard = null;
    if (this.props.room && this.props.room.owner && this.props.room.owner.handle) {
      let monsterHandle = this.props.room.owner.handle;
      baseCard = Object.values(this.props.baseCards)
        .find((bc) => bc.getHandle() === monsterHandle);
      if (baseCard) {
        let fake2 = { game_card: baseCard.db };
        monsterCard = Card.Of(fake2);
      }
    }
    if (!monsterCard) {
      monsterCard = this.makeFallback('decor_grave', nothingCard);
    }

    // find the weapon and armor cards....
    let armorCards = this.props.deck.filter((c) => c.getBase().getRawArmorValue() > 0);
    let weaponCards = this.props.deck.filter((c) => c.getBase().getRawWeaponValue() > 0);
    let lifeCards = this.props.deck.filter((c) => c.getBase().isLife());
    let numLives = lifeCards.length;
    let lifeMsg = "";
    switch (numLives) {
      case 0: lifeMsg = "You are dead!"; break;
      default:
        lifeMsg = ""; break;
        /*
      case 1: lifeMsg = <span className='warning'>You only have 1 life to live. If the monster gets through your armor, you will die!</span>;
        break;
      default:
        lifeMsg = <span>You have {numLives} lives. If the monster gets through your armor, you will have {numLives - 1} left</span>;
        */
    }

    return (<div>
      <div className='fight_header' affinity={this.props.room.affinity}>
        This fight takes place in the <b>{AffinityNames[affinity]}</b> biome.
        {lifeMsg}
      </div>

      <div className='fight_outer' >
        <table>
          <tbody>
            <tr className='fight_top_row'>
              <td>{this.weaponUI(weaponCards, nothingCard)}</td>
              <td className='fight_rhs'>{this.buttonPart()}<br/></td>
            </tr>
            <tr className='fight_bottom_row'>
            <td>{this.armorUI(armorCards, nothingCard)}</td>
            <td className='fight_rhs'>{this.monsterUI(monsterCard)}</td>
            </tr>
          </tbody>
        </table>
      <StatusMessage message={this.state.statusMessage} type={this.state.statusType} />
      </div>
    </div>
    )
  }
}
export default FightPage;