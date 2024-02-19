import { IUserDocument } from '../../models/UserModel';
import { UsersRepository } from '../../repositories/UsersRepo';
import { fakeModel } from '../mocks/FakeModel';

describe('UsersRepository', () => {
    const userRepo = new UsersRepository();
    const mockUserModel = fakeModel;
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
