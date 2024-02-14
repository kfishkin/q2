import React from 'react';
import { LOOT_PAGE, MERCHANT_PAGE } from './NavMenu';


// props
// map - the map to render
// showPageFunc - invoke to show a different page in the UI.
// gameId - gameId.
// playerId - playerId
// beGateway
// onLoadMap() - BE map has changed.
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
          console.log(`[${row}, ${col}] is traversable`);
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
      console.log(`popped [${meRow}, ${meCol}] is traversable`);
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
                this.props.onLoadMap(); // empty room is now traversable.
                window.confirm('The room is empty');
                break;
              case 'LOOT':
                window.confirm("You may have found some treasure!");
                owner = v[1]; // the pseudo-player who owns the loot.
                this.props.onLoadMap();
                showPageFunc(LOOT_PAGE, { owner: owner });
                break;
              case 'MERCHANT':
                owner = v[1];
                showPageFunc(MERCHANT_PAGE, { owner: owner });
                break;
              default:
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
        let mapLabel = room.per_player_info && room.reachable ? room.title : ("???");
        // kludge for display...
        if (mapLabel === 'Empty')
          mapLabel = '---';
        if (reachable) {
          elt = <button className='map_room_button' reachable="yes" title={per_player_message} onClick={(e) => enterRoom(this.props.gameId, row, col, x, y, this.props.playerId)}>{mapLabel}</button>
        } else {
          elt = <button className='map_room_button' disabled="disabled" reachable={reachableStyle} title={per_player_message}>{mapLabel}</button>
        }
        /*
        if (room.owner && room.owner.type === PlayerTypes.MERCHANT) {
          elt=<button reachable={reachableStyle} title={per_player_message} onClick={(e) => gotoShop(room.owner)} disabled={!reachable}>{room.owner.name}'s {mapLabel}</button>
        } else {
          elt=<span reachable={reachableStyle} title={per_player_message}>&nbsp;{mapLabel}&nbsp;</span>
        } 
        */

        cols.push(elt);
      }
      rows.push(<li><span>{label}  </span>{cols}</li>)
    }
    let fireDict = {'background-image': 'url(\'./pix/biomes/fire.png\')'};
    return <div className='map_display'>
      <div className='map_rooms_display'>
        <span className='map_biome_label' style={{'background-image': "url('./pix/biomes/earth_50transparent.png')"}}>{'earth'.concat('_'.repeat(30))}</span>
        <span className='map_biome_label' style={fireDict}>{'_'.repeat(30).concat('Fire')}</span>
        <ul className='map_room_rows'>{rows}</ul>
        <span className='map_biome_label' style={{'background-image': "url('./pix/biomes/ice.png')"}}>{'ice'.concat('_'.repeat(30))}</span>
        <span className='map_biome_label' style={{'background-image': "url('./pix/biomes/air.png')"}}>{'_'.repeat(30).concat('Air')}</span>
      </div>
<br/>
<br/>
    </div>
  }
}
/*
<img src='pix/biomes/earth.png' quadrant='nw' className='biome_pic' alt='' />
      <img src='pix/biomes/fire.png' quadrant='ne' className='biome_pic' alt='' />
      <img src='pix/biomes/ice.png' quadrant='sw' className='biome_pic'  alt=''/>
      <img src='pix/biomes/air.png' quadrant='se' className='biome_pic' alt='' /></div>
*/
export default MapComponent;
