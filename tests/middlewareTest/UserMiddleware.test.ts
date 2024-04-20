import { Request, Response, NextFunction } from 'express';
import { UserMiddleware } from '../../middlewares/UserMiddleware';

describe('UserMiddleware', () => {
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
    const userMiddleware = new UserMiddleware(mockUserService);

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validateUpdatePassword', () => {
        const id = 'user_id';
        const currentPassword = 'currentPassword';
        const newPassword = 'newPassword';
        const mockRequest = {
            params: {
                id: id,
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
        const mockNextFunction = jest.fn();

        it('Should call next() if information are provided correctly', async () => {
            const mockedUser = {
                _id: id,
            };
            // Mock UsersService.getUserById to return mockedUser (user found)
            mockUserService.getUserById.mockResolvedValue(mockedUser);

            await userMiddleware.validateUpdatePassword(
                mockRequest as Request,
                mockResponse as Response,
                mockNextFunction as NextFunction,
            );

            expect(mockNextFunction).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).not.toHaveBeenCalled();
        });

        it('Should return 400 and error message if currentPassword and newPassword are missing', async () => {
            const invalidRequest = {
                ...mockRequest,
                body: {},
            };

            const mockedUser = {
                _id: id,
            };
            // Mock UsersService.getUserById to return mockedUser (user found)
            mockUserService.getUserById.mockResolvedValue(mockedUser);

            await userMiddleware.validateUpdatePassword(
                invalidRequest as Request,
                mockResponse as Response,
                mockNextFunction as NextFunction,
            );

            expect(mockNextFunction).toHaveBeenCalled();
        });

        it('should return 400 and error message if newPassword is missing', async () => {
            const invalidRequest = {
                ...mockRequest,
                body: { currentPassword: currentPassword },
            };
            const mockedUser = {
                _id: id,
            };
            // Mock UsersService.getUserById to return mockedUser (user found)
            mockUserService.getUserById.mockResolvedValue(mockedUser);

            await userMiddleware.validateUpdatePassword(
                invalidRequest as Request,
                mockResponse as Response,
                mockNextFunction as NextFunction,
            );

            expect(mockNextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid changing password',
                details: 'currentPassword and newPassword are required',
            });
        });

        it('should return 400 and error message if user is not found', async () => {
            // Mock UsersService.getUserById to return null (user not found)
            mockUserService.getUserById.mockResolvedValue(null);

            await userMiddleware.validateUpdatePassword(
                mockRequest as Request,
                mockResponse as Response,
                mockNextFunction as NextFunction,
            );

            expect(mockNextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'User not found',
            });
        });

        it('should return 400 and error message if id is missing in params', async () => {
            const invalidRequest = {
                ...mockRequest,
                params: {},
            };
            await userMiddleware.validateUpdatePassword(
                invalidRequest as Request,
                mockResponse as Response,
                mockNextFunction as NextFunction,
            );

            expect(mockNextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'ID is required to update user',
            });
        });
    });
});
