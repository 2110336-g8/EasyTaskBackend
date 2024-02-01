import cron from 'node-cron';
import Container from 'typedi';
import { OtpService } from '../services/OtpService';

const otpService = Container.get(OtpService);

cron.schedule('0 * * * *', () => {
    console.log('Log: Remove trash OTP');
    otpService.deleteTrashOtp();
});
