const {Schema,model}=require('mongoose')
module.exports=model('Instructor',new Schema({
  name:{type:String,required:true}
}))