export const deepPopulateFromLevelOne = {
    path: 'replies',
    options: { projection: '-isReply', sort: { timestamp: -1 } },
    populate: [
        {
            path: 'commenter',
            options: { projection: 'username avatar fontColour' },
        },
        {
            path: 'replies',
            options: { projection: '-isReply', sort: { timestamp: -1 } },
            populate: {
                path: 'commenter',
                options: { projection: 'username avatar fontColour' },
            },
        },
    ],
};

export const deepPopulateFromLevelTwo = {
    path: 'replies',
    options: { projection: '-isReply', sort: { timestamp: -1 } },
    populate: [
        {
            path: 'commenter',
            options: { projection: 'username avatar fontColour' },
        },
    ],
};
