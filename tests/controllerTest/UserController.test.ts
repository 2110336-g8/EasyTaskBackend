import { Request, Response } from 'express';
import UsersController from '../../controllers/UsersController';
import { ValidationError } from '../../errors/RepoError';

describe('UsersService', () => {
    const mockUserService = {
        createUser: jest.fn(),
        getUserById: jest.fn(),
        getUserByEmail: jest.fn(),
        updateUser: jest.fn(),
        updatePassword: jest.fn(),
        deleteUser: jest.fn(),
        getUserProfileImage: jest.fn(),
        updateUserProfileImage: jest.fn(),
        deleteUserProfileImage: jest.fn(),
    };
    const usersController = new UsersController(mockUserService);
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Update user password', () => {
        const id = 'user_id';
        const email = 'test@example.com';
        const currentPassword = 'currentPassword';
        const newPassword = 'newPassword';
        const mockRequest = {
            params: {
                id: id,
            },
            user: {
                email: email,
            },
            body: {
                currentPassword: currentPassword,
                newPassword: newPassword,
            },
        } as unknown as Request;
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;
        it('Should update user password successfully', async () => {
            const mockedUser = {
                _id: id,
                email: email,
                toJSON: jest.fn().mockReturnValue({
                    _id: id,
                    email: email,
                }),
            };

            // Mock the updatePassword method of UserService to return mockedUser
            mockUserService.updatePassword.mockResolvedValue(mockedUser);

            await usersController.updatePassword(mockRequest, mockResponse);

            expect(mockUserService.updatePassword).toHaveBeenCalledWith(
                id,
                email,
                { password: expect.any(String) }, // Ensure a hashed password is passed
                currentPassword,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                user: expect.objectContaining({
                    _id: id,
                    email: email,
                }),
            });
        });

        it('Should handle when update password fails', async () => {
            // Mock the updatePassword method of UserService to return null
            mockUserService.updatePassword.mockResolvedValue(null);

            await usersController.updatePassword(mockRequest, mockResponse);

            expect(mockUserService.updatePassword).toHaveBeenCalledWith(
                id,
                email,
                { password: expect.any(String) },
                currentPassword,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Unauthorized',
            });
        });
        it('Should handle validation error', async () => {
            // Mock the updatePassword method of UserService to return validation error
            mockUserService.updatePassword.mockRejectedValue(
                new ValidationError('some error message'),
            );

            await usersController.updatePassword(mockRequest, mockResponse);

            expect(mockUserService.updatePassword).toHaveBeenCalledWith(
                id,
                email,
                { password: expect.any(String) },
                currentPassword,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Validation Error',
                details: 'some error message',
            });
        });

        it('Should handle internal server error', async () => {
            // Mock the updatePassword method of UserService to throw an error
            mockUserService.updatePassword.mockRejectedValue(
                new Error('Internal Server Error'),
            );

            await usersController.updatePassword(mockRequest, mockResponse);

            expect(mockUserService.updatePassword).toHaveBeenCalledWith(
                id,
                email,
                { password: expect.any(String) },
                currentPassword,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Internal server error',
            });
        });
    });
});
