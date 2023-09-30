"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepPopulateFromLevelTwo = exports.deepPopulateFromLevelOne = void 0;
exports.deepPopulateFromLevelOne = {
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
exports.deepPopulateFromLevelTwo = {
    path: 'replies',
    options: { projection: '-isReply', sort: { timestamp: -1 } },
    populate: [
        {
            path: 'commenter',
            options: { projection: 'username avatar fontColour' },
        },
    ],
};
