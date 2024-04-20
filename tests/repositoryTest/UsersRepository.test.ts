import { genSaltSync, hashSync } from 'bcrypt';
import { UsersRepository } from '../../repositories/UsersRepo';
import { fakeModel } from '../mocks/FakeModel';
import { IUser } from '../../models/UserModel';
import { Error as MongooseError } from 'mongoose';
import { ValidationError } from '../../errors/RepoError';
import { MongoError } from 'mongodb';

describe('UsersRepository', () => {
    const userRepo = new UsersRepository();
    const mockUserModel = fakeModel;
    Reflect.set(userRepo, '_model', mockUserModel);

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Create user', () => {
        it('Should create user', async () => {
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

            mockUserModel.create.mockResolvedValue(userDoc);

            const createdUser = await userRepo.create(userData);
            expect(mockUserModel.create).toHaveBeenCalledWith(userData);
            expect(createdUser.firstName).toBe(userData.firstName);
            expect(createdUser.lastName).toBe(userData.lastName);
            expect(createdUser.email).toBe(userData.email);
            expect(createdUser.password).not.toBeNull();
        });
    });

    describe('Check password validation', () => {
        it('Should return user if password is valid', async () => {
            const userEmail = 'john.cena@gmail.com';
            const userPassword = '12345678';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(userPassword, salt);

            // Mock the expected user data that will be retrieved by findOne
            const expectedUser = {
                _id: 'some object id',
                firstName: 'John',
                lastName: 'Cena',
                email: userEmail,
                password: hashedPassword,
                applications: [],
                tasks: [],
                ownedTasks: [],
            };

            // Mock findOne method of mockUserModel to return the expected user
            mockUserModel.findOne.mockImplementation(query => {
                // Check if the query matches the expected email
                if (query.email === userEmail) {
                    // Simulate the behavior of select('+password') to include the password field
                    return {
                        ...expectedUser,
                        select: jest.fn().mockResolvedValue({
                            ...expectedUser,
                            password: hashedPassword, // Return the password field when selected
                        }),
                    };
                }
                return null; // Return null for other queries
            });
            // Call the method under test
            const user = await userRepo.isValidPassword(
                userEmail,
                userPassword,
            );

            // Assertions
            expect(user).toEqual(expectedUser); // Check if the returned user matches the expectedUser
            expect(fakeModel.findOne).toHaveBeenCalledWith({
                email: userEmail,
            }); // Ensure findOne was called with the correct parameters
        });

        it('Should return null if password is invalid', async () => {
            const userEmail = 'john.cena@gmail.com';
            const userPassword = '12345678';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(userPassword, salt);
            const wrongPassword = 'wrongPassword';

            const expectedUser = {
                _id: 'some object id',
                firstName: 'John',
                lastName: 'Cena',
                email: userEmail,
                password: hashedPassword,
                applications: [],
                tasks: [],
                ownedTasks: [],
            };

            mockUserModel.findOne.mockImplementation(query => {
                if (query.email === userEmail) {
                    return {
                        ...expectedUser,
                        select: jest.fn().mockResolvedValue({
                            ...expectedUser,
                            password: hashedPassword,
                        }),
                    };
                }
                return null;
            });

            const user = await userRepo.isValidPassword(
                userEmail,
                wrongPassword,
            );
            expect(user).toBeNull();
            expect(fakeModel.findOne).toHaveBeenCalledWith({
                email: userEmail,
            });
        });

        it('Should return null if user is not found', async () => {
            const userEmail = 'nonexistent@gmail.com';
            const userPassword = 'anypassword';

            mockUserModel.findOne.mockImplementation(query => {
                if (query.email === userEmail) {
                    return {
                        select: jest.fn().mockResolvedValue(null),
                    };
                }
                return null;
            });

            const user = await userRepo.isValidPassword(
                userEmail,
                userPassword,
            );
            expect(user).toBeNull();
            expect(fakeModel.findOne).toHaveBeenCalledWith({
                email: userEmail,
            });
        });
    });

    describe('Update user password', () => {
        it('Should update user password successfully', async () => {
            const userEmail = 'john.cena@gmail.com';
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            const expectedUpdatedUser = {
                _id: 'some object id',
                firstName: 'John',
                lastName: 'Cena',
                email: userEmail,
                applications: [],
                tasks: [],
                ownedTasks: [],
            };

            mockUserModel.findByIdAndUpdate.mockResolvedValue(
                expectedUpdatedUser,
            );

            const updatedUser = await userRepo.update(
                'some object id',
                updatedPassword,
            );
            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'some object id',
                updatedPassword,
                {
                    new: true,
                    runValidators: true,
                },
            );
            expect(updatedUser?._id).toBe(expectedUpdatedUser._id);
            expect(updatedUser?.firstName).toBe(expectedUpdatedUser.firstName);
            expect(updatedUser?.lastName).toBe(expectedUpdatedUser.lastName);
            expect(updatedUser?.email).toBe(expectedUpdatedUser.email);
            expect(updatedUser?.applications).toBe(
                expectedUpdatedUser.applications,
            );
            expect(updatedUser?.tasks).toBe(expectedUpdatedUser.tasks);
            expect(updatedUser?.ownedTasks).toBe(
                expectedUpdatedUser.ownedTasks,
            );
        });

        it('Should throw a Validation Error if update user password fails with Mongoose Validation Error', async () => {
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            mockUserModel.findByIdAndUpdate.mockRejectedValue(
                new MongooseError.ValidationError(
                    new MongooseError('some mongoose error'),
                ),
            );

            await expect(async () => {
                await userRepo.update('some object id', updatedPassword);
            }).rejects.toThrow(ValidationError);

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'some object id',
                updatedPassword,
                {
                    new: true,
                    runValidators: true,
                },
            );
        });
        it('Should throw a Validation Error if update user password fails with duplicate key violattion', async () => {
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            // Mock the behavior of findByIdAndUpdate to throw a MongoError with code 11000
            mockUserModel.findByIdAndUpdate.mockRejectedValue(
                new MongoError('Duplicate key error'),
            );

            // Set the specific error code (11000) on the MongoError instance
            (mockUserModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(
                Object.assign(new MongoError('Duplicate key error'), {
                    code: 11000,
                }),
            );

            await expect(async () => {
                await userRepo.update('some object id', updatedPassword);
            }).rejects.toThrow(ValidationError);

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'some object id',
                updatedPassword,
                {
                    new: true,
                    runValidators: true,
                },
            );
        });
        it('Should throw an Error if update user password fails with other errors', async () => {
            const newPassword = '87654321';
            const salt = genSaltSync(10);
            const hashedPassword = hashSync(newPassword, salt);

            const updatedPassword = {
                password: hashedPassword,
            } as IUser;

            mockUserModel.findByIdAndUpdate.mockRejectedValue(new Error());

            await expect(async () => {
                await userRepo.update('some object id', updatedPassword);
            }).rejects.toThrow(Error);

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'some object id',
                updatedPassword,
                {
                    new: true,
                    runValidators: true,
                },
            );
        });
    });
});
