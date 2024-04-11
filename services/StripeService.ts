import { Service } from "typedi";

export interface IStripeService {
    // createCharge: (taskId: string) => Promise<IChargeDocument>;
}

@Service()
export class StripeService implements IStripeService {
    // private otpRepository: IOtpRepository;
    // private usersRepository: IUsersRepository;

    // constructor(
    //     @Inject(() => OtpRepository)
    //     otpRepository: IOtpRepository,
    //     @Inject(() => UsersRepository)
    //     usersRepository: IUsersRepository,
    // ) {
    //     this.otpRepository = otpRepository;
    //     this.usersRepository = usersRepository;
    // }

    // createCharge = async (taskId: string): Promise<IChargeDocument> => {
    //     try {
            
    //         return otpDoc;
    //     } catch (error) {
    //         throw error;
    //     }
    // };

}
