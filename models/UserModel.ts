import mongoose, {Document, ObjectId, Types} from 'mongoose';

export interface User {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    photoURL?: string;
    gender: 'M' | 'F' | 'O';
    citizenId: string;
    bankId?: ObjectId;
    bankAccNo?: string;
}

export interface UserDocument extends User, Document {
}

const UserSchema = new mongoose.Schema<UserDocument>({
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
    phoneNumber: {
        type: String,
        unique: true,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function (v: string) {
                return /^[0-9]{10}$/.test(v);
            },
            message: 'Invalid phone number format'
        }
    },
    photoURL: {
        type: String,
        validate: {
            validator: function (v: string) {
                return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
            },
            message: 'Invalid URL format for photo',
        },
    },
    gender: {
        type: String,
        enum: ['M', 'F', 'O'],
        required: [true, 'Gender is required']
    },
    citizenId: {
        type: String,
        unique: true,
        required: [true, 'Citizen ID is required'],
        validate: {
            validator: function (v: string) {
                return /^[0-9]{13}$/.test(v);
            },
            message: 'Citizen ID need to be all number with length 13'
        }
    },
    bankId: {
        type: Types.ObjectId
    },
    bankAccNo: {
        type: String,
        validate: {
            validator: function (v: string) {
                return /^[0-9]{10}$/.test(v);
            },
            message: 'Bank account number need to be all number with length 10'
        }
    }
}, {
    timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'},
});

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);

