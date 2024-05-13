import React from 'react';
import StatusMessage from './StatusMessage';
import { Affinities, AffinityLabels } from './types/Affinities';
import { APP_PAGES } from './config/AppPages';
import { Progress } from 'antd';

// props
// beGateway
// board
// gameId
// playerId
// baseCards
// onReloadPlayerState
// showPageFunc
class AwayPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statusMessage: null,
      statusType: 'info',
    }
  }

  renderRooms(affinity, rooms) {
    const renderRoom = (affinity, room) => {
      let title = `Room ${room.ordinality + 1} in the ${AffinityLabels[affinity]} biome`;
      let url = `pix/biomes/${affinity}_${room.is_alive ? 'unknown' : 'empty'}.png`;
      if (room.is_alive && room.is_known) { // too subtle to see the diffeence is known and !alive.
        let baseId = room.monster_card_id;
        let baseCard = this.props.baseCards[baseId];
        if (baseCard) {
          url = baseCard.descriptionBackgroundImageURL();
          title = baseCard.getDisplayName();
        }
      }
      const onEnterRoom = (affinity, room) => {
        if (!room.is_alive) return;
        console.log(`start a fight in affinity ${affinity} room # ${room.ordinality}`);
        this.setState({statusMessage: 'entering the room...', statusType: 'info'});
        this.props.beGateway.enterRoom(this.props.gameId, this.props.playerId, affinity, room.ordinality).then((v) => {
          console.log(`onEnterRoom: v = ${JSON.stringify(v)}`);
          if (!('is_alive' in v)) {
            this.setState({statusMessage: `couldn't enter the room: ${v}`, statusType: 'error'});
          } else if (!v.is_alive) {
            this.setState({statusMessage: 'empty room', statusType: 'info'});
          } else {
            this.setState({statusMessage: 'a fight begins!', statusType: 'info'});
            // state has changed on BE, get FE to realize it...
            this.props.onReloadPlayerState();
            this.props.showPageFunc(APP_PAGES.FIGHT_START_PAGE, {});
          }

        })
      }
      return <td><img onClick={(e) => onEnterRoom(affinity, room)} className='board_room' src={url} alt={title} title={title}/></td>
    }
    return <table>
    <tbody>
      <tr>
        {rooms.map((room) => renderRoom(affinity, room))}
      </tr>
      </tbody>
    </table>
  }

  renderSweepitude(zone) {
    if (!zone || !zone.rooms) return '';
    let numRooms = zone.rooms.length;
    let cleared = zone.rooms.filter((room) => !room.is_alive).length;
    if (cleared === 0) return '';
    let percent = Math.floor((cleared * 100) / numRooms);
    return <Progress
      percent={percent}
      status={percent >= 100 ? 'success' : 'active'}
      type='line'
      showInfo={false}
      steps={numRooms}
      strokeColor={percent >= 100 ? 'limegreen' : 'dodgerblue'}
      title={`${cleared}/${numRooms} for clean sweep`}
    />;
  }

  renderZone(zone) {
    return (<div>
      <span>--- The {AffinityLabels[zone.affinity]} biome {this.renderSweepitude(zone)} ---</span>
      <br/>
      {this.renderRooms(zone.affinity, zone.rooms)}
    </div>);
  }

  render() {
    let board = this.props.board;
    // a 2 by 2 matrix. I like doing this with tables....
    // NE: earth,
    // NE: fire
    // SW: ice
    // SE: air
    let nwZone = board.zones.find((zone) => zone.affinity === Affinities.EARTH);
    let neZone = board.zones.find((zone) => zone.affinity === Affinities.FIRE);
    let swZone = board.zones.find((zone) => zone.affinity === Affinities.ICE);
    let seZone = board.zones.find((zone) => zone.affinity === Affinities.AIR);
    let allDead = board.zones.every((zone) => 
      zone.rooms.every((room) => !room.is_alive));
    let intro = allDead ? `You've swept every zone clean! When ready, hit 'go home' and collect your loot.` : "The cards with '?' on them represent the 'front lines' of your adventuring. Pick one to fight the monster in it. If you clear all the rooms in a biome on this trip, you get a 'clean sweep' prize";
    return (<div>
      <p>{intro}
      </p>
      {this.state.statusMessage ? <StatusMessage message={this.state.statusMessage} type={this.state.statusType}/> : ''}
      <table>
        <tbody>
          <tr>
            <td>{this.renderZone(nwZone)}</td>
            <td>{this.renderZone(neZone)}</td>
          </tr>
          <tr>
          <td>{this.renderZone(swZone)}</td>
            <td>{this.renderZone(seZone)}</td>
          </tr>
        </tbody>
      </table>
      </div>);
  }
}

export default AwayPage;