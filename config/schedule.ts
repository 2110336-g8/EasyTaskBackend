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
        console.log('Log: Checking for tasks with end date equal to today');
        const today = new Date();
        today.setHours(23, 59, 0, 0);
        //task that endDate = today and status = Open
        const tasks = await tasksService.getTasksForNotiEndApply(today);
        if (tasks && tasks.length > 0) {
            for (const task of tasks) {
                await notiService.notiEndDateTask(task);
            }
        }
    } catch (error) {
        console.error('Error occurred while checking tasks:', error);
    }
});
