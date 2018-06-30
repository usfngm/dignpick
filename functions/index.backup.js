const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const request = require('request');
admin.initializeApp(functions.config().firebase);



/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const getDishes = (budget, cb, error) => {
    var places = [];
    var db = admin.firestore();
    db.collection("dishes").where("price", "<", budget)
        .get()
        .then(function (dish_results) {
            var lowest_price = Number.MAX_SAFE_INTEGER;
            for (var i = 0; i < dish_results.size; i++) {
                if (lowest_price > dish_results.docs[i].data().price) {
                    lowest_price = dish_results.docs[i].data().price;
                }
                places.push(dish_results.docs[i].data());
            }
            shuffle(places);
            cb(places, lowest_price);
        })
        .catch(function (error) {
            error(error);
            return;
        });
}

const getDrinks = (budget, cb, err) => {
    var db = admin.firestore();
    var drinks = [];
    db.collection("drinks")
        .where("price", "<=", budget)
        .get().then(function (drinks_results) {
            for (var i = 0; i < drinks_results.size; i++) {
                drinks.push(drinks_results.docs[i].data());
            }
            shuffle(drinks);
            cb(drinks);
        })
        .catch((error) => {
            console.log("howa fi eh?");
            console.log(error);
            err(error);
        });
}

const getDrinkForDish = (dish, budget, cb, error) => {
    var db = admin.firestore();
    var drinks = [];
    db.collection("drinks")
        .where("price", "<=", budget)
        .where("place", "==", dish.place)
        .get().then(function (drinks_results) {
            for (var i = 0; i < drinks_results.size; i++) {
                drinks.push(drinks_results.docs[i].data());
            }
            shuffle(drinks);
            cb(drinks);
        })
        .catch(function (error) {
            error(error);
            return;
        });
}

const getPlace = (place, cb, error) => {
    var db = admin.firestore();
    db.collection("places").doc(place).get().then(function (doc) {
        cb(doc.data());
    }).catch(function (error) {
        error(error);
    });
}

const freeArrayOfPlace = (a, place) => {
    var i = a.length;
    while (i--) {
        if (a[i].place == place) {
            a.splice(i, 1);
        }
    }
}

const getRecommendationsRecursive2 = (budget, dishes, results, cb, error) => {

}

const getDrinkForDish3 = (dish, drinks, budget) => {
    var drinkBudget = budget - dish.price;
    shuffle(drinks);
    for (var i = 0; i < drinks.length; i++) {
        if (drinks[i].place == dish.place && drinks[i].price <= drinkBudget) {
            return drinks[i];
        }
    }
    return null;
}

const placeExists = (arr, place) => {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].place == place) return i;
    }
    return -1;
}

const insertResult = (arr, result) => {
    var localResult = {};
    var placeExistsIndex = placeExists(arr, result.place);
    if (arr.length == 0 || placeExistsIndex == -1) {
        localResult.place = result.place;
        localResult.results =
            [
                {
                    "dish": result.dish,
                    "drink": result.drink,
                    "totalPrice": result.totalPrice
                }
            ];
        arr.push(localResult);
    }
    else {
        localResult =
            {
                "dish": result.dish,
                "drink": result.drink,
                "totalPrice": result.totalPrice
            };
        arr[placeExistsIndex].results.push(localResult);
        if (arr[placeExistsIndex].results.length == 5) return false;
    }
    return true;
}

const getRecommendations3 = (dishes, drinks, budget) => {
    var finalResult = [];
    while (dishes.length != 0) {
        var localResult = {};
        var currentDish = dishes[0];
        var currentDrink = getDrinkForDish3(currentDish, drinks, budget);
        if (!currentDrink) {
            dishes.splice(0, 1);
        }
        else {
            localResult.place = currentDish.place;
            localResult.drink = currentDrink;
            localResult.dish = currentDish;
            localResult.totalPrice = currentDish.price + currentDrink.price;
            if (!insertResult(finalResult, localResult)) {
                freeArrayOfPlace(dishes, currentDish.place);
                freeArrayOfPlace(drinks, currentDish.place);
            }
            dishes.splice(0, 1);
        }
    }
    return finalResult;
}
const getRecommendationsRecursive = (budget, dishes, results, cb, error) => {
    if (dishes.length == 0) {
        cb();
        return;
    }
    else {
        var drinks = [];
        var localResult = {};
        var currentDish = dishes[0];
        var drinksBudget = budget - currentDish.price;

        getDrinkForDish(currentDish, drinksBudget, (result) => {
            drinks = result;

            // If no drinks found, discard the current dish
            // and start all over
            if (drinks.length == 0) {
                dishes.splice(0, 1);
                return getRecommendationsRecursive(budget, dishes, results, cb);
            }


            getPlace(currentDish.place, (result) => {
                // Construct a local result object
                localResult.place = result;
                localResult.dish = [currentDish];
                localResult.drink = [drinks[0]];
                localResult.totalPrice = currentDish.price + drinks[0].price;

                // Push local result object into the global one
                results.push(localResult);

                // Delete place to eliminate redundency
                freeArrayOfPlace(dishes, currentDish.place);

                return getRecommendationsRecursive(budget, dishes, results, cb);
            }, (error) => {
                error(error);
                return;
            });

        }, (error) => {
            error(error);
            return;
        });
    }
}

const getPlacesInfo = (results, cb, i = 0) => {

    if (i == results.length) {
        cb(results);
    }
    else {
        getPlace(results[i].place, (place) => {
            var placeCode = results[i].place;
            results[i].place = place;
            results[i].place.id = placeCode;
            getPlacesInfo(results, cb, ++i);
        }, (error) => {

        });
    }
}

const getRecommendations = (budget, cb, error) => {
    // Get all dishes that fits the budget
    var dishes = [];
    var results = [];

    getDishes(budget, (result, lowest_price) => {
        dishes = result;
        drink_budget = budget - lowest_price;
        getDrinks(drink_budget, (drinks) => {
            var results = getRecommendations3(dishes, drinks, budget);
            getPlacesInfo(results, (final) => {
                cb(final);
            });

        }, (error) => {
            error(error);
        });
    }, (error) => {
        error(error);
    });

}

exports.search = functions.https.onRequest((request, response) => {
    console.log("REQEST BODY");
    console.log(request.body);
    if (request.method != "POST") {
        response.status(400).send({ "Error": "Unsupported HTTP Request" });
        return;
    }
    if (request.body.budget && request.body.people) {
        console.log("starting clean function");
        var budget = parseInt(request.body.budget);
        var people = parseInt(request.body.people);
        getRecommendations(budget, (results) => {
            response.status(200).send(results);
        }, (error) => {
            response.status(400).send(error);
        });
    }
    else {
        response.status(400).send({ "Error": "Incomplete Parameters" });
    }
});

exports.searchPlacesCors = functions.https.onRequest((request, response) => {
    var corsFn = cors();
    corsFn(request, response, () => {
        searchPlaces(request, response);
    })
});

var searchPlaces = functions.https.onRequest((request, response) => {
    if (request.method != "POST") {
        response.status(400).send({ "Error": "Unsupported HTTP Request" });
        return;
    }
    if (request.body.query) {
        request('https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + request.body.query + '&key=AIzaSyDstXJe23Gf3zZp3XxlkfPz0FNatD_Y0eE&region=eg', function (error, response, body) {
            if (error) {
                response.status(400).send(error);
            }
            else {
                response.status(200).send(response);
            }
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
        });
    }
    else {
        console.log("INCOMLENTE PARAMETERS");
        console.log(request.body);
        response.status(400).send({ "Error": "Incomplete Parameters" });
    }
});

exports.login = functions.https.onRequest((request, response) => {
    if (request.method != "POST") {
        response.status(400).send({ "Error": "Unsupported HTTP Request" });
        return;
    }
    if (request.body.uid) {
        console.log("starting clean function");
        var uid = request.body.uid;
        var db = admin.firestore();
        db.collection("users").doc(uid).get()
            .then(function (doc) {
                if (doc.exists) {
                    console.log(doc.data());
                    const user = {
                        uid: uid,
                        name: doc.data().name,
                        email: doc.data().email,
                        city: doc.data().city,
                        mobile: doc.data().mobile
                    };
                    response.status(200).send({ 'user': user });
                } else {
                    response.status(400).send({ 'user': null });
                }
            }).catch(function (error) {
                response.status(400).send({ 'user': null, 'error': error });
            });
    }
    else {
        response.status(400).send({ "Error": "Incomplete Parameters" });
    }
});