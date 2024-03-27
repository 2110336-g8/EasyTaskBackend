import cron from 'node-cron';
import Container from 'typedi';
import { OtpService } from '../services/OtpService';
import { TasksService } from '../services/TasksService';
import { NotiService } from '../services/NotiService';
const otpService = Container.get(OtpService);
const tasksService = Container.get(TasksService);
const notiService = Container.get(NotiService);

cron.schedule('0 * * * *', () => {
    console.log('Log: Remove trash OTP');
    otpService.deleteTrashOtp();
});

// every day at 23:59
cron.schedule('59 23 * * *', async () => {
    try {
        console.log(
            'Log: Checking for tasks with end date equal to today or six days ago',
        );

        const today = new Date();
        today.setHours(23, 59, 0, 0);

        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
        sixDaysAgo.setHours(23, 59, 0, 0);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(23, 59, 0, 0);

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
