const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const _request = require('request');
var bodyParser = require('body-parser');
admin.initializeApp(functions.config().firebase);

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true })); // << for what you just defined

app.post("/searchPlaces", (request, _response) => {
    if (request.body.query && request.body.token) {
        _request('https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + request.body.query + '&key=AIzaSyCj7_x58Uz5YoElBPmI3lw6GaAzTTCBoOw&region=eg&pagetoken=' + request.body.token, function (error, response, body) {
            if (error) {
                _response
                    .status(400)
                    .send(error);
            } else {
                _response
                    .status(200)
                    .send(response);
            }
        });
    } else if (request.body.query) {
        _request('https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + request.body.query + '&key=AIzaSyCj7_x58Uz5YoElBPmI3lw6GaAzTTCBoOw&region=eg', function (error, response, body) {
            if (error) {
                _response
                    .status(400)
                    .send(error);
            } else {
                console.log('https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + request.body.query + '&key=AIzaSyDstXJe23Gf3zZp3XxlkfPz0FNatD_Y0eE&region=eg');
                console.log('returned ' + response);
                _response
                    .status(200)
                    .send(response);
            }
        });
    } else {
        console.log("INCOMLENTE PARAMETERS");
        console.log(request.body);
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

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

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

const getDishes = (budget, cb, error) => {
    var places = [];
    var db = admin.firestore();
    db
        .collection("dishes")
        .where("price", "<", budget)
        .get()
        .then(function (dish_results) {
            var lowest_price = Number.MAX_SAFE_INTEGER;
            for (var i = 0; i < dish_results.size; i++) {
                if (lowest_price > dish_results.docs[i].data().price) {
                    lowest_price = dish_results
                        .docs[i]
                        .data()
                        .price;
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
    db
        .collection("drinks")
        .where("price", "<=", budget)
        .get()
        .then(function (drinks_results) {
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
    db
        .collection("drinks")
        .where("price", "<=", budget)
        .where("place", "==", dish.place)
        .get()
        .then(function (drinks_results) {
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

const getPlace = (placeID, cb, error, location = null) => {
    var db = admin.firestore();
    db
        .collection("places")
        .doc(placeID)
        .get()
        .then(function (doc) {
            if (location) {
                var place = doc.data();
                db
                    .collection("branches")
                    .doc(placeID)
                    .get()
                    .then((branches) => {
                        try {
                            var branches_arr = branches
                                .data()
                                .branches;

                            var shortestDistance = Number.MAX_SAFE_INTEGER;
                            var shortestDistanceIndex = -1;
                            for (var i = 0; i < branches_arr.length; i++) {
                                var branchLat = branches_arr[i].geometry.lat;
                                var branchLng = branches_arr[i].geometry.lng;
                                var currentDistance = getDistanceFromLatLonInKm(location.lat, location.lng, branchLat, branchLng);
                                if (currentDistance < shortestDistance) {
                                    shortestDistance = currentDistance;
                                    shortestDistanceIndex = i;
                                }
                            }
                            if (branches_arr.length > 0) {
                                place['shortestDistance'] = shortestDistance.toFixed(2);
                                place['nearestBranch'] = branches_arr[shortestDistanceIndex];
                                place['branches'] = branches_arr;
                            }
                            cb(place);
                        } catch (err) {
                            console.log("ERR IN GETTING BRANCH OF " + place.name);
                            console.log(err);
                            cb(place);
                        }
                    })
                    .catch((error) => {
                        console.log("ERROR IN QUERY");
                        console.log(error);
                    });
            } else {
                cb(doc.data());
            }
        })
        .catch(function (error) {
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

const getRecommendationsRecursive2 = (budget, dishes, results, cb, error) => { }

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
        if (arr[i].place == place)
            return i;
    }
    return -1;
}

const insertResult = (arr, result) => {
    var localResult = {};
    var placeExistsIndex = placeExists(arr, result.place);
    if (arr.length == 0 || placeExistsIndex == -1) {
        localResult.place = result.place;
        localResult.results = [
            {
                "dish": result.dish,
                "drink": result.drink,
                "totalPrice": result.totalPrice
            }
        ];
        arr.push(localResult);
    } else {
        localResult = {
            "dish": result.dish,
            "drink": result.drink,
            "totalPrice": result.totalPrice
        };
        arr[placeExistsIndex]
            .results
            .push(localResult);
        if (arr[placeExistsIndex].results.length == 5)
            return false;
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
        } else {
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
    } else {
        var drinks = [];
        var localResult = {};
        var currentDish = dishes[0];
        var drinksBudget = budget - currentDish.price;

        getDrinkForDish(currentDish, drinksBudget, (result) => {
            drinks = result;

            // If no drinks found, discard the current dish and start all over
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
/*
    var i = a.length;
    while (i--) {
        if (a[i].place == place) {
            a.splice(i, 1);
        }
    }
*/
const getPlacesInfo = (results, cb, i = 0, location = null, tags) => {
    if (tags) {
        console.log("GET PLACES INFO: I HAVE TAGS with i = " + i);
    }
    if (i == results.length) {
        var j = results.length;
        while (j--) {
            console.log('CURRENT TAGS = ');
            var currentTags = results[j].place.tags;
            console.log(currentTags);
            if (currentTags) {
                for (const key of Object.keys(currentTags)) {
                    console.log(key, currentTags[key]);
                    if (!currentTags[key] && tags[key]) {
                        results.splice(j, 1);
                        break;
                    } else { }
                }
            }
        }
        cb(results);
    } else {
        getPlace(results[i].place, (place) => {
            var placeCode = results[i].place;
            results[i].place = place;
            results[i].place.id = placeCode;
            getPlacesInfo(results, cb, ++i, location, tags);
        }, (error) => { }, location);
    }
}

const getRecommendations = (budget, cb, error, location = null, tags) => {
    if (tags) {
        console.log("1) I HAVE TAGS");
        console.log(tags);
    } else { }
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
            }, 0, location, tags);

        }, (error) => {
            error(error);
        });
    }, (error) => {
        error(error);
    });

}

app.post("/budgetSearch", (request, response) => {
    console.log("REQEST BODY");
    console.log(request.body);
    if (request.method != "POST") {
        response
            .status(400)
            .send({ "Error": "Unsupported HTTP Request" });
        return;
    }
    if (request.body.budget && request.body.people && request.body.location && request.body.tags) {
        console.log("starting clean function with location");
        var budget = parseInt(request.body.budget);
        var people = parseInt(request.body.people);
        var location = request.body.location;
        var tags = request.body.tags;
        getRecommendations(budget, (results) => {
            response
                .status(200)
                .send(results);
        }, (error) => {
            response
                .status(400)
                .send(error);
        }, location, tags);
    } else if (request.body.budget && request.body.people && request.body.tags) {
        console.log("starting clean function");
        var budget = parseInt(request.body.budget);
        var people = parseInt(request.body.people);
        var tags = request.body.tags;
        getRecommendations(budget, (results) => {
            response
                .status(200)
                .send(results);
        }, (error) => {
            response
                .status(400)
                .send(error);
        }, null, tags);
    } else {
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

app.post("/login", (request, response) => {
    if (request.body.uid) {
        console.log("starting clean function");
        var uid = request.body.uid;
        var db = admin.firestore();
        db
            .collection("users")
            .doc(uid)
            .get()
            .then(function (doc) {
                if (doc.exists) {
                    console.log(doc.data());
                    const user = {
                        uid: uid,
                        name: doc
                            .data()
                            .name,
                        email: doc
                            .data()
                            .email,
                        city: doc
                            .data()
                            .city,
                        mobile: doc
                            .data()
                            .mobile,
                        favPlaces: doc
                            .data()
                            .favPlaces
                    };
                    response
                        .status(200)
                        .send({ 'user': user });
                } else {
                    response
                        .status(400)
                        .send({ 'user': null });
                }
            })
            .catch(function (error) {
                response
                    .status(400)
                    .send({ 'user': null, 'error': error });
            });
    } else {
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

app.post("/register", (request, response) => {
    if (request.body.user) {
        var user = request.body.user;
        var db = admin.firestore();
        db
            .collection("users")
            .doc(user.uid)
            .set(user)
            .then(function () {
                response
                    .status(200)
                    .send({ 'status': 'OK' })
            })
            .catch(function (error) {
                response
                    .status(200)
                    .send({ 'error': error })
            });
    } else {
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

app.post("/deleteUser", (request, response) => {
    if (request.body.uid) {
        var uid = request.body.uid;
        admin
            .auth()
            .deleteUser(uid)
            .then(function () {
                var db = admin.firestore();
                db
                    .collection("users")
                    .doc(uid)
                    .delete()
                    .then(function () {
                        response
                            .status(200)
                            .send({ 'status': 'OK' });
                    })
                    .catch(function (error) {
                        response
                            .status(400)
                            .send({ 'Error': error });
                    });
            })
            .catch(function (error) {
                response
                    .status(400)
                    .send({ "Error": error });
            });
    } else {
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

app.post("/registerNewUser", (request, response) => {
    if (request.body.user) {
        var user = request.body.user;
        admin
            .auth()
            .createUser({ email: user.email, password: user.password, displayName: user.name })
            .then(function (userRecord) {
                var db = admin.firestore();
                delete user.password;
                user.favPlaces = {};
                user.uid = userRecord.uid;
                db
                    .collection("users")
                    .doc(user.uid)
                    .set(user)
                    .then(function () {
                        response
                            .status(200)
                            .send({ 'status': 'OK', 'user': user });
                    })
                    .catch(function (error) {
                        response
                            .status(200)
                            .send({ 'error': error });
                    });
            })
            .catch(function (error) {
                console.log("Error updating user:", error);
                response
                    .status(400)
                    .send({ 'Error': error });
            });
    } else {
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

app.post("/newAd", (request, response) => {
    if (request.body.ad) {
        var ad = request.body.ad;
        console.log('started getting all ads');
        var db = admin.firestore();
        var results = [];
        var fromParts = ad
            .from
            .split('/');
        var fromDate = new Date(fromParts[2], fromParts[1] - 1, fromParts[0]);
        var toParts = ad
            .to
            .split('/');
        var toDate = new Date(toParts[2], toParts[1] - 1, toParts[0]);
        var current = Date.now();

        if (ad.enabled) {
            if (current >= fromDate && toDate >= current) {
                ad['status'] = 'Active';
            } else {
                ad['status'] = 'Inactive';
            }
        } else {
            ad['status'] = 'Disabled';
        }
        db
            .collection('ads')
            .add(ad)
            .then((doc) => {
                ad['uid'] = doc.id;
                response
                    .status(200)
                    .send({ 'result': ad });
            })
            .catch((error) => {
                response
                    .status(400)
                    .send({ 'error': error });
            });
    } else {
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

const getAllLocationsHelper = async (cb, e) => {
    var results = [];
    try {
        var locs = await db
            .collection('locations')
            .get();
        locs.forEach(doc => {
            var tempLoc = doc.data();
            tempLoc['uid'] = doc.id;
            tempLoc['states'] = [];
            results.push(tempLoc);
        });
        for (var i = 0; i < results.length; i++) {
            var states = await db.collection('locations')
                .doc(results[i].uid).collection('states')
                .get();
            states.forEach(state => {
                var tempState = state.data();
                tempState['uid'] = state.id;
                tempState['areas'] = [];
                results[i].states.push(tempState);
            });
            for (var j = 0; j < states.size; j++) {
                var areas = await db.collection('locations')
                    .doc(results[i].uid).collection('states')
                    .doc(results[i].states[j].uid).collection('areas').get();
                areas.forEach(area => {
                    var tempArea = area.data();
                    tempArea['uid'] = area.id;
                    results[i].states[j].areas.push(tempArea);
                });
            }
        }
        cb(results);
    }
    catch (err) {
        e(err);
    }
}

app.post("/getAllLocations", (request, response) => {
    var db = admin.firestore;
    var results = [];
    getAllLocationsHelper((results) => {
        response
            .status(200)
            .send(results);
    }, (error) => {
        response
            .status(400)
            .send({ 'error': error });
    });
});

app.post("/getAllAds", (request, response) => {
    console.log('started getting all ads');
    var db = admin.firestore();
    var results = [];
    db
        .collection('ads')
        .get()
        .then((adResults) => {
            console.log('got ' + adResults.size + ' result');
            for (var i = 0; i < adResults.size; i++) {
                var temp = adResults
                    .docs[i]
                    .data();
                var fromParts = temp
                    .from
                    .split('/');
                var fromDate = new Date(fromParts[2], fromParts[1] - 1, fromParts[0]);
                var toParts = temp
                    .to
                    .split('/');
                var toDate = new Date(toParts[2], toParts[1] - 1, toParts[0]);
                var current = Date.now();

                if (temp.enabled) {
                    if (current >= fromDate && toDate >= current) {
                        temp['status'] = 'Active';
                    } else {
                        temp['status'] = 'Inactive';
                    }
                } else {
                    temp['status'] = 'Disabled';
                }
                temp['uid'] = adResults.docs[i].id;
                results.push(temp);
            }
            response
                .status(200)
                .send({ 'results': results });
        })
        .catch((error) => {
            console.log('error is ' + error);
            response
                .status(400)
                .send({ 'error': error });
        });
});

app.post("/addFavPlace", (request, response) => {
    if (request.body.user && request.body.place) {
        var user = request.body.user;
        var placeID = request.body.place.id;
        user.favPlaces[placeID] = request.body.place;
        var db = admin.firestore();
        db
            .collection("users")
            .doc(user.uid)
            .set(user)
            .then(function () {
                response
                    .status(200)
                    .send({ 'status': 'OK' })
            })
            .catch(function (error) {
                response
                    .status(200)
                    .send({ 'error': error })
            });
    } else {
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

app.post("/removeFavPlace", (request, response) => {
    if (request.body.user && request.body.placeID) {
        var user = request.body.user;
        var placeID = request.body.placeID;
        delete user.favPlaces[placeID];
        var db = admin.firestore();
        db
            .collection("users")
            .doc(user.uid)
            .set(user)
            .then(function () {
                response
                    .status(200)
                    .send({ 'status': 'OK' })
            })
            .catch(function (error) {
                response
                    .status(200)
                    .send({ 'error': error })
            });
    } else {
        response
            .status(400)
            .send({ "Error": "Incomplete Parameters" });
    }
});

const api = functions
    .https
    .onRequest(app)
module.exports = {
    api
}