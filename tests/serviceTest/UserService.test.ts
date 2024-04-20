import { genSaltSync, hashSync } from 'bcrypt';
import { UsersService } from '../../services/UsersService';
import { fakeRepo } from '../mocks/FakeRepo';
import { IUser } from '../../models/UserModel';

describe('UsersService', () => {
    const mockUserRepo = {
        ...fakeRepo,
        findById: jest.fn(),
        findOneByEmail: jest.fn(),
        isValidPassword: jest.fn(),
        findUsers: jest.fn(),
        findUser: jest.fn(),
        findUserEmail: jest.fn(),
        addOwnedTasks: jest.fn(),
        addApplication: jest.fn(),
        updateApplicationStatus: jest.fn(),
        addTask: jest.fn(),
        updateTaskStatus: jest.fn(),
    };
    const mockOtpRepo = {
        ...fakeRepo,
        findOneByEmail: jest.fn(),
        isValidOtp: jest.fn(),
    };
    const mockImageRepo = {
        createImage: jest.fn(),
        getImageByKey: jest.fn(),
        deleteImage: jest.fn(),
        updateTaskImageUrl: jest.fn(),
        updateUserImageUrl: jest.fn(),
    };
    const usersService = new UsersService(
        mockUserRepo,
        mockOtpRepo,
        mockImageRepo,
    );

    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Create user', () => {
        it('Should create user if otp is verified', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Cena',
                email: 'john.cena@gmail.com',
                password: '12345678',
                applications: [],
                tasks: [],
                ownedTasks: [],
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
                verifiedAt: new Date(),
            };

            mockUserRepo.create.mockResolvedValue(userDoc);
            mockOtpRepo.findOneByEmail.mockResolvedValue(otpDoc);

            const createdUser = await usersService.createUser(userData);
            expect(mockUserRepo.create).toHaveBeenCalledWith(userData);
            expect(createdUser.firstName).toBe(userData.firstName);
            expect(createdUser.lastName).toBe(userData.lastName);
            expect(createdUser.email).toBe(userData.email);
            expect(createdUser.password).not.toBeNull();
            expect(createdUser.applications).toBe(userData.applications);
            expect(createdUser.tasks).toBe(userData.tasks);
            expect(createdUser.ownedTasks).toBe(userData.ownedTasks);
        });
    });

    describe('Update user password', () => {
        it('Should update user password successfully', async () => {
            const userEmail = 'john.cena@gmail.com';
            const userPassword = '12345678';
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            const expectedUser = {
                _id: 'some object id',
                firstName: 'John',
                lastName: 'Cena',
                email: userEmail,
                applications: [],
                tasks: [],
                ownedTasks: [],
            };

            mockUserRepo.isValidPassword.mockResolvedValue(expectedUser);
            mockUserRepo.update.mockResolvedValue(expectedUser);

            const updatedUser = await usersService.updatePassword(
                'some object id',
                userEmail,
                updatedPassword,
                userPassword,
            );
            expect(mockUserRepo.isValidPassword).toHaveBeenCalledWith(
                userEmail,
                userPassword,
            );
            expect(mockUserRepo.update).toHaveBeenCalledWith(
                'some object id',
                updatedPassword,
            );
            expect(updatedUser?._id).toBe(expectedUser._id);
            expect(updatedUser?.firstName).toBe(expectedUser.firstName);
            expect(updatedUser?.lastName).toBe(expectedUser.lastName);
            expect(updatedUser?.email).toBe(expectedUser.email);
            expect(updatedUser?.applications).toBe(expectedUser.applications);
            expect(updatedUser?.tasks).toBe(expectedUser.tasks);
            expect(updatedUser?.ownedTasks).toBe(expectedUser.ownedTasks);
        });
        it('Should return null if password is invalid', async () => {
            const userEmail = 'john.cena@gmail.com';
            const userPassword = '12345678';
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            mockUserRepo.isValidPassword.mockResolvedValue(null);

            const updatedUser = await usersService.updatePassword(
                'some object id',
                userEmail,
                updatedPassword,
                userPassword,
            );
            expect(mockUserRepo.isValidPassword).toHaveBeenCalledWith(
                userEmail,
                userPassword,
            );
            expect(updatedUser).toBe(null);
        });
        it('Should return null if updating user password fails', async () => {
            const userEmail = 'john.cena@gmail.com';
            const userPassword = '12345678';
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            const expectedUser = {
                _id: 'some object id',
                firstName: 'John',
                lastName: 'Cena',
                email: userEmail,
                applications: [],
                tasks: [],
                ownedTasks: [],
            };

            mockUserRepo.isValidPassword.mockResolvedValue(expectedUser);
            mockUserRepo.update.mockRejectedValue(new Error());

            const updatedUser = await usersService.updatePassword(
                'some object id',
                userEmail,
                updatedPassword,
                userPassword,
            );

            expect(mockUserRepo.isValidPassword).toHaveBeenCalledWith(
                userEmail,
                userPassword,
            );
            expect(mockUserRepo.update).toHaveBeenCalledWith(
                'some object id',
                updatedPassword,
            );

            expect(updatedUser).toBe(null);
        });
        it('Should return null if checking password validation fails', async () => {
            const userEmail = 'john.cena@gmail.com';
            const userPassword = '12345678';
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            mockUserRepo.isValidPassword.mockRejectedValue(new Error());

            const updatedUser = await usersService.updatePassword(
                'some object id',
                userEmail,
                updatedPassword,
                userPassword,
            );

            expect(mockUserRepo.isValidPassword).toHaveBeenCalledWith(
                userEmail,
                userPassword,
            );

            expect(updatedUser).toBe(null);
        });
        it('Should return null if checking password validation fails', async () => {
            const userEmail = 'john.cena@gmail.com';
            const userPassword = '12345678';
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            mockUserRepo.isValidPassword.mockRejectedValue(new Error());

            const updatedUser = await usersService.updatePassword(
                'some object id',
                userEmail,
                updatedPassword,
                userPassword,
            );

            expect(mockUserRepo.isValidPassword).toHaveBeenCalledWith(
                userEmail,
                userPassword,
            );

            expect(updatedUser).toBe(null);
        });
    });
});
