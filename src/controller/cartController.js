const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const mongoose = require('mongoose');
const validate = require('../utils/validation');


const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}


/////////////////////  [ Creating Cart ]  //////////////////////////


const createCart = async function(req,res){
    try {
        let userId = req.params.userId
        let { productId, cartId, quantity } = req.body
        if (Object.keys(req.body).length == 0)
            return res.status(400).send({ status: false, message: "Body must be requried" })

        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "productId is invalid" })

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "userId  is invalid" })

        if (typeof cartId == "string") {
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: "CART ID is Not Valid" })
            //match userId for given cartId
            let getCart = await cartModel.findOne({ userId:userId, _id: cartId })
            if (!getCart)
                return res.status(403).send({ status: false, message: "cartId doesnt belong to current user" })
        }
        if (!quantity)
        quantity = 1
        if (quantity == 0)
            return res.status(400).send({ status: false, message: "Quantity cannot be zer0" })
       

        const findProductDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProductDetails)
            return res.status(404).send({ status: false, message: "Product not found" })

        let price = findProductDetails.price
        let findCart = await cartModel.findOne({ userId })
        let product = {
            productId: productId,
            quantity: quantity
        }
        if (findCart) {
            let indexOfProduct = -1         //taking a reference variable to compare and update the cart
            for (let i in findCart.items) {
                if (findCart.items[i].productId == productId) {
                    indexOfProduct = i
                    break
                }
            }
            if (indexOfProduct == -1)               // if the value of the variable unchanged it will update.
                findCart = await cartModel.findOneAndUpdate(
                    { userId },
                    { $addToSet: { items: product }, $inc: { totalPrice: price * quantity, totalItems: 1} },
                    { new: true }
                )

            else {                  // else create new data
                findCart.items[indexOfProduct].quantity += quantity
                findCart.totalPrice += price * quantity
                await findCart.save()
            }
        }
        let data = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity
            }],
            totalPrice: price * quantity,
            totalItems: 1
        }
        if (!findCart) {
            let createdCart = await cartModel.create(data)
            return res.status(201).send({ status: true, msg: "New cart created", data: createdCart })
        }
        else
            return res.status(200).send({ status: true, msg: "Items added to cart", data: findCart })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

/////////////////////////////////////  [  update cart ]  ///////////////////////////////////////

const updateCart = async function (req, res) {
    try {
        let data = req.body
        // let error = []
        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Please enter data to update cart details" })

        if (!isValidObjectId(data.cartId))
            return res.status(400).send({ status: false, message: "invalid cartId" })
        if (!isValidObjectId(data.productId))
            return res.status(400).send({ status: false, message: "invalid productId" })
        if (validate.isValid(data.removeProduct))
            return res.status(400).send({ status: false, message: "removeProduct is required" })
        if (!(data.removeProduct == 0 || data.removeProduct == 1))
            return res.status(400).send({ status: false, message: "removeProduct accepts either 0 or 1" })

        let cart = await cartModel.findOne({ _id: data.cartId, userId: req.params.userId })
        if (!cart)
            return res.status(404).send({ status: false, message: "Cart not found" })

        if (cart.items.length == 0)
            return res.status(400).send({ status: false, message: "Cart is empty" })

        let indexOfProduct = -1
        for (let i in cart.items) {
            if (cart.items[i].productId == data.productId) {
                indexOfProduct = i
                break
            }
        }
        if (indexOfProduct == -1)
            return res.status(404).send({ status: false, message: "Product not found inside cart" })

        let quantity = cart.items[indexOfProduct].quantity

        let product = await productModel.findOne({ _id: data.productId, isDeleted: false })
        if (!product)
            return res.status(404).send({ status: false, message: "Product not found" })

        if (cart.items[indexOfProduct].quantity == 1 && data.removeProduct == 1)
            data.removeProduct = 0

        switch (data.removeProduct) {
            case 0:
                cart.items = cart.items.filter(function (value, index) { if (index != indexOfProduct) return value })
                cart.totalItems = cart.items.length
                cart.totalPrice -= product.price * quantity
                break
            case 1:
                --cart.items[indexOfProduct].quantity
                cart.totalItems = cart.items.length
                cart.totalPrice -= product.price
                break
        }
        await cart.save()

        if (cart.items.length == 0)
            return res.status(200).send({ status: false, message: "Cart is empty" })

        return res.status(200).send({ status: true, message: "Updated cart details", data: cart })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


//////////////////////////////////////////////  [ get cart details ]  /////////////////////////////////////////////

const getCart = async (req, res) =>{
    try {
        const userId = req.params.userId;

        if (Object.keys(userId).length === 0) {
            return res.status(400).send({ status: false, message: "UserId is not present, plz provide userId" })
        }

        if(!isValidObjectId(userId)){
            return res.status(400).send({status:false, msg:"userId is not Valid"})
        }

        let checkCart = await cartModel.findOne({userId:userId})

        if (!checkCart) {
            return res.status(404).send({ status: false, msg: "No cart found with this userId" })
        }
        if(checkCart.items.length == 0 )
            return res.status(404).send({status:false, message:"Caart is empty."})

        
        return res.status(200).send({ status: true, cartData: checkCart})

    } 
 
        catch (error) { res.status(500).send({ msg: error.message })
    }
}


//////////////////////////////////////////  [ delete cart ]  ///////////////////////////////////////////

const deleteCart = async (req, res) =>{
  try {
    let userId = req.params.userId;

    if (Object.keys(userId).length === 0) {
        return res.status(400).send({ status: false, message: "UserId is not present, plz provide userId" })
    }

    if(!isValidObjectId(userId)){
        return res.status(400).send({status:false, msg:"userId is not Valid"})
    }

    // let checkCart = await cartModel.findOne({userId:userId})

    // if (!checkCart) {
    //     return res.status(404).send({ status: false, msg: "No cart found with this userId" })
    // }

    //checking if the cart exist with this userId or not
    let findCart = await cartModel.findOne({ userId: userId });
    if(!findCart) return res.status(404).send({ status: false, message: `No cart found with this "${userId}" userId` });

    //checking for an empty cart
    if(findCart.items.length == 0) return res.status(400).send({ status: false, message: "Cart is already empty" });

    let delCart = await cartModel.findByIdAndUpdate(
      {_id: findCart._id},
      {items: [], totalPrice: 0, totalItems: 0},
      {new: true}
    )

    res.status(200).send({ status: true, message: "Products removed successfully", data: delCart })
  } catch (err) {
    res.status(500).send({ status: false, error: err.message })
  }
}

module.exports = { getCart, deleteCart,createCart, updateCart }