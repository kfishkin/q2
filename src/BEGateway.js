import { BaseCard } from "./BaseCard";
class BEGateway {
    constructor(beURI, pile) {
        this.beURI = beURI;
        this.pile = pile;
    }

    getURI() {
        return this.beURI;
    }

    setURI(newURI) {
        this.beURI = newURI;
    }

    /**
     * Checks if a player exists with the given handle and password.
     * If true, resolves to { handle, name, gameId }
     */
    async playerExists(handle, password) {
        console.log(`checking if ${handle} player exists`);
        // TODO: SALT/encrypt password
        const url = this.beURI
            + "players/" + handle
            + "?pwd=some_password";
        const response = await fetch(url, { mmmmode: 'no-cors' });
        console.log('playerExists: response = ' + response + ' ok = ', response.ok);
        return response.json();
    }

    /**
     * Gets a suggested game name. Resolves to a string
     */
    async suggestGameName() {
        const url = this.beURI
            + "games/name";
        const response = await fetch(url);
        console.log('suggestGameName: response = ' + response + ' ok = ', response.ok);
        return response.text();
    }

    async enterRoom(gameId, row, col, playerId) {
        const url = this.beURI
            + "rooms/enter";
        let body = {
            gameId: gameId,
            playerId: playerId,
            row: row,
            col: col
        };
        //console.log(`body = ${JSON.stringify(body)}`);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        const response = await fetch(url, requestOptions);
        console.log('enterRoom: response = ' + response + ' ok = ', response.ok);
        return response.json();
    }

    async lootRoom(gameId, ownerId, playerId) {
        const url = this.beURI
            + "rooms/loot";
        let body = {
            gameId: gameId,
            ownerId: ownerId,
            playerId: playerId
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        const response = await fetch(url, requestOptions);
        console.log(`lootRoom: response = ${JSON.stringify(response)} ok = ${response.ok}`);
        return response.json();
    }

    /**
     * Creates a new game. Returns the game object as a dict.
     */
    async createGame(name, playerId) {
        const url = this.beURI
            + "games";
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, playerId: playerId })
        }
        let response = await fetch(url, requestOptions);
        console.log('createGame: response = ' + response + ' ok = ', response.ok);
        if (!response.ok) return response;
        response = await response.json();
        // TODO: maybe this shouldn't be an array?
        let gameObj = response[0];
        console.log(`adding game w/id ${gameObj._id} to pile`);
        this.pile.add(gameObj._id, gameObj, 'game');
        return gameObj;
    }

    async createPlayer(handle, displayName, email, password) {
        const url = this.beURI
            + "players";
        var newPlayerData = {
            handle: handle,
            password: password,
            email: email,
            name: displayName
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlayerData)
        };
        const response = await fetch(url, requestOptions).catch((e) => {
            console.errpr(`createPlayer fetch exception ${e}`);
            return {};
        });

        return response.ok ? response.json() : {};
    }

    async getGameInfo(gameId) {
        const url = this.beURI
            + "games/" + gameId;
        const response = await fetch(url);
        if (!response) {
            console.log("beGateway.getGameInfo: null response");
            return null;
        } else {
            let gameObj = await response.json();
            this.pile.add(gameObj._id, gameObj, 'game');
            return gameObj;
        }
    }


    async getGamesFor(playerId) {
        const url = this.beURI
            + "games/"
            + "player/" + playerId;
        const response = await fetch(url);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't get games for ${playerId}`);
        } else {
            return response.json();
        }
    }

    async setPlayerCurrentGame(playerId, gameId) {
        const url = this.beURI
            + "players/" + playerId
            + "/currentgame/" + gameId;
        const requestOptions = {
            method: 'PUT',
        };
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't set player ${playerId} current game to ${gameId}`);
        } else {
            return response.json();
        }
    }

    async deleteGame(gameId) {
        const url = this.beURI
            + "games/" + gameId;
        const requestOptions = {
            method: 'DELETE',
        };
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't set delete game ${gameId}`);
        } else {
            this.pile.remove(gameId);
            return response.json();
        }
    }

    async oldGetPlayerCardsForGame(gameId, playerId) {
        const url = this.beURI
            + "cards/" + gameId
            + "/player/" + playerId;
        const requestOptions = {
            method: 'GET',
        };
        console.log(`getCardsForGame: url = ${url}`);
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't get cards for game {$gameId} player ${playerId}`);
        } else {
            // map from an array of DB records to an array of class objects.
            return response.json();
        }
    }

    async getPlayerCardsForGame(gameId, playerId) {
        const url = this.beURI
            + "cards/" + gameId
            + "/player/" + playerId;
        const requestOptions = {
            method: 'GET',
        };
        console.log(`getCardsForGame: url = ${url}`);
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't get cards for game {$gameId} player ${playerId}`);
        } else {
            return response.json();
        }
    }

    async getBaseCardsFor(gameId) {
        const url = this.beURI
            + "gamecards/" + gameId;
        const requestOptions = {
            method: 'GET',
        };
        console.log(`getBaseCardsFor: url = ${url}`);
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't get game cards for game {$gameId}`);
        } else {
            let baseCards = await response.json();
            if (baseCards) {
                baseCards.forEach((baseCard) => {
                    // put the _objects_, not the db record...
                    let obj = BaseCard.make(baseCard.type, baseCard);
                    this.pile.add(baseCard._id, obj, 'base card');
                });
            }
            return baseCards;
        }
    }

    async getTightMoneyOption(gameId, amount) {
        const url = this.beURI
            + "cards/" + gameId
            + "/makemoney/" + amount;
        const requestOptions = {
            method: 'GET',
        };
        console.log(`getTightMoneyOption: url = ${url}`);
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't getTightMoneyOption for game {$gameId}`);
        } else {
            return response.json();
        }
    }

    async tightenMoney(gameId, playerId) {
        const url = this.beURI
            + "cards/tighten_money";
        let body = {
            gameId: gameId,
            playerId: playerId
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        const response = await fetch(url, requestOptions);
        console.log(`fe.tigten money: fetch returns ${response}`);
        return response.ok ? response : null;
    }

    async breakMoney(gameId, playerId, from, to) {
        const url = this.beURI
            + "cards/break_money";
        let body = {
            gameId: gameId,
            playerId: playerId,
            from: from,
            to: to
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        const response = await fetch(url, requestOptions);
        console.log(`fe.break money: fetch returns ${response}`);
        return response;
    }

    // player (playerId) in game (gameId) wants to buy the cards with the given IDs
    // from (ownerId)
    async buy(gameId, playerId, ownerId, cardIds) {
        const url = this.beURI
            + "cards/buy";
        let body = {
            gameId: gameId,
            playerId: playerId,
            ownerId: ownerId,
            cardIds: cardIds
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(url, requestOptions);
            console.log(`fe.buy: fetch returns ${response}`);
            return response;
        } catch (e) {
            return e;
        }
    }

    // player (playerId) in game (gameId) wants to sell the cards with the given IDs
    // to (merchantId)
    async sell(gameId, playerId, merchantId, cardIds) {
        const url = this.beURI
            + "cards/sell";
        let body = {
            gameId: gameId,
            playerId: playerId,
            merchantId: merchantId,
            cardIds: cardIds
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(url, requestOptions);
            console.log(`fe.buy: fetch returns ${response}`);
            return response;
        } catch (e) {
            return Promise.reject(e.name + ":" + e.message);
        }
    }    

    // in game (gameId), can player (playerId), use machine (machineId),
    // where (piles) is the piles of input cards?
    // note the answer may change between when this is computed and when
    // you do it for realz.
    async canUse(gameId, playerId, machineId, piles) {
        const url = this.beURI
            + "cards/machine/canuse";
        let body = {
            gameId: gameId,
            playerId: playerId,
            machineId: machineId,
            piles: piles
        };
        const requestOptions = {
            method: 'PUT', // not POST because idempotent, not GET
              // because have arrays of arrays in the parameters.
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(url, requestOptions);
            console.log(`fe.canUse: fetch returns ${response}`);
            //console.log(`text = ${response.text()}`);
            //console.log(`body = ${response.body}`);

            // if it was bad, i need to find out why, this is in the body,
            // but sadly .text() returns a promise...
            let msg = await response.text();
            console.log(`msg = ${msg}`);
            return new Response(msg, {status: response.status, statusText: msg});
        } catch (e) {
            return Promise.reject(e.name + ":" + e.message);
        }        
    }

    // similar to (canUse), but actually tries to turn the crank.
    // if it succeeds, then the body is json indicating which caards were
    // deleted/added. If it fails, the body is text indicating why.
    async use(gameId, playerId, machineId, piles) {
        const url = this.beURI
            + "cards/machine/use";
        let body = {
            gameId: gameId,
            playerId: playerId,
            machineId: machineId,
            piles: piles,
            write: true
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(url, requestOptions);
            console.log(`fe.use: fetch returns ${response}`);
            if (response.ok) {
                console.log(`beG.use: 200 response, converting body to json`);
                return response.json();
            } else {
                let msg = await response.text();
                console.log(`beG.use: msg = ${msg}`);
                return new Response(msg, { status: response.status, statusText: msg });
            }
        } catch (e) {
            return Promise.reject(e.name + ":" + e.message);
        }
    }
}
export default BEGateway;