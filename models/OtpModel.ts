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
            default: function (): string {
                let otp = ''
                const digit = '1234567890'
                for (let i = 0; i < 6; i++) {
                    otp += digit[Math.floor(Math.random() * digit.length)]
                }
                return otp
            },
        },
        expiredAt: {
            type: Date,
            require: [true, 'OTP expired time is required'],
            default: function (): Date {
                let date = new Date()
                date.setMinutes(date.getMinutes() + 5)
                return date
            },
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
