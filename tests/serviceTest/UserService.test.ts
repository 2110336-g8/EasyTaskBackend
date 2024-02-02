import { UsersRepository } from '../../repositories/UsersRepo';
import { UsersService } from '../../services/UsersService';
import { fakeRepo } from '../repositoryTest/FakeRepo';

describe('UsersService', () => {
    const fakeUserRepo = {
        ...fakeRepo,
        findOneByEmail: jest.fn(),
        isValidPassword: jest.fn(),
    };
    const fakeOtpRepo = {
        ...fakeRepo,
        findOneByEmail: jest.fn(),
        isValidOtp: jest.fn(),
    };
    const usersService = new UsersService(fakeUserRepo, fakeOtpRepo);

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should create user if otp is verified', async () => {
        const userData = {
            firstName: 'John',
            lastName: 'Cena',
            email: 'john.cena@gmail.com',
            password: '12345678',
        };

        const userDoc = {
            _id: 'some object id',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...userData,
        };

        const otpDoc = {
            email: 'john.cena@gmail.com',
            isVerified: 'true',
        };

        fakeUserRepo.create.mockResolvedValue(userDoc);
        fakeOtpRepo.findOneByEmail.mockResolvedValue(otpDoc);

        const createdUser = await usersService.createUser(userData);
        expect(fakeUserRepo.create).toHaveBeenCalledWith(userData);
        expect(createdUser.firstName).toBe(userData.firstName);
        expect(createdUser.lastName).toBe(userData.lastName);
        expect(createdUser.email).toBe(userData.email);
        expect(createdUser.password).not.toBeNull();
    });
});
