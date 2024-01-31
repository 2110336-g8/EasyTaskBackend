import mongoose, { Document } from 'mongoose'

export interface IOtp {
    email: string
    otp: string
    expiredAt: Date
    isVerified: boolean
    verifiedAt: Date
}

export interface IOtpMethods {
    isValidOtp: (otp: string) => boolean
}

export interface IOtpDocument extends IOtp, IOtpMethods, Document {}

const OtpSchema = new mongoose.Schema<IOtpDocument>(
    {
        email: {
            type: String,
            unique: true,
            require: [true, 'Email is required'],
            validate: {
                validator: function (v: string) {
                    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v)
                },
                message: 'Invalid email format',
            },
        },
        otp: {
            type: String,
            require: [true, 'OTP number is required'],
        },
        expiredAt: {
            type: Date,
            require: [true, 'OTP expired time is required'],
        },
        isVerified: {
            type: Boolean,
            require: [true, 'Field isVerified is required'],
            default: false,
        },
        verifiedAt: {
            type: Date,
            require: [
                function (this: IOtp) {
                    return this.isVerified
                },
                'Verified timestamp is required',
            ],
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
)

OtpSchema.methods.isValidOtp = function (otp: string): boolean {
    const matched = otp === this.otp
    const expired = new Date().getTime() > this.expiredAt.getTime()
    return matched && !expired
}

export const OtpModel = mongoose.model<IOtpDocument>('Otp', OtpSchema)
