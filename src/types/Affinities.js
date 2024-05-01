// must match those on the be 
export const Affinities = {
    NONE: 0,
    EARTH: 1,
    AIR: 2,
    FIRE: 3,
    ICE: 4,
};

var labelDict = {};
labelDict[Affinities.NONE] = 'None';
labelDict[Affinities.EARTH] = 'Earth';
labelDict[Affinities.AIR] = 'Air';
labelDict[Affinities.FIRE] = 'Fire';
labelDict[Affinities.ICE] = 'Ice';

var affinityByName = {};
Object.entries(labelDict).forEach((tuple) => {
    let key = tuple[0];
    let val = tuple[1];
    affinityByName[val.toLowerCase()] = key;
    affinityByName[val.toUpperCase()] = key;
    affinityByName[val] = key;
})
export const AffinityByName = affinityByName;

export const AffinityLabels = labelDict;

export const AffinityLevels = {
    0: 'None',
    1: 'Novice',
    2: 'Apprentice',
    3: 'Adept',
    4: 'Expert',
    5: 'Master',
    6: 'Grand Master'
};
