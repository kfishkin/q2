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

export const AffinityLabels = labelDict;
