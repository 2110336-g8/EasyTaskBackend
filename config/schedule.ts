import cron from 'node-cron';
import Container from 'typedi';
import { OtpService } from '../services/OtpService';
import { TasksService } from '../services/TasksService';
import { NotiService } from '../services/NotiService';
import { WalletsService } from '../services/WalletsService';
import { UsersService } from '../services/UsersService';
import { IWalletDocument, WalletModel } from '../models/WalletModel';
const otpService = Container.get(OtpService);
const tasksService = Container.get(TasksService);
const notiService = Container.get(NotiService);
const walletService = Container.get(WalletsService);
const userService = Container.get(UsersService);

cron.schedule('0 * * * *', () => {
    console.log('Log: Remove trash OTP');
    otpService.deleteTrashOtp();
});

// every day at 23:59 (Thailand = GMT+7)
cron.schedule('59 16 * * *', async () => {
    try {
        console.log(
            'Log: Checking for tasks with end date equal to today or six days ago',
        );

        const today = new Date();
        today.setUTCHours(16, 59, 0, 0);

        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
        sixDaysAgo.setUTCHours(16, 59, 0, 0);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setUTCHours(16, 59, 0, 0);

        // Tasks that end today
        const endApplyTasks = await tasksService.getTasksForNotiEndApply(today);
        if (endApplyTasks && endApplyTasks.length > 0) {
            for (const task of endApplyTasks) {
                await notiService.notiEndDateTask(task);
            }
        }

        // Tasks that ended six days ago
        const EndedSixDaysAgoTasks =
            await tasksService.getTasksForNotiEndApply(sixDaysAgo);
        if (EndedSixDaysAgoTasks && EndedSixDaysAgoTasks.length > 0) {
            for (const task of EndedSixDaysAgoTasks) {
                await notiService.notiSixDayAfterEndApply(task);
            }
        }

        //dismiss task that customer don't start within 1 week after endDate
        const EndedSevenDaysAgoTasks =
            await tasksService.getTasksForNotiEndApply(sevenDaysAgo);
        if (EndedSevenDaysAgoTasks && EndedSevenDaysAgoTasks.length > 0) {
            for (const task of EndedSevenDaysAgoTasks) {
                await tasksService.dismissOpenTask(task.id);
            }
        }
    } catch (error) {
        console.error('Error occurred while checking tasks:', error);
    }
});

//uncomment this to create a wallet for all old users in your local system
// cron.schedule('5 * * * *', async () => {
//     console.log('Log: add wallet to old user');
//     const userIds = await userService.getAllUserIds();
//     for (const id of userIds) {
//         await walletService.createMissingWallet(id);
//     }
//     console.log('update successfully');
// });
