import mongoose, { Document, ObjectId, Types } from 'mongoose'
import { compare, genSalt, hash } from 'bcrypt'

export interface User {
    firstName: string
    lastName: string
    password: string
    phoneNumber: string
    photoURL?: string
    gender: 'M' | 'F' | 'O'
    citizenId: string
    bankId?: ObjectId
    bankAccNo?: string
}

interface UserMethods {
    isValidPassword: (password: string) => Promise<boolean>
}

export interface UserDocument extends User, UserMethods, Document {}

const UserSchema = new mongoose.Schema<UserDocument>(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            maxlength: [255, 'First name cannot be longer than 255 characters'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            maxlength: [255, 'Last name cannot be longer than 255 characters'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password cannot be shorter than 8 characters'],
        },
        phoneNumber: {
            type: String,
            unique: true,
            required: [true, 'Phone number is required'],
            validate: {
                validator: function (v: string) {
                    return /^[0-9]{10}$/.test(v)
                },
                message: 'Invalid phone number format',
            },
        },
        photoURL: {
            type: String,
            validate: {
                validator: function (v: string) {
                    return /^(ftp|http|https):\/\/[^ "]+$/.test(v)
                },
                message: 'Invalid URL format for photo',
            },
        },
        gender: {
            type: String,
            enum: ['M', 'F', 'O'],
            required: [true, 'Gender is required'],
        },
        citizenId: {
            type: String,
            unique: true,
            required: [true, 'Citizen ID is required'],
            validate: {
                validator: function (v: string) {
                    return /^[0-9]{13}$/.test(v)
                },
                message: 'Citizen ID need to be all number with length 13',
            },
        },
        bankId: {
            type: Types.ObjectId,
        },
        bankAccNo: {
            type: String,
            validate: {
                validator: function (v: string) {
                    return /^[0-9]{10}$/.test(v)
                },
                message:
                    'Bank account number need to be all number with length 10',
            },
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
)

UserSchema.method(
    'isValidPassword',
    async function (password: string): Promise<boolean> {
        const isValid = await compare(password, this.password)
        return isValid
    },
)

UserSchema.methods.toJSON = function () {
    const userObject: any = this.toObject()
    delete userObject.password
    return userObject
}

UserSchema.pre('save', async function (next) {
    const salt = await genSalt(10)
    const hashedPassword = await hash(this.password, salt)
    this.password = hashedPassword
    next()
})

export const UserModel = mongoose.model<UserDocument>('User', UserSchema)
//
