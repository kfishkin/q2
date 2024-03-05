import { BaseCard } from "./BaseCard";
class BEGateway {
    constructor(beURI, pile) {
        this.beURI = beURI;
        this.pile = pile;
        // keep around all the awards people have earned - this only
        // goes up, so can miss 'em, but won't have false positives.
        // THEN, when somebody loads cards, can stamp them as awards
        // if need be.
        this.awardsPerGamePerPlayer = {};
    }

    getURI() {
        return this.beURI;
    }

    setURI(newURI) {
        this.beURI = newURI;
    }


    async ackStory(gameId, playerId, storyId) {
        const url = this.beURI
            + "games/players/stories/ack";
        let body = {
            gameId: gameId,
            playerId: playerId,
            storyId: storyId
        };
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return Promise.reject(`couldn't ack story ${storyId}`);
        } else {
            return response.json();
        }
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
        if (!response.ok) {
            let msg = await response.text();
            return [msg];
        }
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
            console.error(`createPlayer fetch exception ${e}`);
            return {};
        });

        return response.ok ? response.json() : response.text();
    }

    async getCard(cardId) {
        const url = this.beURI
            + "cards/" + cardId;
        const response = await fetch(url);
        if (!response || !response.ok) {
            console.warn(`couldn't get card ${cardId}`);
            return {};
        } else {
            return response.json();
        }

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

    // side-effects into (cardDbs)
    stampCardsThatAreRewards(gameId, playerId, cardDbs) {
        if (!cardDbs) return;
        // TODO: could do this not per-player, but overall,
        // so the stuff the merchant has can still show as having
        // been your prize.
        let awards = this.localGetAwardsPerGamePerPlayer(gameId, playerId);
        if (!awards) return;
        // hash from the id of the card that was the prize to its award.
        let awardsByPrizeId = {};
        awards.forEach((award) => {
            if (!award.cards) return;
            award.cards.forEach((prize) => {
                //console.log(`prize ${prize} awarded by award ${JSON.stringify(award)}`);
                awardsByPrizeId[prize] = award;
            });
        });
        cardDbs.forEach((card) => {
            if (awardsByPrizeId[card._id]) {
                console.log(`winner: card ${JSON.stringify(card)} was/is a prize`);
                card.awardedFor = awardsByPrizeId[card._id];
            }
        })
    }

    localGetAwardsPerGamePerPlayer(gameId, playerId) {
        // if somebody else loads awards, they can do me a solid...
        let key = `${gameId}:${playerId}`;
        return this.awardsPerGamePerPlayer[key]
    }

    localSetAwardsPerGamePerPlayer(gameId, playerId, awards) {
        // if somebody else loads awards, they can do me a solid...
        let key = `${gameId}:${playerId}`;
        this.awardsPerGamePerPlayer[key] = awards;
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
            let cardDbs = await response.json();
            this.stampCardsThatAreRewards(gameId, playerId, cardDbs);
            return cardDbs;
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
            let cardDbs = await response.json();
            this.stampCardsThatAreRewards(gameId, playerId, cardDbs);
            return cardDbs;
        }
    }

    async getAwards(gameId, playerId) {
        const url = this.beURI
            + "games/" + gameId
            + "/players/" + playerId
            + "/awards";
        const requestOptions = {
            method: 'GET',
        };
        try {
            const response = await fetch(url, requestOptions);
            if (!response || !response.ok) {
                return [];
            } else {
                let val = await response.json();
                this.localSetAwardsPerGamePerPlayer(gameId, playerId, val);
                return val;
            }
        } catch (e) {
            console.error(e);
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

    async getNews(gameId, playerId) {
        const url = this.beURI + "games/" + gameId
            + "/players/" + playerId + "/unreadnews";
        const requestOptions = {
            method: 'GET',
        };
        const response = await fetch(url, requestOptions);
        //console.log(`getNewsCount: response = ${response}`);
        if (!response || !response.ok) {
            return [];
        }
        return response.json();
    }

    async getNewsCount(gameId, playerId) {
        const url = this.beURI + "games/" + gameId
            + "/players/" + playerId + "/unreadnewscount";
        const requestOptions = {
            method: 'GET',
        };
        const response = await fetch(url, requestOptions);
        //console.log(`getNewsCount: response = ${response}`);
        if (!response || !response.ok) {
            return 0;
        }
        return response.text();
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

    async getTrophies() {
        const url = this.beURI
            + "games/trophies";
        const requestOptions = {
            method: 'GET',
        };
        const response = await fetch(url, requestOptions);
        if (!response || !response.ok) {
            return [];
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

    // player (playerId) in game (gameId) wants to repair the cards with the given IDs
    async repair(gameId, playerId, cardIds) {
        const url = this.beURI
            + "cards/repair";
        let body = {
            gameId: gameId,
            playerId: playerId,
            cardIds: cardIds
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(url, requestOptions);
            if (!response.ok) {
                let txt = await response.text();
                return {
                    ok: false,
                    statusText: txt
                }
            }
            console.log(`fe.repair: fetch returns ${response}`);
            return response;
        } catch (e) {
            return Promise.reject(e.name + ":" + e.message);
        }
    }

    async seer(gameId, playerId, outlineCardId, stepBaseCardId, clueCardId) {
        const url = this.beURI
            + "cards/seer";
        let body = {
            gameId: gameId,
            playerId: playerId,
            outlineCardId: outlineCardId,
            stepBaseCardId: stepBaseCardId,
            clueCardId: clueCardId
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(url, requestOptions);
            if (response.ok) {
                return response.json();
            } else {
                let msg = await response.text();
                // it's an object which isn't 'ok', with a status text
                return {
                    ok: false,
                    errorText: msg
                }
            }
        } catch (e) {
            console.log(`seer e: ${e.name}:${e.message} ${e.stack}`);
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
            // if it was bad, i need to find out why, this is in the body,
            // but sadly .text() returns a promise...
            let msg = await response.text();
            console.log(`msg = ${msg}`);
            return new Response(msg, { status: response.status, statusText: msg });
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
            if (response.ok) {
                console.log(`beG.use: 200 response, converting body to json`);
                return response.json();
            } else {
                let msg = await response.text();
                console.log(`beG.use: msg = ${msg}`);
                // it's an object which isn't 'ok', with a status text
                return {
                    ok: false,
                    errorText: msg
                }
                //return new Error(msg);
            }
        } catch (e) {
            return Promise.reject(e.name + ":" + e.message);
        }
    }

    async runaway(gameId, playerId, row, col) {
        const url = this.beURI
            + "rooms/runaway";
        let body = {
            gameId, playerId, row, col
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        const response = await fetch(url, requestOptions);
        console.log(`fe.runaway: fetch returns ${response}`);
        if (response.ok) {
            return response.json();
        } else {
            let msg = await response.text();
            return {
                ok: false,
                statusText: msg
            }
        }

    }

    async fight(gameId, playerId, row, col, armorId, weaponId) {
        const url = this.beURI
            + "rooms/fight";
        let body = {
            gameId, playerId, row, col
        };
        if (armorId) {
            body.armorId = armorId;
        }
        if (weaponId) {
            body.weaponId = weaponId;
        }
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        try {
            const response = await fetch(url, requestOptions);
            console.log(`fe.fight: fetch returns ${response}`);
            if (response.ok) {
                console.log(`beG.fight: 200 response, converting body to json`);
                let dict = await response.json();
                dict.ok = true;
                // if they got loot, convert it to card db objs so can display.
                if (dict.loot && dict.loot.length > 0) {
                    console.log(`beG.fight: converting loot ids ${JSON.stringify(dict.loot)} to cards`);
                    let newDeck = await this.getPlayerCardsForGame(gameId, playerId);
                    let newLoot = newDeck.filter((c) => dict.loot.some((lootId) => lootId === c._id));
                    //console.log(`newLoot has length ${newLoot.length}, old has length ${dict.loot.length}`);
                    dict.loot = newLoot;
                }
                return dict;
            } else {
                let msg = await response.text();
                console.log(`beG.fight: msg = ${msg}`);
                // it's an object which isn't 'ok', with a status text
                return {
                    ok: false,
                    statusText: msg
                }
            }
        } catch (e) {
            return Promise.reject(e.name + ":" + e.message);
        }
    }

    async getArtisanPrices(gameId) {
        const url = this.beURI
            + "games/" + gameId
            + "/costs";
        const requestOptions = {
            method: 'GET',
        };
        const response = await fetch(url, requestOptions);
        return response.json();
    }

}
export default BEGateway;