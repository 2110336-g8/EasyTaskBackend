import { Inject, Service } from 'typedi';
import {
    IChatRoomsService,
    ChatRoomsService,
} from '../services/ChatRoomsService';

@Service()
export class ChatRoomsController {
    private chatRoomsService: IChatRoomsService;

    constructor(
        @Inject(() => ChatRoomsService) chatRoomsService: IChatRoomsService,
    ) {
        this.chatRoomsService = chatRoomsService;
    }

    
}
