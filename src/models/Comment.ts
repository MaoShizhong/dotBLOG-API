import { Schema, Types, model } from 'mongoose';

export type CommentModel = {
    _id?: Types.ObjectId;
    post: Types.ObjectId;
    commenter: Types.ObjectId;
    timestamp: Date;
    text: string[];
};

const CommentSchema = new Schema<CommentModel>(
    {
        post: { type: Schema.Types.ObjectId, rel: 'Post', required: true },
        commenter: { type: Schema.Types.ObjectId, rel: 'User', required: true },
        timestamp: { type: Date, required: true },
        text: { type: [String], required: true },
    },
    { versionKey: false }
);

export const Comment = model<CommentModel>('comment', CommentSchema);
