const express = require('express');
const router = express.Router();

//// IMPORTING CONTROLLERS  /////
const {  createUser, userLogin, getDetails, updateUser   }= require("../controller/userController");
const {  createProduct, getProduct,getProductById, updateProducts, deleteProductsById   } = require('../controller/productController')
const {  getCart, deleteCart,createCart, updateCart }= require("../controller/cartController");
const {  updateOrder, createOrder }= require("../controller/orderController");



const { authentication, authorization   } = require('../middleWare/userAuth')



////// API ///////

router.post('/register', createUser)
router.post("/login", userLogin)
router.get('/user/:userId/profile', authentication, getDetails)
router.put('/user/:userId/profile', authentication, authorization, updateUser)

router.post('/products', createProduct)
router.get('/products', getProduct)
router.get('/products/:productId', getProductById)
router.put('/products/:productId', updateProducts)
router.delete('/products/:productId', deleteProductsById)

router.post('/users/:userId/cart', authentication, createCart)
router.put('/users/:userId/cart', authentication, updateCart)
router.get('/users/:userId/cart', authentication, getCart)
router.delete('/users/:userId/cart', authentication, authorization,  deleteCart)


router.post('/users/:userId/orders', authentication, authorization, createOrder)
router.put('/users/:userId/orders', authentication, authorization, updateOrder)

module.exports = router;