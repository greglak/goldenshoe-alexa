var AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"});
const tableName = "username";
const tableName3 = "basket";
const tableName4 = "orders";
const tableName5 = "complaints";
const tableName6 = "products";
const tableName7 = "productViews";

var dbHelper = function () { };
var docClient = new AWS.DynamoDB.DocumentClient();

dbHelper.prototype.getName = (userID) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            KeyConditionExpression: "#userID = :user_id",
            ExpressionAttributeNames: {
                "#userID": "userId"
            },
            ExpressionAttributeValues: {
                ":user_id": userID
            }
        }
        docClient.query(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("GetName succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}

dbHelper.prototype.addName = (movie, userID) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            Item: {
                'userName' : movie,
                'userId': userID
            }
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log("Unable to insert =>", JSON.stringify(err))
                return reject("Unable to insert");
            }
            console.log("Saved Name, ", JSON.stringify(data));
            resolve(data);
        });
    });
}

dbHelper.prototype.updateUsername = (movieName, userID) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            Key:{
                'userId': userID
            },
            UpdateExpression: "set userName = :n",
            ExpressionAttributeValues: {
                ":n": movieName,
            }
        };
        docClient.update(params, (err, data) => {
            if (err) {
                console.log("Unable to insert =>", JSON.stringify(err))
                return reject("Unable to insert");
            }
            console.log("Updated the Name, ", JSON.stringify(data));
            resolve(data);
        });
    });
}

dbHelper.prototype.saveProductViews = (userID, data, date) => {
    return new Promise((resolve, reject) => {
        var productName = data[0].productName;
        const params = {
            TableName: tableName7,
            Item: {
                'productName' : productName,
                'userId': userID,
                'date': date
            }
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log("Unable to insert book view", JSON.stringify(err))
                return reject("Unable to insert book view");
            }
            console.log("Saved the book view on DB", JSON.stringify(data));
            resolve(data);
        });
    });
}

dbHelper.prototype.getProductViews = (userId, productName) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName7,
            KeyConditionExpression: "userId",
            FilterExpression: "#userId <> :id_hash AND #product <> :p_hash",
            ExpressionAttributeNames: {
                "#userId": "userId",
                "#product": "productName"
            },
            ExpressionAttributeValues :  {
                ":id_hash" : userId,
                ":p_hash" : productName
            },
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Filter product list succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}


dbHelper.prototype.getProductList = (productType) => {
    return new Promise((resolve, reject) => {
        console.log("The product type request is ", productType);
        if (productType.toLowerCase() == "men"){
            productType = "men"
        } else if (productType.toLowerCase() == "women" || productType.toLowerCase() == "ladies"){
            productType = "women"
        } else if (productType.toLowerCase() == "kids" || productType.toLowerCase() == "children"){
            productType = "kids"
        }

        const params = {
            TableName: tableName6,
            KeyConditionExpression: "productName",
            FilterExpression: "#IsSale = :v_hash",
            ExpressionAttributeNames: {
                "#IsSale": "category"
            },
            ExpressionAttributeValues :  {
                ":v_hash" : productType.toLowerCase()
            },
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Filter product list succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}

dbHelper.prototype.getBasket = (userId) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName3,
            KeyConditionExpression: "#userID = :user_id",
            ExpressionAttributeNames: {
                "#userID": "userId"
            },
            ExpressionAttributeValues: {
                ":user_id": userId
            }
        }
        docClient.query(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Get Basket succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}


dbHelper.prototype.placeOrder = (data, userId, date) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName4,
            Item:{
                "userId": userId,
                "orderTime": date,
                'title_name' : data.map(e => e.productName),
                'price' : parseFloat(data.map(e => e.price)).toFixed(2)
            },
            ReturnValues: 'ALL_OLD'
        }
        docClient.put(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Place order succeeded:", JSON.stringify(data, null, 2));
            var fuzz = params.Item;
            resolve(fuzz)
            
        })
    });
}

dbHelper.prototype.saveComplaint = (userId, productType, productName, time) => {
    return new Promise((resolve, reject) => {  
        const params = {
            TableName: tableName5,
            Item:{
                "userId": userId,
                "issueDate": time,
                'productType' : productType,
                'productTitle' : productName,
            },
            ReturnValues: 'ALL_OLD'
        }
        docClient.put(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Complaint creation succeeded:", JSON.stringify(data, null, 2));
            var fuzz = params.Item;
            resolve(fuzz)
        })
    });
}

dbHelper.prototype.getAllProductsOnSale = () => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName6,
            KeyConditionExpression: "productName",
            FilterExpression: "#IsSale = :v_hash",
            ExpressionAttributeNames: {
                "#IsSale": "isSale"
            },
            ExpressionAttributeValues :  {
                ":v_hash" : true
            },

        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Get movies on sale succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}

dbHelper.prototype.filterProductsByTypeOnSale = (type) => {
    return new Promise((resolve, reject) => {
        console.log("The product type request is ", type);
        if (type.toLowerCase() == "men"){
            type = "men"
        } else if (type.toLowerCase() == "women" || type.toLowerCase() == "ladies"){
            type = "women"
        } else if (ptype.toLowerCase() == "kids" || type.toLowerCase() == "children"){
            type = "kids"
        }
        const params = {
            TableName: tableName6,
            KeyConditionExpression: "productName",
            FilterExpression: "#IsSale = :v_hash AND #Type = :n_hash",
            ExpressionAttributeNames: {
                "#IsSale": "isSale",
                "#Type": "category"
            },
            ExpressionAttributeValues :  {
                ":v_hash" : true,
                ":n_hash" : type.toLowerCase()
            },
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Get movies on sale succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}

dbHelper.prototype.searchMovie = (name) => {
    return new Promise((resolve, reject) => {
        console.log("The input is", name);
        
        const params = {
            TableName: tableName6,
            KeyConditionExpression: "productName",
            FilterExpression: "#title_name = :movie_hash",
            ExpressionAttributeNames: {
                "#title_name": "productName"
            },
            ExpressionAttributeValues :  {
                ":movie_hash" : name.toLowerCase()
            }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Search for movie succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}

dbHelper.prototype.addMovieToBasket = (moviedata, userID, quantity) => {
    return new Promise((resolve, reject) => {
        var a = moviedata[0].productName;
        var price = moviedata[0].price;
        var b = parseInt(quantity);
        const params = {
            TableName: tableName3,
            Item: {
                'productName' : a,
                'price' : parseFloat(price).toFixed(2),
                'userId': userID,
                'quantity': b
            }   
        }
        docClient.put(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Add to basket succeeded:", JSON.stringify(data, null, 2));
            var fuzz = params.Item;
            resolve(fuzz)
            
        })
    });
}

dbHelper.prototype.checkBasket = (userID, name) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName3,
            KeyConditionExpression: "userId",
            FilterExpression: "#IsSale = :v_hash AND #Type = :n_hash",
            ExpressionAttributeNames: {
                "#IsSale": "userId",
                "#Type": "productName"
            },
            ExpressionAttributeValues :  {
                ":v_hash" : userID,
                ":n_hash" : name
            },
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Search for movie succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
        
            
        })
    });
}

dbHelper.prototype.checkForPendingBasket = (userID) => {
    return new Promise((resolve, reject) => {
        console.log("The userid is ", userID);
        const params = {
            TableName: tableName3,
            KeyConditionExpression: "#userID = :user_id",
            ExpressionAttributeNames: {
                "#userID": "userId"
            },
            ExpressionAttributeValues: {
                ":user_id": userID
            }
        }
        docClient.query(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Search for existing basket works: ", JSON.stringify(data, null, 2));
            resolve(data.Items)
        
            
        })
    });
}


dbHelper.prototype.incrementQuantityOnBasket = (data, userID, quantity) => {
    return new Promise((resolve, reject) => {
        console.log("The input is", data);
        console.log("The input is", userID);
        console.log("The input is", quantity);
        var a = data.productName;
        var b = parseInt(quantity);
        console.log("The input is", a);
        const params = {
            TableName: tableName3,
            Key:{
                'userId': userID,
                'productName': a
            },
            UpdateExpression: "set quantity = quantity + :n",
            ExpressionAttributeValues: {
                ":n": b,
            }


        }
        docClient.update(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Increment to basket succeeded:", JSON.stringify(data, null, 2));
            resolve(data)
            
        })
    });
}

dbHelper.prototype.deleteBasket = (userId, name) => {
    return new Promise((resolve, reject) => {
        console.log("The input inside delete function ", userId);
        console.log("The input inside delete function ", name);


        const params = {
            TableName: tableName3,
            Key:{
                "userId": userId,
                "productName": name
            },
            ConditionExpression: "attribute_exists(productName)"
    
        }
        docClient.delete(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Delete movie succeeded:", JSON.stringify(data, null, 2));
            resolve(params.Key)
            
        })
    });
}


dbHelper.prototype.searchDetailsOnProduct = (productName) => {
    return new Promise((resolve, reject) => {
        console.log("The input is", productName);
        
        const params = {
            TableName: tableName6,
            KeyConditionExpression: "productName",
            FilterExpression: "contains(#title_name, :movie_hash)",
            ExpressionAttributeNames: {
                "#title_name": "productName"
            },
            ExpressionAttributeValues :  {
                ":movie_hash" : productName.toLowerCase()
            }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("Search details succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}

dbHelper.prototype.updateBasketItem = (userID, productName, quantity) => {
    return new Promise((resolve, reject) => {
        var b = parseInt(quantity);
        const params = {
            TableName: tableName3,
            Key:{
                'userId': userID,
                'productName': productName
            },
            UpdateExpression: "set quantity = :n",
            ExpressionAttributeValues: {
                ":n": b,
            }
        };
        docClient.update(params, (err, data) => {
            if (err) {
                console.log("Unable to update the item", JSON.stringify(err))
                return reject("Unable to update return reject");
            }
            console.log("Updated the basket item, ", JSON.stringify(data));
            resolve(data);
        });
    });
}

dbHelper.prototype.removeFromBasket = (userID, name) => {
    return new Promise((resolve, reject) => {
        console.log("The input inside delete function ", userID);
        console.log("The input inside delete function ", name);
        const params = {
            TableName: tableName3,
            Key: {
                "userId": userID,
                "productName": name
            },
            ConditionExpression: "attribute_exists(productName)"
        }
        docClient.delete(params, function (err, data) {
            if (err) {
                console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            }
            console.log(JSON.stringify(err));
            console.log("Deleting Item succeeded:", JSON.stringify(data, null, 2));
            resolve()
        })
    });
}

module.exports = new dbHelper();