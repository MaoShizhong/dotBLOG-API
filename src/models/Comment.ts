import { Schema, Types, model } from 'mongoose';

export type CommentModel = {
    _id?: Types.ObjectId;
    commenter: Types.ObjectId;
    post: Types.ObjectId;
    timestamp: Date;
    text: string;
};

const CommentSchema = new Schema<CommentModel>(
    {
        commenter: { type: Schema.Types.ObjectId, rel: 'User', required: true },
        post: { type: Schema.Types.ObjectId, rel: 'Post', required: true },
        timestamp: { type: Date, required: true },
        text: { type: String, required: true },
    },
    { versionKey: false }
);

export const Comment = model<CommentModel>('comment', CommentSchema);
