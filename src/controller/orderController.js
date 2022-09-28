const orderModel = require('../models/orderModel')
const cartModel = require('../models/cartModel')
const validate = require('../utils/validation');






//////////////////////////////////////////////////////////////////////////////////////////////////// 
const createOrder = async (req, res) => {
    try {
      let userId = req.params.userId;
  
      //checking if cart exists
      let findCart = await cartModel.findOne({ userId: userId });
      if(!findCart) return res.status(404).send({ status: false, message: `No cart found with this '${userId}' user-ID` })
  
      //checking for an empty cart
      if(findCart.items.length == 0) return res.status(400).send({ status: false, message: "Can't create order with an empty cart" });
  
      let data = req.body;
  
      if(Object.keys(data).length == 0){
        //checking for a valid user input
        if(validate.isValid(data)) return res.status(400).send({ status: false, message: 'Data is required to cancel your order' });
  
        //validating the cartId
        if(data.cartId || typeof data.cartId == 'string'){
          if(!validate.isValidObjectId(data.cartId)) return res.status(400).send({ status: false, message: "CartId must be a valid object id." });

          if(validate.isValid(data.cartId)) return res.status(400).send({ status: false, message: "Enter a valid cartId" });
          
        }
      }
  
      
      data.totalQuantity = findCart.items.length
      data.userId = userId;
      data.items = findCart.items;
      data.totalPrice = findCart.totalPrice;
      data.totalItems = findCart.totalItems;
  
      let resData = await orderModel.create(data);
      await cartModel.updateOne(
        {_id: findCart._id},
        {items: [], totalPrice: 0, totalItems: 0}
      )
      res.status(201).send({ status: false, message: "Order placed successfully", data: resData });
    } catch (err) {
      res.status(500).send({ status: false, error: err.message })
    }
  }

///////////////////////////// [ uppdate order ]//////////////////////////////

const updateOrder = async (req, res) => {
    try {
      let data = req.body;
  
      //checking for a valid user input
      if(validate.isValid(data)) return res.status(400).send({ status: false, message: 'Data is required to update order' });
  
      //checking for valid orderId
      if(validate.isValid(data.orderId)) return res.status(400).send({ status: false, message: 'Proper orderId is required' });
      if(!validate.isValidObjectId(data.orderId)) return res.status(400).send({ status: false, message: 'Enter a valid order-Id' });
  
      //checking if cart exists or not
      let findOrder = await orderModel.findOne({ _id: data.orderId, isDeleted: false });
      if(!findOrder) return res.status(404).send({ status: false, message: `No order found with this '${data.orderId}' order-ID` })
  
      
      if(validate.isValid(data.status)) return res.status(400).send({ status: false, message: 'Status is required and should not be an empty string' });
  
      //validating if status is in valid format or not
      if(!(['Pending','Completed','Cancelled'].includes(data.status))) return res.status(400).send({ status: false, message: "Order status should be one of this 'Pending','Completed' and 'Cancelled'" });
  
    if(findOrder.status == "Completed"){
      return res.status(400).send({status:false, message:"order already placed."})
    }

      if(findOrder.status == "Pending"){
        if(data.status == "Cancelled" ){
          if(findOrder.cancellable == "false"){
          return res.status(400).send({status:false, message:"Order is not cancellable."})
        }else{
          return res.status(200).send({status:true,message:`Order with orderId ${findOrder._id} has been successfully cancelled.`})
        }
      }
        if(data.status == "Completed"){
          let resData = await orderModel.findByIdAndUpdate(
              {_id: findOrder._id},
              {$set:{status:data.status}},
              {new: true}
            )
            res.status(200).send({ status: true, message: "Order updated Successfully", data: resData });
            }
      }
  
    } catch (err) {
      res.status(500).send({ status: false, message: err.message })
    }
  }



module.exports = {createOrder, updateOrder}