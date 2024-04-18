import React from 'react';
import Card from './Card';
import CardDetail from './CardDetail';

// fighting UI.
// props:
// baseCards - hash from Id to baseCardDb
// beGateway
// deck - [Card]
// gameId
// onDie - f() when dead.
// onFlee - f() to flee
// onWon - f() when win.
// playerId
// room - the room for the fight
class FightPage extends React.Component {
  // this is called once when the page first loads, NOT each time the parent state changes.
  constructor(props) {
    super(props);
    let noWeaponBaseCard = Object.values(this.props.baseCards).find((bc) => bc.getHandle() === 'decor_fist');
    let noArmorBaseCard = Object.values(this.props.baseCards).find((bc) => bc.getHandle() === 'decor_no_armor');
    // note that this can take a while.
    this.state = {
      logEntries: [],
      isEphemeral: [], // indicates if the i'th entry is ephemeral - only show if TOS
      noArmorBaseCard,
      noWeaponBaseCard,
    }
  }

  maybeFlee() {
    let ok = window.confirm('Are you sure you want to flee? You will lose ALL items in your backpack');
    if (ok) {
      this.props.onFlee();
    }    
  }

  done() {
    this.props.onWon();
  }

  onDie() {
    this.props.onDie();
  }

  continueFight() {
    const WIN_STATUS = "WIN";
    const DIE_STATUS = "DEAD";
    const TIE_STATUS = "CONTINUE";

    console.log(`continueFight: called`);
    // squish the buttons with an in-progress message...
    this.pushEntry(<span>Fighting...</span>, true);
    this.props.beGateway.fight(this.props.gameId, this.props.playerId).then((v) => {
      console.log(`continueFight: v = ${JSON.stringify(v)}`);
      const PBP = 'play_by_play';
      if (v.errorMessage) {
        if (v.errorMessage.includes('not fighting in game')) {
          // this can happen if you return to a fight after winning it.
          this.done();
          return;
        }
        this.pushEntry(<span className={PBP} flavor="bad">backend error: {v.errorMessage}</span>, false);
        this.pushEntry(this.makeInterRoundUI(), true);
        return;
      }
      // put the result last, so it's on top...
      this.pushEntry(<hr/>, false);
      this.pushEntry(<span className={PBP} flavor={v.armorDegraded ? 'warning': 'info'}>Armor roll of <b>{v.armorRoll}</b>. {v.armorDegraded ? 'Armor degraded.':''}</span>, false);
      this.pushEntry(<span className={PBP} flavor={v.weaponDegraded ? 'warning': 'info'}>Weapon roll of <b>{v.weaponRoll}</b>. {v.weaponDegraded ? 'Weapon degraded.':''}</span>, false);
      if (v.lootBaseIds && v.lootBaseIds.length > 0) {
        let lootNames = v.lootBaseIds.map((id) => this.props.baseCards[id].getDisplayName());
        this.pushEntry(<span className={PBP} flavor="good">Loot has been added to your backpack: {lootNames.join()}</span>, false);
      }
      if (v.award) {
        console.log(`award = ${JSON.stringify(v.award)}`);
        this.pushEntry(<span className={PBP} flavor="good">You won an award!: <i>{v.award.message}</i>. Go to 'trophies' to see more.</span>, false);
      }
      if (v.cleanSweepAwarded) {
        this.pushEntry(<span className={PBP} flavor="good"><i>You won a clean sweep prize!</i>. Check your backpack...</span>, false);
      }
      if (v.status === WIN_STATUS) {
        // TODO: be should update PlayerState to 'away'.
        // TODO: show loot
        this.pushEntry(<span className={PBP} flavor="good"><i>You won!</i> click <button onClick={(e) => this.done()}> here </button> to continue adventuring</span>, true);
      } else if (v.status === TIE_STATUS) {
        this.pushEntry(<span>The battle will continue.</span>, false);
        this.pushEntry(this.makeInterRoundUI(), true);
      } else if (v.status === DIE_STATUS) {
        this.pushEntry(<span className={PBP} flavor="bad"><i>You're dead, bummer!</i> click <button onClick={(e) => this.onDie()}> here </button> to see your trophies</span>, true);
      }
    });
  }

  pushEntry(entry, ephemeral) {
    let logEntries = this.state.logEntries;
    logEntries.unshift(entry);
    let isEphemeral = this.state.isEphemeral;
    isEphemeral.unshift(ephemeral);
    this.setState({logEntries, isEphemeral});
  }

  makeInterRoundUI() {
    return (<span>
      You can <button onClick={(e) => this.continueFight()} className='fight_button'>Fight</button>,
      or you can
    <button className='run_away_button' onClick={(e) => this.maybeFlee()}>FLEE</button>,
    </span>);
  }

  componentDidMount() {
    if (this.state.logEntries.length === 0) {
      this.pushEntry(this.makeInterRoundUI(), true);
    }
  }

  monsterUI(monsterBaseCard) {
    let fakeCard = Card.Of({ game_card: monsterBaseCard.getDb() });
      return (<div>
        You are fighting a level {monsterBaseCard.getLevel()} <b>{monsterBaseCard.getDisplayName()}</b>
        <br />
        <CardDetail card={fakeCard} baseCards={this.props.baseCards} />
      </div>);
  }

  weaponUI(weaponCard) {
      return <span><b>Your weapon:</b><span>{weaponCard ? weaponCard.terselyDescribe() : 'None'}</span></span>
  }

  
  armorUI(armorCard) {
    return <span><b>Your armor:</b><span>{armorCard ? armorCard.terselyDescribe() : 'None'}</span></span>
}

showScenario(monsterBaseCard, weaponCard, armorCard) {
  return (<div>
    {this.weaponUI(weaponCard)}
    <br/>
    {this.armorUI(armorCard)}
    <hr/>
    {this.monsterUI(monsterBaseCard)}

  </div>);
}

showLog() {
  let entries = [];
  // not done with .map() for finer control and debugging and to walk parallel arrays
  for (let i = 0; i < this.state.logEntries.length; i++) {
    let entry = this.state.logEntries[i];
    let ephemeral = this.state.isEphemeral[i];
    if (ephemeral && (i !== 0)) continue;
    entries.push(<li key={`li_${i}`}>{entry}</li>)
  }
  return <ul className='fight_log_rows'>
    {entries}
  </ul>
}

  render() {
    let monsterBaseCard = this.props.baseCards[this.props.room && this.props.room.monster_card_id ? this.props.room.monster_card_id : 0];
    let weaponId = this.props.room.weapon_id;
    let weaponCard = null;
    if (weaponId) {
      weaponCard = this.props.deck.find((bc) => bc.getId() === weaponId)
    }
    let armorId = this.props.room.armor_id;
    let armorCard = null;
    if (armorId) {
      armorCard = this.props.deck.find((bc) => bc.getId() === armorId)
    }
    
    return (<div>
      <table>
        <tbody>
          <tr>
            <td style={{'verticalAlign' : 'top'}}>
            {this.showScenario(monsterBaseCard, weaponCard, armorCard)}
            </td>
            <td style={{'verticalAlign' : 'top'}}>
              {this.showLog()}
            </td>
          </tr>
        </tbody>
      </table>

    </div>)
  }
}
export default FightPage;