import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Add owner as first member if owner exists
groupSchema.pre('save', function(next) {
  if (this.isNew && this.owner && !this.members.includes(this.owner)) {
    this.members.unshift(this.owner);
  }
  this.updatedAt = new Date();
  next();
});

const Group = mongoose.model('Group', groupSchema);
export default Group;