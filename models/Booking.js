const {Schema,model,Types}=require('mongoose')
module.exports=model('Booking',new Schema({
  event: { type: Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  countryCode: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
}))