import mongoose from 'mongoose';

const EmailSchema = mongoose.Schema({
    to: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    subject: String,
    body: String,
    date: {
        type: Date,
        required: true
    },
    image: String,
    name: {
        type: String,
        required: true
    },
    starred: {
        type: Boolean,
        default: false
    },
    bin: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'read', 'failed'],
        default: 'sent'
    },
    readTimestamp: {
        type: Date
    }
})

const email = mongoose.model('emails', EmailSchema);

export default email;