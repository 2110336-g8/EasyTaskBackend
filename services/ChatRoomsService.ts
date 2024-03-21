import { Inject, Service } from 'typedi';
import {
    ChatRoomsRepository,
    IChatRoomsRepository,
} from '../repositories/ChatRoomsRepo';
import { IChat, IChatRoom, IChatRoomDocument } from '../models/ChatModel';

export interface IChatRoomsService {
    createChatRoom: (taskId: string) => Promise<IChatRoom>;
    saveMessage: (
        chatRoomId: string,
        sender: string,
        message: string,
    ) => Promise<IChat>;
    getMessageHistory: (
        taskId: string,
        page: number,
        limit: number,
    ) => Promise<IChat[]>;
}

// @Service()
// export class ChatRoomsService implements IChatRoomsService {
//     private chatRoomsRepository: IChatRoomsRepository;
//     constructor(
//         @Inject(() => ChatRoomsRepository)
//         chatRoomsRepository: IChatRoomsRepository,
//     ) {
//         this.chatRoomsRepository = chatRoomsRepository;
//     }
// }
