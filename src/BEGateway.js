
class BEGateway {
    constructor(beURI) {
        this.beURI = beURI;
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
        const response = await fetch(url, {mmmmode: 'no-cors'});
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
        const response = await fetch(url, requestOptions);
        console.log('createGame: response = ' + response + ' ok = ', response.ok);
        return response.json();
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
            console.log(`createPlayer fetch exception ${e}`);
            return {};

        } );

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
            return response.json();
        }
    }

    async getRawIngredients(gameId) {
        //gameId = '65ad65ec51b75ebe7c620707';
        const url = this.beURI 
        + "craftables/game/" + gameId
        + "?raw=1";
        const response = await fetch(url);
        return response.json();
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

    async getGameCardsFor(gameId) {
        const url = this.beURI 
        + "gamecards/" + gameId;
        const requestOptions = {
            method: 'GET',
        };
        console.log(`getGameCardsFor: url = ${url}`);
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't get game cards for game {$gameId}`);
        } else {
            return response.json();
        }          

    }
}
export default BEGateway;