import { IUserDocument } from '../../models/UserModel';
import { UsersRepository } from '../../repositories/UsersRepo';

describe('UsersRepository', () => {
    const userRepo = new UsersRepository();
    const mockUserModel = {
        create: jest.fn(),
        findById: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        deleteOne: jest.fn(),
    };
    Reflect.set(userRepo, '_model', mockUserModel);

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should create user', async () => {
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

        mockUserModel.create.mockResolvedValue(userDoc);

        const createdUser = await userRepo.create(userData);
        expect(mockUserModel.create).toHaveBeenCalledWith(userData);
        expect(createdUser.firstName).toBe(userData.firstName);
        expect(createdUser.lastName).toBe(userData.lastName);
        expect(createdUser.email).toBe(userData.email);
        expect(createdUser.password).not.toBeNull();
    });
});
