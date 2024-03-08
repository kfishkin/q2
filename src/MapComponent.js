import React from 'react';
import {NAV_ITEM_PAGES} from './NavMenuItemComponent';


// props
// map - the map to render
// showPageFunc - invoke to show a different page in the UI.
// gameId - gameId.
// playerId - playerId
// beGateway
// onPlantFlag(row, col) - map[row][col] is now traversable.
class MapComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  // you can visit any room which is traversable, or 1 away from a traversable.
  computeReach() {
    let map = this.props.map;
    let stack = []; // (row, col) to explore out from.
    for (let row = 0; row < map.height; row++) {
      let rooms = map.rooms[row];
      for (let col = 0; col < map.width; col++) {
        // TODO: make this an attribute, not kludged:
        let room = rooms[col];
        if (room.per_player_info && room.per_player_info.traversable) {
          //console.log(`[${row}, ${col}] is traversable`);
          room.reachable = true;
          stack.push([row, col]);
        }
      }
    }
    // explore ye olde stacke. Stack are places known to be reachable.
    while (stack.length > 0) {
      let tuple = stack.shift();
      let meRow = tuple[0];
      let meCol = tuple[1];
      //console.log(`popped [${meRow}, ${meCol}] is traversable`);
      // let room = map.rooms[meRow][meCol];
      for (let row = meRow - 1; row <= meRow + 1; row++) {
        if (row < 0 || row >= map.height) continue;
        for (let col = meCol - 1; col <= meCol + 1; col++) {
          if (col < 0 || col >= map.width) continue;
          if (!map.rooms[row][col].reachable) {
            map.rooms[row][col].reachable = true;
            //console.log(`can reach ${row},${col} from ${meRow}, ${meCol}`);
            // only go to depth 1, don't push...
            //stack.push([row, col]);
          }

        }
      }
    }
  }

  render() {
    let map = this.props.map;
    if (!map || map.length === 0) {
      return <div>No map.</div>
    }
    let width = map.width || 0;
    let height = map.height || 0;
    this.computeReach();
    let rows = []; // react nodes, one per row

    let showPageFunc = this.props.showPageFunc;

    let enterRoom = ((gameId, row, col, x, y, playerId) => {
      let ok = window.confirm(`go to room @ (${x}, ${y}) ?`);
      if (ok) {
        this.props.beGateway.enterRoom(gameId, row, col, playerId)
          .then((v) => {
            console.log(`back from beG.enterRom, v = ${JSON.stringify(v)}`);
            let code = v[0];
            let owner = null;
            // v[1] will have more info....
            switch (code) {
              case 'EMPTY':
                this.props.onPlantFlag(row, col);
                window.confirm('The room is empty');
                break;
              case 'LOOT':
                //window.confirm("You may have found some treasure!");
                owner = v[1]; // the pseudo-player who owns the loot.
                this.props.onPlantFlag(row, col);
                showPageFunc(NAV_ITEM_PAGES.LOOT_PAGE, { owner: owner });
                break;
              case 'MERCHANT':
                owner = v[1];
                showPageFunc(NAV_ITEM_PAGES.MERCHANT_PAGE, { owner: owner });
                break;
              case 'MONSTER':
                //window.confirm('there is a monster here!');
                showPageFunc(NAV_ITEM_PAGES.FIGHT_PAGE, { row, col});
                break;
              case 'UNREACHABLE':
                window.alert('you can\'t reach that room?');
                break;
              default:
                window.alert(`unknown code: ${code}`);
                break;
            }
          }).catch((e) => {
            console.log(`error on be.enterRoom: ${e}`);
          })

      }
    });

    for (let row = 0, y = (height >> 1); row < height; row++, y--) {
      let label = <span><b>{y}: </b></span>
      let cols = []; // react nodes, one per room
      let rooms = map.rooms[row];
      for (let col = 0, x = -(width >> 1); col < width; col++, x++) {
        let room = rooms[col];
        let reachable = room.reachable;
        let reachableStyle = reachable ? "yes" : "no";
        let per_player_message = room.per_player_info && room.per_player_info.description ? room.per_player_info.description : "";
        let elt = null;
        let mapLabel =  (room.per_player_info && room.reachable && room.per_player_info.traversable) ? room.title : '???';
        // kludge for display...
        if (mapLabel === 'Empty')
          mapLabel = '---';
        // and another....
        if (per_player_message.toLowerCase().startsWith('you defeated a') && mapLabel === '---') {
          mapLabel = '-v-';
        }
        if (reachable) {
          elt = <button className='map_room_button' reachable="yes" title={per_player_message} onClick={(e) => enterRoom(this.props.gameId, row, col, x, y, this.props.playerId)}>{mapLabel}</button>
        } else {
          elt = <button className='map_room_button' disabled="disabled" reachable={reachableStyle} title={per_player_message}>{mapLabel}</button>
        }

        cols.push(elt);
      }
      rows.push(<li><span>{label}  </span>{cols}</li>)
    }
    let fireDict = {'backgroundImage': 'url(\'./pix/biomes/fire.png\')'};
    return <div className='map_display'>
      <div className='map_rooms_display'>
        <span className='map_biome_label' style={{'backgroundImage': "url('./pix/biomes/earth_50transparent.png')"}}>{'earth'.concat('_'.repeat(30))}</span>
        <span className='map_biome_label' style={fireDict}>{'_'.repeat(30).concat('Fire')}</span>
        <ul className='map_room_rows'>{rows}</ul>
        <span className='map_biome_label' style={{'backgroundImage': "url('./pix/biomes/ice.png')"}}>{'ice'.concat('_'.repeat(30))}</span>
        <span className='map_biome_label' style={{'backgroundImage': "url('./pix/biomes/air.png')"}}>{'_'.repeat(30).concat('Air')}</span>
      </div>
<br/>
<br/>
    </div>
  }
}
export default MapComponent;
