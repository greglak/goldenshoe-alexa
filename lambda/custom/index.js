const Alexa = require('ask-sdk-core');
// i18n library dependency, we use it below in a localisation interceptor
const i18n = require('i18next');
const dbHelper = require('./helpers/dbHelper');
// i18n strings for all supported locales
const languageStrings = require('./languageStrings');

const ALEXA_RESPONSES = {
    reprompt: 'What would you like to do? You can say HELP to get available options',
    stopMessageSpeak: 'Thank you! See you later!',
};

const speechIntroVariatons = [
    'Thanks for the input ',
    'Cool, so, ',
    'Let summarize what you have just said, ',
];

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },

    handle(handlerInput) {
        console.log('Launching Golden Shoe - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const responseBuilder = handlerInput.responseBuilder;
        const userID = handlerInput.requestEnvelope.context.System.user.userId;

        return dbHelper.getName(userID)
            .then((data) => {
                const username = data.map(e => e.userName);
                console.log("the username is ", username);

                var speechText = "Hey "
                var speechText2 = ", Welcome back to Golden Shoe! "
                var speechText3 = " How may I help you today?"
                var speechText4 = ", you have a pending basket, to check it, say Show my Basket!"
                if (data.length == 0) {
                    speechText = "Welcome to Golden Shoe! My name is Jennifer, what is your name?, You can say, My name is, followed by your name"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(speechText)
                        .getResponse();
                } else {
                    return dbHelper.checkForPendingBasket(userID)
                        .then((data) => {
                            if (data.length == 0) {
                                speechText += username + speechText2 + speechText3
                            }
                            else {
                                speechText += username + speechText2 + speechText4
                            }
                            return responseBuilder
                                .speak(speechText)
                                .reprompt(ALEXA_RESPONSES.reprompt)
                                .getResponse();
                        })
                        .catch((err) => {
                            console.log("Error occured while retrieving your credentials", err);
                            const speechText = "We can not retrive your credentials right now. Try again later!"
                            return responseBuilder
                                .speak(speechText)
                                .reprompt(ALEXA_RESPONSES.reprompt)
                                .getResponse();
                        })
                }
            })
            .catch((err) => {
                console.log("Error occured while launching the application", err);
                const speechText = "We can't launch right now"
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })

    },
};

const GetUserNameIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'GetUserNameIntent';
    },
    async handle(handlerInput) {
        console.log('Asking Username - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));

        const { responseBuilder } = handlerInput;
        const userId = handlerInput.requestEnvelope.context.System.user.userId;

        return dbHelper.getName(userId)
            .then((data) => {
                var speechText = "Your username is "
                if (!(data.length == 0)) {
                    speechText += data.map(e => e.userName)
                } else {
                    speechText = "You have not set a username yet, you can add one by saying, call me"
                }
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
            .catch((err) => {
                console.log("Error occured getting the username", err);
                const speechText = "I can not get your name right now"
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
    },
};

const InProgressAddUserNameIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AddUserNameIntent' && request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
        console.log('In Progress Adding Username - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
            .getResponse();
    },
};

const AddUsernameIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'AddUserNameIntent';
    },
    async handle(handlerInput) {
        console.log('Adding Username - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const userId = handlerInput.requestEnvelope.context.System.user.userId;
        const slot = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(slot);
        const userName = slotValues.userName.synonym;
        const confirmation = handlerInput.requestEnvelope.request.intent.confirmationStatus;
        if (confirmation === "CONFIRMED") {
            return dbHelper.getName(userId)
                .then((data) => {
                    if (data.length == 1) {
                        sessionAttributes["username"] = userName;
                        sessionAttributes["updateUsernameIntent"] = 1;
                        // handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                        speechText = "This username is set already, would you like to update it?"
                        return responseBuilder
                            .speak(speechText)
                            .reprompt(speechText)
                            .getResponse();

                    } else {
                        return dbHelper.addName(userName, userId)
                            .then((data) => {
                                const speechText = `Hey ${userName}, welcome to the webshop!`;
                                return responseBuilder
                                    .speak(speechText)
                                    .reprompt(ALEXA_RESPONSES.reprompt)
                                    .getResponse();
                            })
                            .catch((err) => {
                                console.log("Error occured while saving your name", err);
                                const speechText = "We can not save your name right now. Try again!"
                                return responseBuilder
                                    .speak(speechText)
                                    .reprompt(ALEXA_RESPONSES.reprompt)
                                    .getResponse();
                            })
                    }
                })
                .catch((err) => {
                    const speechText = "We can't check your credentials right now"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
        } else {
            var say = "So ";
            say += " , no worries, " + ALEXA_RESPONSES.reprompt
            return responseBuilder
                .speak(say)
                .reprompt(ALEXA_RESPONSES.reprompt)
                .getResponse()
        }
    },
};

const InProgressUpdateUsernameIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'UpdateUsernameIntent' && request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
        console.log('Check for In Progress Updating - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
            .getResponse();
    },
};

const UpdateUsernameIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'UpdateUsernameIntent'
            && handlerInput.requestEnvelope.request.dialogState === 'COMPLETED';

    },
    async handle(handlerInput) {
        console.log('Check for Completing Username Update - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const userId = handlerInput.requestEnvelope.context.System.user.userId;
        const responseBuilder = handlerInput.responseBuilder;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const slot = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(slot);
        const userName = slotValues.userName.synonym;
        const confirmation = handlerInput.requestEnvelope.request.intent.confirmationStatus;

        if (confirmation === "CONFIRMED") {
            sessionAttributes["updateUsernameIntent"] = 0;
            // handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            return dbHelper.getName(userId)
                .then((data) => {
                    var speechText = "Your username is "
                    if (data.length == 0) {
                        speechText = "You don't have a username yet. You can say, call me"
                    } else {
                        return dbHelper.updateUsername(userName, userId)
                            .then((data) => {
                                const speechText = `Your new name is ${userName}`;
                                return responseBuilder
                                    .speak(speechText)
                                    .reprompt(ALEXA_RESPONSES.reprompt)
                                    .getResponse();
                            })
                            .catch((err) => {
                                console.log("Error occured while saving shoes", err);
                                const speechText = "We can not update your name right now. Try again later!"
                                return responseBuilder
                                    .speak(speechText)
                                    .reprompt(ALEXA_RESPONSES.reprompt)
                                    .getResponse();
                            })
                    }
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
                .catch((err) => {
                    const speechText = "I can't get verify your name right now"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
        } else {
            var say = "So ";
            say += " , no worries, " + ALEXA_RESPONSES.reprompt
            return responseBuilder
                .speak(say)
                .reprompt(ALEXA_RESPONSES.reprompt)
                .getResponse()
        }
    },
};

const InProgressUpdateBasketItemIntent_Handler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest' && request.intent.name === 'updateBasketItemIntent' && request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
      console.log('InProgressupdateBasketItemIntent_Handler - Initiated');
      console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
      const currentIntent = handlerInput.requestEnvelope.request.intent;
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    },
  };
  
  const UpdateBasketItemIntent_Handler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'updateBasketItemIntent'
      && handlerInput.requestEnvelope.request.dialogState === 'COMPLETED';
      
    },
    async handle(handlerInput) {
      console.log('UpdateBasketItemIntent_Handler - Initiated');
      console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
      const responseBuilder = handlerInput.responseBuilder;
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      const slots = handlerInput.requestEnvelope.request.intent.slots;
      const slotValues = getSlotValues(slots);
      const userId = handlerInput.requestEnvelope.context.System.user.userId; 
      const productName = slotValues.productName.synonym;
      const quantity = slotValues.quantity.synonym;
      
      return dbHelper.checkBasket(userId, productName)
        .then((data) => {
          if (data.length == 0){
            speechOutput = "You don't have that item in your basket";
            return responseBuilder
              .speak(speechOutput)
              .reprompt(ALEXA_RESPONSES.reprompt)
              .getResponse();
          }else{
            var dataset = {
              userId : userId,
              productName : productName,
              quantity: quantity
            }
            sessionAttributes["placeOrder"] = 0;
            sessionAttributes["dataToUpdateFromBasket"] = dataset; 
            sessionAttributes["UpdateBasketItemIntent"] = 1;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            var speechText  = "Do you really want to update this item?"
              return responseBuilder
                .speak(speechText )
                .reprompt(ALEXA_RESPONSES.reprompt)
                .getResponse();
          }
        })
        .catch((err) => {
          console.log("Error occured while updating basket", err);
          const speechText = "We can not update your basket right now. Try again!"
          return responseBuilder
            .speak(speechText)
            .reprompt(ALEXA_RESPONSES.reprompt)
            .getResponse();
        })   
    },
  };

const ListProductTypesIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'ListProducts';
    },
    handle(handlerInput) {
        const speechText = 'We have shoes for women, men, and kids, what would you like to hear?, say something like Get me the women list, or say Get me the men list ';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(ALEXA_RESPONSES.reprompt)
            .getResponse();
    },
};

const FilterProductsByTypeIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'GetMeListOfProducts';
    },
    async handle(handlerInput) {
        const { responseBuilder } = handlerInput;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        // const productType= slots.productName.value; 

        const slotValues = getSlotValues(slots);

        if (slotValues.productKind.isValidated === true) {
            const productType = slotValues.productKind.resolved;
            return dbHelper.getProductList(productType)
                .then((data) => {
                    var speechText = "We have "
                    var speechText2 = ", do you want to find out more about one of them?, all you have to do is say, Get me details on, followed by the name of the product"
                    if (data.length == 0) {
                        speechText = "There are no products in that category right now"
                    } else {
                        speechText += data.map(e => e.productName).join(", ") + speechText2
                    }
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
                .catch((err) => {
                    const speechText = "we can not get your product list right now. Try again!"
                    console.log(err);
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
        } else {
            var speechText = "There are no such products on stock right now"
            return responseBuilder
                .speak(speechText)
                .reprompt(ALEXA_RESPONSES.reprompt)
                .getResponse();
        }

    }
};

const FilterByProductTypesOnSaleIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'FilterByProductTypesOnSale';
    },
    async handle(handlerInput) {
        const { responseBuilder } = handlerInput;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        // const type = slots.productKind.synonym; 

        const slotValues = getSlotValues(slots);

        if (slotValues.productKind.isValidated === true) {
            const type = slotValues.productKind.resolved;
            return dbHelper.filterProductsByTypeOnSale(type)
                .then((data) => {
                    var speechText = "We have "
                    console.log(data);
                    if (data.length == 0) {
                        speechText = "There are no" + data.map(e => e.type) + " shoes on sale right now"
                    } else {
                        speechText += data.map(e => e.productName).join(", ")
                    }
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
                .catch((err) => {
                    const speechText = "we cannot get your filtered list on sale right now. Try again!"
                    console.log(err);
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
        } else {
            var speechText = "There are no " + slotValues.productKind.resolved + " kind of product on sale right now"
            return responseBuilder
                .speak(speechText)
                .reprompt(ALEXA_RESPONSES.reprompt)
                .getResponse();
        }
    }
};

const FilterAllProductsOnSaleIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'FilterAllProductsOnSaleIntent';
    },
    async handle(handlerInput) {
        const { responseBuilder } = handlerInput;
        return dbHelper.getAllProductsOnSale()
            .then((data) => {
                var speechText = "We have "
                console.log(data);
                if (data.length == 0) {
                    speechText = "There are no items on sale right now"
                } else {
                    speechText += data.map(e => e.productName).join(", ")
                }
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
            .catch((err) => {
                const speechText = "we cannot get your all products on sale right now. Try again!"
                console.log(err);
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
    }
};


const GetDetailsOnProductIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'GetDetailsOnProduct';
    },
    async handle(handlerInput) {
        console.log('Get Details on Products - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const responseBuilder = handlerInput.responseBuilder;
        const userID = handlerInput.requestEnvelope.context.System.user.userId;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(slots);
        const productName = slotValues.productName.synonym;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var myDate = new Date();
        const date = myDate.toUTCString();
        return dbHelper.searchDetailsOnProduct(productName)
            .then((data) => {
                var speechText = "The shoes called "
                var speechText2 = " ,is an "
                var speechText3 = ", and is listed at "
                var speechText4 = " pounds, would you like to add it to your basket?"
                var speechText5 = " , would you like to add one of them to your basket?"
                if (data.length == 0) {
                    speechText = "There are no shoes with that name on our system"
                } else if ((data.map(e => e.category) == "") || (data.map(e => e.price) == "")) {
                    speechText = "The product does not have all basic information"
                } else if (data.length == 1) {
                    dbHelper.saveProductViews(userID, data, date)
                        .then((data) => {
                            console.log("Success saving book view on DB", data);
                        })
                        .catch((err) => {
                            console.log("Error occured while saving the book view", err);
                        });

                    sessionAttributes["productName"] = data[0].productName;
                    sessionAttributes["addItemToBasket"] = 1;
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                    speechText += data.map(e => e.productName) + speechText2 + data.map(e => e.category) + speechText3 + data.map(e => e.price) + speechText4
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(speechText)
                        .getResponse();
                } else if (data.length >= 2) {
                    sessionAttributes["addItemToBasket"] = 1;
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                    var list = forloopfunction(data);
                    speechText = "We have found more than just one title matching your given title, " + list + speechText5;
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(speechText)
                        .getResponse();
                }
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
            .catch((err) => {
                const speechText = "We cannot get the details on the product right now. Try again!"
                console.log(err);
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
    }
};

function forloopfunction(data) {
    var string = "";
    var counter = 1;
    for (i = 0; i < data.length; i++) {
        string += "Number " + counter++ + " " + data.map(e => e.productName + ",is a " + e.category + ", and is listed at " + e.price + " pounds").join(", ")[i];
    }
    console.log("the looping attempt  ", string);
    return string;
}

const InProgressAddItemToBasketHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AddMovieToBasket' && request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
        console.log('InProgressAddItemToBasketHandler - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
            .getResponse();
    },
};

const AddItemToBasket = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'AddMovieToBasket'
            && handlerInput.requestEnvelope.request.dialogState === "COMPLETED";
    },
    async handle(handlerInput) {
        console.log('Add to basket - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const userID = handlerInput.requestEnvelope.context.System.user.userId;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(filledSlots);
        let speechOutput = getRandomPhrase(speechIntroVariatons);
        speechOutput += "You have added ";
        // speechOutput = `${speechOutput} a ${slotValues.productType.synonym} called ${slotValues.productName.synonym} occured on ${slotValues.timeOfOccurance.synonym}`;
        var name = slotValues.productName.synonym;
        // var quantity = slotValues.quantity.synonym;
        var quantity = handlerInput.requestEnvelope.request.intent.slots.quantity.value;


        return dbHelper.searchMovie(name)
            .then((data) => {
                var moviedata = data;
                if (data.length == 0) {
                    var speechText = "There's no such product name in our store"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(speechText)
                        .getResponse();
                } else {
                    return dbHelper.checkBasket(userID, name)
                        .then((data) => {
                            var pdata = data;
                            if (data.length == 0) {
                                return dbHelper.addMovieToBasket(moviedata, userID, quantity)
                                    .then((data) => {
                                        speechOutput += data.quantity + " of " + data.productName
                                        return responseBuilder
                                            .speak(speechOutput)
                                            .reprompt(ALEXA_RESPONSES.reprompt)
                                            .getResponse();
                                    })
                                    .catch((err) => {
                                        console.log("Error occured while saving shoes", err);
                                        const speechText = "we cannot add to your basket right now. Try again!"
                                        return responseBuilder
                                            .speak(speechText)
                                            .reprompt(ALEXA_RESPONSES.reprompt)
                                            .getResponse();
                                    })
                            } else {
                                var dataset = {
                                    data: pdata,
                                    userID: userID,
                                    quantity: quantity,
                                    name: name
                                }
                                sessionAttributes["dataForBasket"] = dataset;
                                sessionAttributes["incrementBasketCheckIntent"] = 1;
                                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                                var speechText = "It seems like you already have this in your basket, would like to add this quantity to your basket?"
                                return responseBuilder
                                    .speak(speechText)
                                    .reprompt(ALEXA_RESPONSES.reprompt)
                                    .getResponse();
                            }
                        })
                        .catch((err) => {
                            console.log("Error occured while saving shoes", err);
                            const speechText = "we cannot add to your basket right now. Try again!"
                            return responseBuilder
                                .speak(speechText)
                                .reprompt(ALEXA_RESPONSES.reprompt)
                                .getResponse();
                        })
                }
            })
            .catch((err) => {
                const speechText = "An Error has occurred while adding your product"
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
    }
};

const InProgressRemoveItemFromBasketIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RemoveItemFromBasketIntent' && request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
        console.log('InProgressRemoveItemFromBasketIntent_Handler - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
            .getResponse();
    },
};

const RemoveItemFromBasketIntent_Handler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'RemoveItemFromBasketIntent'
            && handlerInput.requestEnvelope.request.dialogState === "COMPLETED";
    },
    async handle(handlerInput) {
        console.log('RemoveItemFromBasketIntent_Handler - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const userID = handlerInput.requestEnvelope.context.System.user.userId;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(filledSlots);
        var speechOutput = "";
        var name = slotValues.productName.synonym;

        return dbHelper.getBasket(userID)
            .then((data) => {
                if (data.length == 0) {
                    speechText = "Your basket is empty, please add an item first";
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(speechText)
                        .getResponse();
                } else {
                    return dbHelper.checkBasket(userID, name)
                        .then((data) => {
                            if (data.length == 0) {
                                speechOutput = "You don't have that item in your basket";
                                return responseBuilder
                                    .speak(speechOutput)
                                    .reprompt(ALEXA_RESPONSES.reprompt)
                                    .getResponse();
                            } else {
                                var dataset = {
                                    userID: userID,
                                    name: name
                                }
                                sessionAttributes["dataToDeleteFromBasket"] = dataset;
                                sessionAttributes["removeBasketItemIntent"] = 1;
                                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                                var speechText = "Do you really want to delete this item?"
                                return responseBuilder
                                    .speak(speechText)
                                    .reprompt(ALEXA_RESPONSES.reprompt)
                                    .getResponse();
                            }
                        })
                        .catch((err) => {
                            console.log("Error occured while saving shoes", err);
                            const speechText = "we cannot delete your item right now. Try again!"
                            return responseBuilder
                                .speak(speechText)
                                .reprompt(ALEXA_RESPONSES.reprompt)
                                .getResponse();
                        })
                }
            })
            .catch((err) => {
                console.log("Error occured while deleteing your basket item", err);
                const speechText = "We can not delete your item right now. Try again!"
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
    }
};


const InProgressRaiseTicketHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RaiseTicket' && request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
        console.log('InProgressRaiseTicketHandler - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
            .getResponse();
    },
};

const RaiseTicketIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RaiseTicket';
    },
    async handle(handlerInput) {
        console.log('RaiseTicketIntentHandler - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const userId = handlerInput.requestEnvelope.context.System.user.userId;
        const responseBuilder = handlerInput.responseBuilder;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(filledSlots);
        let speechOutput = getRandomPhrase(speechIntroVariatons);
        speechOutput += "You are about to raise a ticket about ";
        var productType = slotValues.productType.synonym;
        var productName = slotValues.productName.synonym;
        var time = slotValues.timeOfOccurance.synonym;
        sessionAttributes["raiseTicketIntent"] = 1;
        var dataset = {
            userId: userId,
            productType: productType,
            productName: productName,
            date: time
        }
        sessionAttributes["confirmOrder"] = 0;
        sessionAttributes["placeOrder"] = 0;
        sessionAttributes["dataForTicket"] = dataset;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        speechOutput = `${speechOutput} a ${productType} called ${productName} occured on ${time}, would like to submit this ticket to our team?`;
        return responseBuilder
            .speak(speechOutput)
            .reprompt(ALEXA_RESPONSES.reprompt)
            .getResponse();
    }
};

const InProgressComparisonIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'ComparisonIntent' && request.dialogState !== 'COMPLETED';
    },
    handle(handlerInput) {
        console.log('InProgressComparisonIntent_Handler - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
            .getResponse();
    },
};

const ComparisonIntentIntent_Handler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'ComparisonIntent';
    },
    async handle(handlerInput) {
        console.log('ComparisonIntentIntent_Handler - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));

        const userId = handlerInput.requestEnvelope.context.System.user.userId;
        const responseBuilder = handlerInput.responseBuilder;
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(filledSlots);
        var productName = slotValues.productName.synonym;
        let speechOutput = "So ";
        return dbHelper.getProductViews(userId, productName)
            .then((data) => {
                if (data.length == 0) {
                    speechOutput = "There are no recommendations for that product"
                } else {
                    // var sortedList = data.sort(function(a,b) {return (a.productName > b.productName) ? 1 : ((b.productName > a.productName) ? -1 : 0);} );

                    // var ages = uniqueBy(sortedList, "productName");
                    // function uniqueBy(arr, prop){
                    //   return arr.reduce((a, d) => {
                    //     if (!a.includes(d[prop])) { a.push(d[prop]); }
                    //     return a;
                    //   }, []);
                    // }
                    let count = data.reduce((res, val) => {
                        if (res[val.productName]) {
                            res[val.productName]++;
                        } else {
                            res[val.productName] = 1;
                        }
                        return res;
                    }, {});

                    let output = Object.entries(count)
                        .sort((a, b) => b[1] - a[1]) //2)
                        .map(v => v[0]); //3)

                    var text = "";
                    if (output.length == 1) {
                        for (i = 0; i < 1; i++) {
                            var names = output[i]
                            text += names + " ,";
                        }
                    } else if (output.length == 2) {
                        for (i = 0; i < 2; i++) {
                            var names = output[i]
                            text += names + " ,";
                        }
                    } else if (output.length == 3) {
                        for (i = 0; i < 3; i++) {
                            var names = output[i]
                            text += names + " ,";
                        }
                    } else if (output.length == 4) {
                        for (i = 0; i < 4; i++) {
                            var names = output[i]
                            text += names + " ,";
                        }
                    } else if (output.length >= 5) {
                        for (i = 0; i < 5; i++) {
                            var names = output[i]
                            text += names + " ,";
                        }
                    }

                    speechOutput += "We would recommend you " + text + " for more information about any of them, you can say, Get me details on, followed by the name of the product";
                }
                return responseBuilder
                    .speak(speechOutput)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
            .catch((err) => {
                console.log("Error occured while retrieving the comparision", err);
                const speechText = "We can not generate a recommendation right now. Try again!"
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })


    }
};

const YesIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
    },
    async handle(handlerInput) {
        console.log('Yes Intent - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;
        const sessionAttributes = attributesManager.getSessionAttributes();

        console.log('The sessions are: ', sessionAttributes);

        if (sessionAttributes["updateUsernameIntent"] === 1) {
            sessionAttributes["updateUsernameIntent"] = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            var userName = sessionAttributes["username"];
            return responseBuilder
                .addDelegateDirective({
                    name: 'UpdateUsernameIntent',
                    confirmationStatus: 'CONFIRMED',
                    slots: {
                        userName: {
                            name: 'userName',
                            value: userName,
                            confirmationStatus: 'NONE',
                            source: 'USER'
                        }
                    }
                })
                .getResponse();

        } else if (sessionAttributes["addItemToBasket"] === 1) {
            sessionAttributes["addItemToBasket"] = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            // var productName = sessionAttributes["productName"];
            // console.log('variable value is ', productName);
            return responseBuilder
                .addDelegateDirective({
                    name: 'AddMovieToBasket',
                    confirmationStatus: 'NONE',
                    slots: {
                        // productName: {
                        //   name: 'productName',
                        //   value: productName,
                        //   confirmationStatus: 'NONE',
                        //   source: 'USER'
                        // }
                    }
                })
                .getResponse();
        } else if (sessionAttributes["incrementBasketCheckIntent"] === 1) {
            sessionAttributes["incrementBasketCheckIntent"] = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            var data = sessionAttributes["dataForBasket"].data[0];
            var userID = sessionAttributes["dataForBasket"].userID;
            var quantity = sessionAttributes["dataForBasket"].quantity;
            var name = sessionAttributes["dataForBasket"].name;
            return dbHelper.incrementQuantityOnBasket(data, userID, quantity)
                .then((data) => {
                    return dbHelper.checkBasket(userID, name)
                        .then((data) => {
                            let speechOutput = getRandomPhrase(speechIntroVariatons);
                            speechOutput += "You have added ";
                            speechOutput += quantity + " of " + data.map(e => e.productName) + " bringing the total quantity up to " + data.map(e => e.quantity)
                            return responseBuilder
                                .speak(speechOutput)
                                .reprompt(ALEXA_RESPONSES.reprompt)
                                .getResponse();
                        })
                        .catch((err) => {
                            console.log("Error occured while saving shoes", err);
                            const speechText = "We can't launch right now"
                            return responseBuilder
                                .speak(speechText)
                                .reprompt(ALEXA_RESPONSES.reprompt)
                                .getResponse();
                        })
                })
                .catch((err) => {
                    console.log("Error occured while saving shoes", err);
                    const speechText = "we cannot add to your basket right now. Try again!"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
        } else if (sessionAttributes["removeBasketItemIntent"] === 1) {
            sessionAttributes["removeBasketItemIntent"] = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            var userID = sessionAttributes["dataToDeleteFromBasket"].userID;
            var name = sessionAttributes["dataToDeleteFromBasket"].name;

            return dbHelper.removeFromBasket(userID, name)
                .then((data) => {
                    return responseBuilder
                        .addDelegateDirective({
                            name: 'ShowMyBasket',
                            confirmationStatus: 'NONE',
                            slots: {}
                        })
                        .getResponse();
                })
                .catch((err) => {
                    console.log("Error occured while deleting an item", err);
                    const speechText = "We can not delete from the basket right now. Try again!"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })

        } else if (sessionAttributes["placeOrder"] === 1) {
            sessionAttributes["placeOrder"] = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            return responseBuilder
                .addDelegateDirective({
                    name: 'Checkout',
                    confirmationStatus: 'NONE',
                    slots: {}
                })
                .getResponse();
        } else if (sessionAttributes["confirmOrder"] === 1) {
            sessionAttributes["confirmOrder"] = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            console.log("ENTERING THE DELETE");
            var data = sessionAttributes["dataForOrder"].data;
            var userID = sessionAttributes["dataForOrder"].userID;
            var date = sessionAttributes["dataForOrder"].date;
            console.log("1111 is", data);
            console.log("2222 is", userID);
            console.log("3333 is", date);

            await dbHelper.placeOrder(data, userID, date)
                .then((data) => {
                    console.log("place order worked for", data);
                })
                .catch((err) => {
                    console.log("Error occured while placing the order", err);
                });

            for (i = 0; i < data.length; i++) {
                var name = data.map(e => e.productName)[i];
                dbHelper.deleteBasket(userID, name)
                    .then((data) => {
                        console.log("delete worked for", data);
                    })
                    .catch((err) => {
                        console.log("Error occured while deleting an item", err);
                    })
            }
            var speechText = "The order has been placed, what would you like to do?"
            return responseBuilder
                .speak(speechText)
                .reprompt(ALEXA_RESPONSES.reprompt)
                .getResponse();

        } else if (sessionAttributes["UpdateBasketItemIntent"] === 1) {
            sessionAttributes["UpdateBasketItemIntent"] = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            var userID = sessionAttributes["dataToUpdateFromBasket"].userId;
            var productName = sessionAttributes["dataToUpdateFromBasket"].productName;
            var quantity = sessionAttributes["dataToUpdateFromBasket"].quantity;

            return dbHelper.updateBasketItem(userID, productName, quantity)
                .then((data) => {
                    const speechText = "The product called " + productName + " has now been updated with a new quantity of " + quantity
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
                .catch((err) => {
                    console.log("Error occured while deleting an item", err);
                    const speechText = "We can not update basket item right now. Try again!"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })

        } else if (sessionAttributes["raiseTicketIntent"] === 1) {
            sessionAttributes["raiseTicketIntent"] = 0;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

            var userId = sessionAttributes["dataForTicket"].userId;
            var productType = sessionAttributes["dataForTicket"].productType;
            var productName = sessionAttributes["dataForTicket"].productName;
            var time = sessionAttributes["dataForTicket"].date;

            return dbHelper.saveComplaint(userId, productType, productName, time)
                .then((data) => {
                    speechOutput = "Thanks for your input, we will be in touch briefly";
                    return responseBuilder
                        .speak(speechOutput)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
                .catch((err) => {
                    console.log("Error occured while saving complaint", err);
                    const speechText = "We can not save your complaint right now. Try again!"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                })
        }
        else {
            return responseBuilder
                .speak(ALEXA_RESPONSES.reprompt)
                .reprompt(ALEXA_RESPONSES.reprompt)
                .getResponse();
        }


    },
};


const NoIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NoIntent';
    },
    async handle(handlerInput) {
        console.log('No Intent - Initiated');
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;
        const sessionAttributes = attributesManager.getSessionAttributes();

        sessionAttributes["username"] = "";
        return responseBuilder
            .speak(ALEXA_RESPONSES.reprompt)
            .reprompt(ALEXA_RESPONSES.reprompt)
            .getResponse();


    },
};


const ShowBasketItemsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'ShowMyBasket';
    },
    async handle(handlerInput) {
        const { responseBuilder } = handlerInput;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const userID = handlerInput.requestEnvelope.context.System.user.userId;
        return dbHelper.getBasket(userID)
            .then((data) => {
                console.log("the basket items are", data);
                var speechText = "Your basket will cost you "
                var pounds = " pounds"
                var and = " and "
                var pence = " p"
                var q = " , would you like to pay now?"
                var speechText = "Your basket has "
                if (data.length == 0) {
                    sessionAttributes["placeOrder"] = 0;
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                    speechText = "Your basket is empty, please add an item first"
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                } else {
                    var priceSum = 0;
                    for (i = 0; i < data.length; i++) {
                        priceSum += data.map(e => e.price)[i] * data.map(e => e.quantity)[i];
                    }
                    console.log("The PRICESUM is  ", priceSum)

                    var regex2 = /[0][1-9]/g;
                    var regex3 = /[1-9][0-9]/g;
                    var regex4 = /[0][0]/g;

                    var floati = parseFloat(priceSum).toFixed(2);
                    var words = floati.toString().split(/[.]+/);
                    var value = words[1];
                    var countDigits = value.toString().length;

                    if (countDigits == 2 && words[1].match(regex2)) {
                        var newWord = words[1].slice("")
                        speechText += data.map(e => e.quantity + " of " + e.productName).join(", ") + ", bringing the total up to " + words[0] + pounds + and + newWord[1] + pence + q
                    }
                    else if (countDigits == 2 && words[1].match(regex3)) {
                        speechText += data.map(e => e.quantity + " of " + e.productName).join(", ") + ", bringing the total up to " + words[0] + pounds + and + words[1] + pence + q
                    }
                    else if (countDigits == 2 && words[1].match(regex4)) {
                        speechText += data.map(e => e.quantity + " of " + e.productName).join(", ") + ", bringing the total up to " + words[0] + pounds + q
                    }
                    sessionAttributes["placeOrder"] = 1;
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                    return responseBuilder
                        .speak(speechText)
                        .reprompt(ALEXA_RESPONSES.reprompt)
                        .getResponse();
                }

            })
            .catch((err) => {
                const speechText = "We can't get your basket right now"
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })

    },
};

const CheckoutIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'Checkout';
    },
    async handle(handlerInput) {
        const { responseBuilder } = handlerInput;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const userID = handlerInput.requestEnvelope.context.System.user.userId;
        var myDate = new Date();
        const date = myDate.toUTCString();
        sessionAttributes["placeOrder"] = 0;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return dbHelper.getBasket(userID)
            .then((data) => {
                var pdata = data;
                var speechText = "Your basket will cost you ";
                var pounds = " pounds";
                var and = " and ";
                var pence = " p";
                var confirm = " , would you like to place this order?";
                if (data.length == 0) {
                    speechText = "You do not have anything to checkout, please add something to your basket first"
                } else {
                    var priceSum = 0;
                    for (i = 0; i < data.length; i++) {
                        priceSum += data.map(e => e.price)[i] * data.map(e => e.quantity)[i];
                    }
                    var regex2 = /[0][1-9]/g;
                    var regex3 = /[1-9][0-9]/g;
                    var regex4 = /[0][0]/g;

                    var floati = parseFloat(priceSum).toFixed(2);
                    var words = floati.toString().split(/[.]+/);
                    var value = words[1];
                    var countDigits = value.toString().length;

                    if (countDigits == 2 && words[1].match(regex2)) {
                        var newWord = words[1].slice("")
                        speechText += words[0] + pounds + and + newWord[1] + pence + confirm
                    }
                    else if (countDigits == 2 && words[1].match(regex3)) {
                        speechText += words[0] + pounds + and + words[1] + pence + confirm
                    }
                    else if (countDigits == 2 && words[1].match(regex4)) {
                        speechText += words[0] + pounds + confirm
                    }
                    console.log("$$$$ 1111 is", pdata);
                    console.log("$$$$ 1111 is", data);
                    console.log("$$$$ 2222 is", userID);
                    console.log("$$$$ 3333 is", date);
                    var dataset = {
                        data: pdata,
                        userID: userID,
                        date: date
                    }
                    sessionAttributes["dataForOrder"] = dataset;
                    sessionAttributes["confirmOrder"] = 1;
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                }
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
            .catch((err) => {
                const speechText = "We can't check out right now"
                return responseBuilder
                    .speak(speechText)
                    .reprompt(ALEXA_RESPONSES.reprompt)
                    .getResponse();
            })
    },
};


const FAQIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' && handlerInput.requestEnvelope.request.intent.name === 'FAQ';
    },
    handle(handlerInput) {
        const speechText = "Please check the screen of your Alexa device for more information"
        const url = ", Or Visit, greglak, Dot, github, Dot, io, fore slash, F A Q for more information"

        return handlerInput.responseBuilder
            .speak(speechText + url)
            .withSimpleCard('The FAQ questions are featured on https://greglak.github.io/faq')
            .reprompt(ALEXA_RESPONSES.reprompt)
            .getResponse();
    },
};

function getSlotValues(filledSlots) {
    const slotValues = {};

    console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;

        if (filledSlots[item] &&
            filledSlots[item].resolutions &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case 'ER_SUCCESS_MATCH':
                    slotValues[name] = {
                        synonym: filledSlots[item].value,
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        isValidated: true,
                    };
                    break;
                case 'ER_SUCCESS_NO_MATCH':
                    slotValues[name] = {
                        synonym: filledSlots[item].value,
                        resolved: filledSlots[item].value,
                        isValidated: false,
                        ERstatus: 'ER_SUCCESS_NO_MATCH'
                    };
                    break;
                default:
                    break;
            }
        } else {
            slotValues[name] = {
                synonym: filledSlots[item].value,
                resolved: filledSlots[item].value,
                isValidated: false,
                heardAs: filledSlots[item].value || ''
            };
        }
    }, this);

    return slotValues;
}

function getRandomPhrase(array) {
    const i = Math.floor(Math.random() * array.length);
    return (array[i]);
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = handlerInput.t('HELP_MSG');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const StopIntentHandler = { //allow the use to stop the current skill entirely and close the application.
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent';
    },
    handle(handlerInput) {
        var speechOutput = ALEXA_RESPONSES.stopMessageSpeak;
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};


/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speechOutput = "I do not know that command";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log('Stringified Handler Input is ', JSON.stringify(handlerInput));
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = handlerInput.t('REFLECTOR_MSG', { intentName: intentName });

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const CancelIntentHandler = { //allow the user to cancel the currnt command and select something new
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent';
    },
    handle(handlerInput) {
        var speechOutput = "Okay, what would you like to do?";
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(ALEXA_RESPONSES.reprompt) //give the user another chance to say something.
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
            .speak('Sorry, I can not understand the command. Please say again.')
            .reprompt('Sorry, I can not understand the command. Please say again.')
            .getResponse();
    },
};

// This request interceptor will bind a translation function 't' to the handlerInput
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        i18n.init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            resources: languageStrings
        }).then((t) => {
            handlerInput.t = (...args) => t(...args);
        });
    }
};
/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GetUserNameIntent_Handler,
        InProgressAddUserNameIntent_Handler,
        AddUsernameIntent_Handler,
        InProgressUpdateUsernameIntent_Handler,
        UpdateUsernameIntent_Handler,
        ListProductTypesIntent_Handler,
        FilterByProductTypesOnSaleIntent_Handler,
        FilterProductsByTypeIntent_Handler,
        FilterAllProductsOnSaleIntent_Handler,
        GetDetailsOnProductIntent_Handler,
        InProgressAddItemToBasketHandler,
        AddItemToBasket,
        ShowBasketItemsIntentHandler,
        InProgressRemoveItemFromBasketIntent_Handler,
        RemoveItemFromBasketIntent_Handler,
        InProgressUpdateBasketItemIntent_Handler,
        UpdateBasketItemIntent_Handler,
        CheckoutIntentHandler,
        FAQIntentHandler,
        YesIntent,
        NoIntent,
        InProgressRaiseTicketHandler,
        RaiseTicketIntentHandler,
        InProgressComparisonIntent_Handler,
        ComparisonIntentIntent_Handler,
        CancelIntentHandler,
        HelpIntentHandler,
        StopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(LocalisationRequestInterceptor)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();