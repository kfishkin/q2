import Card from './Card';
import CardsModal from './CardsModal';
import React from 'react';
import { NAV_ITEM_PAGES } from './NavMenuItemComponent';

// this is the dialog box around letting the user see the results
// of a round of combat, and decide whether or not to run away.
// not using Ant dialog because easier to control things like
// button size and placement.
//
// props:
// fighting - am I doing BE fighting right now
// open - for the dialog
// onEndFight({reloadDeck, reloadGame, nextPage, lost}) - after the fight ends.
//    (lost) is cards lost if ran away.
// onRunAway() - after wanting to run away.
// onContinue() - after wanting to fight on.
// status - one of (WIN, CONTINUE, DEAD)
// general info about the round:
// armorRoll, weaponRoll
// armorDegraded, weaponDegraded, lifeLost
// armorBonus, weaponBonus
// if WIN
//   loot, if any
// 
// baseCards - so can show cards modal.

class FightRoundDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: props.open,
      showLoot: false,
      ranAway: false,
      fighting: props.fighting
    }
  }

  render() {
    // show the dialog no matter the status, so user can read and absorb.
    // buttons will change though.

    const playByPlay = () => {
      let props = this.props;
      let msg = "";
      if (props.weaponRoll) {
        msg += `You rolled a '${props.weaponRoll}' for your attack.`;
      }
      if (props.armorRoll) {
        msg += `You rolled a '${props.armorRoll}' for your defense.`;
      }
      if (props.armorBonus) {
        let amt = parseInt(props.armorBonus);
        if (amt > 0) {
          msg += ' Your enchanted armor gave you a bonus.';
        } else if (amt < 0) {
          msg += ' Your enchanted armor gave your _opponent_ a bonus.';
        }
      }
      if (props.armorDegraded) {
        msg += ' Your armor was damaged.';
      }
      if (props.weaponBonus) {
        let amt = parseInt(props.weaponBonus);
        if (amt > 0) {
          msg += ' Your enchanted weapon gave you a bonus.';
        } else if (amt < 0) {
          msg += ' Your enchanted weapon gave your _opponent_ a bonus.';
        }
      }      
      if (props.weaponDegraded) {
        msg += ' Your weapon was damaged.';
      }
      if (props.lifeLost) {
        msg += ' You lost a life!';
      }
      return msg;
    }

    const onAlmostEnded = (endStatus) => {
      // if I have to show stuff, then show it, else I'm done.
      if (endStatus.hasLoot) {
        this.setState({ endStatus: endStatus, showLoot: true });
      } else {
        this.setState({ open: false });
        this.props.onEndFight(endStatus);
      }
    }

    const winUI = () => {
      const BUTTON_TEXT = 'I won!'
      let props = this.props;
      let msg = playByPlay() + ' You won!';
      let hasLoot = (props.loot && props.loot.length > 0);
      if (hasLoot) {
        msg += ` You got some loot! Press the '${BUTTON_TEXT}' button to see it`;
      } else {
        msg += "No loot found.";
      }
      let endStatus = {
        reloadDeck: (props.armorDegraded || props.weaponDegraded || props.lifeLost ||
          (props.loot && props.loot.length > 0)),
        reloadGame: true,
        nextPage: NAV_ITEM_PAGES.GAME_PAGE,
        hasLoot: hasLoot
      }
      return (<dialog id='fight_dialog' open={props.open}>
        {msg}
        <hr />
        <button onClick={(e) => onAlmostEnded(endStatus)}>{BUTTON_TEXT}</button>
      </dialog>);
    }

    const deadUI = () => {
      const BUTTON_TEXT = "vive memor leti"
      let msg = playByPlay() + ". You've died! On to the trophy hall...";
      let endStatus = {
        reloadDeck: false,
        reloadGame: true,
        nextPage: NAV_ITEM_PAGES.TROPHY_PAGE
      }
      return (<dialog id='fight_dialog' open={this.props.open}>
        {msg}
        <button onClick={(e) => onAlmostEnded(endStatus)}>{BUTTON_TEXT}</button>
      </dialog>);
    }

    const unknownUI = () => {
      const BUTTON_TEXT = 'sorry about that';
      let endStatus = {
        reloadDeck: true,
        reloadGame: true,
        nextPage: NAV_ITEM_PAGES.GAME_PAGE
      }
      return (<dialog id='fight_dialog' open={this.props.open}>
        Uh-oh, internal error: unknown fight status '{this.props.status}'
        <button onClick={(e) => onAlmostEnded(endStatus)}>{BUTTON_TEXT}</button>
      </dialog>);

    }

    const continueUI = () => {
      let msg = playByPlay() + ' The fight will continue.';
      const onRunAway = () => {
        let endStatus = {
          reloadDeck: true,
          reloadGame: true,
          nextPage: NAV_ITEM_PAGES.GAME_PAGE,
        }
        this.setState({endStatus});
        this.props.onRunAway();
      }
      const onFightOn = () => {
        this.setState({ open: false, fighting: true }, () => this.props.onContinue());
      }
      return (<dialog id='fight_dialog' open={this.props.open} fighting={this.state.fighting}>
        {msg}
        <hr />
        <div style={{position:'relative'}}>
        <button className='run_away_button' title='DOUBLE-click to run away' onDoubleClick={(e) => onRunAway()}>run away!</button> <span style={{fontSize: 'smaller'}}>(double-click)</span>
        <button className='fight_on_button' onClick={(e) => onFightOn()}>Fight on!</button>
        </div>
      </dialog>);

    }

    const showLootUI = () => {
      let lootCards = this.props.loot.map((lootDb) =>  Card.Of(lootDb));
      lootCards.sort((c1, c2) => c2.getBase().getSellValue() - c1.getBase().getSellValue());
      const doneViewingLoot = () => {
        this.setState({ open: false, showLoot: false });
        this.props.onEndFight(this.state.endStatus);        
      }

      return (
      <CardsModal title="Spoils of war" open={this.state.showLoot} onOk={(e) => doneViewingLoot()} onCancel={(e) => doneViewingLoot()}
      cards={lootCards}
      topHtml={<span>You have just added spoils of war to your deck</span>}
      bottomHtml=""
      baseCards={this.props.baseCards}
    />);
    };

    const ranAwayUI = () => {
      let lossCards = this.props.lost.map((lootDb) =>  Card.Of(lootDb));
      let showLosses = true;
      const doneViewingLosses = () => {
        showLosses = false;
        this.setState({ open: false, showLoot: false});
        this.props.onEndFight(this.state.endStatus);        
      }

      let descr;
      switch (lossCards.length) {
        case 0:
          descr = "Luckily, you lost no cards";
          break;
        case 1:
          descr = "You only lost 1 card";
          break;
        default:
          descr = `You lost ${lossCards.length} cards`;
      }
      return (
          <CardsModal title="Ran away" open={showLosses} onOk={(e) => doneViewingLosses()} onCancel={(e) => doneViewingLosses()}
          cards={lossCards}
          topHtml={descr}
          bottomHtml=""
          baseCards={this.props.baseCards}
        />);
    };    

    if (this.state.showLoot) {
      return showLootUI();
    } else {

      switch (this.props.status) {
        case 'WIN':
          return winUI();
        case 'DEAD':
          return deadUI();
        case 'CONTINUE':
          return continueUI();
          case undefined: // happens at the start
          return "";
          case 'RANAWAY':
            return ranAwayUI();
        default:
          return unknownUI();
      }
    }
  }
}
export default FightRoundDialog;
