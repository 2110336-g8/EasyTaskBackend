import { Service } from 'typedi';
import { BaseMongooseRepository, IRepository } from './BaseRepo';
import {
    ChatRoomModel,
    IChatRoom,
    IChatRoomDocument,
} from '../models/ChatModel';
import { FilterQuery, Query } from 'mongoose';

export interface IChatRoomsRepository extends IRepository<IChatRoom> {
    find(q: FilterQuery<IChatRoom>): Promise<IChatRoomDocument[]>;
}

@Service()
export class ChatRoomsRepository
    extends BaseMongooseRepository<IChatRoom>
    implements IChatRoomsRepository
{
    constructor() {
        super(ChatRoomModel);
    }

    find = async (q: FilterQuery<IChatRoom>): Promise<IChatRoomDocument[]> => {
        const chatRooms = await this._model.find(q);
        return chatRooms;
    };
}
