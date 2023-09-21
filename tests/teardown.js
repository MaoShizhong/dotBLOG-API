require('dotenv').config();
const mongoose = require('mongoose');
const { Post } = require('../dist/models/Post');
const { Comment } = require('../dist/models/Comment');
const { User } = require('../dist/models/User');

module.exports = async () => {
    try {
        await Promise.all([
            User.findByIdAndDelete('65068c32be2fd5ade9800662').exec(),
            Post.deleteMany({
                _id: { $in: ['65068b879df45e6e50921c78', '650694ce8d33ac7cc559e27e'] },
            }).exec(),
            Post.deleteMany({ text: { $eq: ['test', 'test2'] } }).exec(),
            Comment.deleteMany({
                _id: {
                    $in: [
                        '650884f8d099ae8404f13ffc',
                        '650884f8d099ae8404f13ffd',
                        '650884f8d099ae8404f13ffe',
                    ],
                },
            }).exec(),
            Comment.deleteMany({ text: { $eq: ['test', 'test2'] } }).exec(),
            User.deleteMany({
                _id: { $in: ['650884f8d099ae8404f13ffb', '65089c3cd099ae8404f14052'] },
            }).exec(),
        ]);

        await mongoose.connect(process.env.CONNECTION_STRING);
        console.info('Teardown complete');
    } catch (error) {
        console.error(error);
        await mongoose.connect(process.env.CONNECTION_STRING);
        process.exit(1);
    }
};
