import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add owner as first member with owner role
groupSchema.pre('save', function(next) {
  if (this.isNew) {
    this.members.push({
      userId: this.owner,
      role: 'owner'
    });
  }
  this.updatedAt = new Date();
  next();
});

const Group = mongoose.model('Group', groupSchema);
export default Group;