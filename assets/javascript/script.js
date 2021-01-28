$(document).ready(function () {
    $("#modal1").modal();
    $("#modal-recipe-div").modal();

    var currentDay = new Date("yyyy-MM-dd hh:mm:ss");
    var oneHundredYearsPast = new Date();
    oneHundredYearsPast.setFullYear(oneHundredYearsPast.getFullYear() - 100);
    var liquorArray = ["Vodka", "Gin", "Bourbon", "Whiskey", "Tequila", "Beer", "Wine"];
    var temporaryRecipeArray = [];
    var savedRecipesArray = [];
    var indexOfSavedRecipe;

    loadLiquors();

    //Materialize method call that runs the datepicker for the landing page with a range of 100 years passed in.
    $('.datepicker').datepicker({ yearRange: 100, minDate: oneHundredYearsPast, maxDate: new Date() });

    $("#submit-birthday").on("click", function () {
        var usersBirthday = $("#user-birthday").val();
        console.log(usersBirthday);
        var age = moment().diff(moment(usersBirthday, "LL"), "years");
        console.log(age);
        if (usersBirthday !== "") {
            if (age < 21) {
                $("#modal1").modal("open");
            }
            else {
                window.location.href = "./assets/html/homepage.html";
            }
        }
    });

    //Materialize method call that runs the sidenav bar when page shrinks to mobile size.
    $('.sidenav').sidenav();

    //Materialize method call that runs the selector forms.
    $('select').formSelect();



    //Liquor list is dynamically loaded with this function using array of liquors at top. 
    function loadLiquors() {
        for (i = 0; i < liquorArray.length; i++) {
            var newOption = $("<option>");
            newOption.addClass("liquor");
            newOption.attr("value", liquorArray[i]);
            newOption.text(liquorArray[i]);

            $("#liquor-list").append(newOption);
        }
    }

    //On click of the go button, the ajax call starts and takes value of liquor selector as input.
    $("#submitButton").on("click", function () {
        $("#response-data").empty();

        var liquorSelection = $("#liquor-list").val();
        var recipeCount = $("#recipe-count").val();

        var queryUrl = "https://the-cocktail-db.p.rapidapi.com/filter.php?i=" + liquorSelection;

        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": queryUrl,
            "method": "GET",
            "headers": {
                "x-rapidapi-key": "d27507a0ccmsh9a6fcf79498d5ffp1c8025jsndb62b327bc90",
                "x-rapidapi-host": "the-cocktail-db.p.rapidapi.com"
            }
        }).done(function (response) {
            console.log(response);

            addRecipeToPage(response, recipeCount);
        });
    });

    //This function takes the response from the original ajax call and uses a random number generator to pick a recipe from the response object.
    //The recipe is then passed through a new ajax call that uses the id to get the full recipe information. All info is passed into a dynamically 
    // created card and appended to the page.
    function addRecipeToPage(response, recipeCount) {
        var recipeDiv = $("#response-data");
        var currentRecipeObject;

        //TODO: Need to fix issue with random number generator for cocktail recipe pulling up same recipe more than once.
        var currentRandomNumberArray = [];

        if (response.drinks.length <= recipeCount) {
            for (i = 0; i < response.drinks.length; i++) {
                recipeAjaxCall(i);
            };
        }
        else {
            for (i = 0; i < recipeCount; i++) {
                var randomNumber = generateRandomNumber();
                function generateRandomNumber() {
                    randomNumber = Math.floor(Math.random() * response.drinks.length);
                    if (currentRandomNumberArray.includes(randomNumber)) {
                        generateRandomNumber();
                    }
                    else {
                        currentRandomNumberArray.push(randomNumber);
                        recipeAjaxCall(randomNumber);
                    }
                }
            }
        }

        function sendRecipesToTempArray(currentRecipeObject) {
            var recipeName = currentRecipeObject.strDrink;
            var currentRecipeObject = {
                name: recipeName,
                recipeObject: currentRecipeObject
            }
            temporaryRecipeArray.push(currentRecipeObject);
        }

        function recipeAjaxCall(i) {
            var queryUrl = "https://the-cocktail-db.p.rapidapi.com/lookup.php?i=" + response.drinks[i].idDrink;

            $.ajax({
                "async": true,
                "crossDomain": true,
                "url": queryUrl,
                "method": "GET",
                "headers": {
                    "x-rapidapi-key": "d27507a0ccmsh9a6fcf79498d5ffp1c8025jsndb62b327bc90",
                    "x-rapidapi-host": "the-cocktail-db.p.rapidapi.com"
                }
            }).done(function (fullRecipeResponse) {
                console.log(fullRecipeResponse);

                var newCardDiv = $("<div>").addClass("card");

                var newCardImageDiv = $("<div>").addClass("card-image");
                var drinkImage = $("<img>");
                drinkImage.attr("src", fullRecipeResponse.drinks[0].strDrinkThumb);

                newCardImageDiv.html("<a class='open-recipe btn-floating halfway-fab waves-effect waves-light red' href='#modal-recipe-div'data-value=" + JSON.stringify(fullRecipeResponse.drinks[0].strDrink) + "><i class='material-icons'>add</i></a>").append(drinkImage)

                var newCardContentDiv = $("<div>").addClass("card-content");
                var cardContentPTag = $("<p>").text(fullRecipeResponse.drinks[0].strDrink).addClass("center").attr("id", "card-recipe-name");
                newCardContentDiv.append(cardContentPTag);

                newCardDiv.append(newCardImageDiv, newCardContentDiv);
                recipeDiv.append(newCardDiv);

                sendRecipesToTempArray(fullRecipeResponse.drinks[0]);
            });
        }
    }

    //TODO: Add functionality to the card button.
    $(document).on("click", ".open-recipe", function () {
        // clearRecipeModal();

        $("#modal-recipe-div").modal("open");

        var currentRecipe;

        for (i = 0; i < temporaryRecipeArray.length; i++) {
            if (temporaryRecipeArray[i].name === this.dataset.value) {
                indexOfSavedRecipe = i;
                currentRecipe = temporaryRecipeArray[i].recipeObject;
            }
        }

        $("#modal-recipe-image").attr("src", currentRecipe.strDrinkThumb);

        $("#modal-recipe-name").text(currentRecipe.strDrink);

        var ingredientCount = 1;
        var ingredientProp;
        while (currentRecipe[ingredientProp] !== null) {
            ingredientProp = "strIngredient" + ingredientCount;

            var measureProp = "strMeasure" + ingredientCount;

            if (currentRecipe[ingredientProp] !== null && currentRecipe[measureProp] !== null) {
                var newIngredientsListItem = $("<li>").text(currentRecipe[ingredientProp] + " - " + currentRecipe[measureProp]);
            }
            else if (currentRecipe[measureProp] !== null) {
                var newIngredientsListItem = $("<li>").text(currentRecipe[ingredientProp]);
            }
            $("#modal-recipe-ingredients").append(newIngredientsListItem);
            ingredientCount++;
        }

        $("#modal-recipe-instructions").text(currentRecipe.strInstructions);
    });

    $(document).on("click", "#save-recipe-button", function () {
        var localStorageArray = JSON.parse(localStorage.getItem("savedRecipesArray"));
        console.log(localStorageArray);

        if(localStorageArray !== null) {
            savedRecipesArray = localStorageArray;
        }

        var nameCount = 0;

        for(i = 0; i < savedRecipesArray.length; i++) {
            if(savedRecipesArray[i].name === temporaryRecipeArray[indexOfSavedRecipe].name) {
                nameCount++;
            }
        }
        if(nameCount < 1) {
            savedRecipesArray.push(temporaryRecipeArray[indexOfSavedRecipe]);
        }
        
        localStorage.setItem("savedRecipesArray", JSON.stringify(savedRecipesArray));

    });

    function clearRecipeModal() {
        $("#modal-recipe-image").removeClass("src");
        $("#modal-recipe-name").empty();
        $("#modal-recipe-ingredients").empty();
        $("#modal-recipe-instructions").empty();
        $("#modal-recipe-delete").empty();
    }


    if (document.URL.includes("saved-recipes.html")) {
        $(document).ready(function() {

            var savedRecipesArray = JSON.parse(localStorage.getItem("savedRecipesArray"));

            checkSwitch();
            
            function checkSwitch() {

                var switchState = $("#view-switch").prop("checked");
                console.log(switchState);
                if(switchState) {
                    //Card View!!!
                    $("#saved-recipes-list-view").empty();
                    loadCards();
                }
                else {
                    //List View!!!
                    $("#saved-recipes-card-view").empty();
                    loadList();
                }

            }

            $(document).on("click", "#view-switch", function() {
                checkSwitch();
            });

            function loadCards() {

                $("#saved-recipes-card-view").empty();
                
                for(i = 0; i < savedRecipesArray.length; i++) {

                    var newCardDiv = $("<div>").addClass("card");

                    var newCardImageDiv = $("<div>").addClass("card-image");
                    var drinkImage = $("<img>");
                    drinkImage.attr("src", savedRecipesArray[i].recipeObject.strDrinkThumb);

                    newCardImageDiv.html("<a class='open-recipe-modal btn-floating halfway-fab waves-effect waves-light red' href='#modal-recipe-div'data-value=" + JSON.stringify(savedRecipesArray[i].recipeObject.strDrink) + "><i class='material-icons'>add</i></a>").append(drinkImage);

                    var newCardContentDiv = $("<div>").addClass("card-content");
                    var cardContentPTag = $("<p>").text(savedRecipesArray[i].recipeObject.strDrink).addClass("center").attr("id", "card-recipe-name");
                    newCardContentDiv.append(cardContentPTag);

                    newCardDiv.append(newCardImageDiv, newCardContentDiv);
                    $("#saved-recipes-card-view").append(newCardDiv);
                
                }
            }

            function loadList() {

                $("#saved-recipes-list-view").empty();
            
                for(i = 0; i< savedRecipesArray.length; i++) {
                    console.log(savedRecipesArray[i].recipeObject.strMeasure1);
                }
                

                var newUl = $("<ul>").addClass("collapsible");

                for(i = 0; i < savedRecipesArray.length; i++ ) {

                    var newLi = $("<li>");

                    var headerDiv = $("<div>").addClass("collapsible-header center");
                    headerDiv.text(savedRecipesArray[i].name);

                    var bodyDiv = $("<div>").addClass("collapsible-body center");
                    
                    var drinkImage = $("<img>");
                    drinkImage.attr("src", savedRecipesArray[i].recipeObject.strDrinkThumb).attr("id", "saved-recipe-image");

                    var ingredientsList = $("<ul>");

                    var ingredientCount = 1;
                    var ingredientProp;
                    while (savedRecipesArray[i].recipeObject[ingredientProp] !== null) {
                        ingredientProp = "strIngredient" + ingredientCount;
            
                        var measureProp = "strMeasure" + ingredientCount;
            
                        if (savedRecipesArray[i].recipeObject[ingredientProp] !== null && savedRecipesArray[i].recipeObject[measureProp] !== null) {
                            var newIngredientsListItem = $("<li>").text(savedRecipesArray[i].recipeObject[ingredientProp] + " - " + savedRecipesArray[i].recipeObject[measureProp]);
                        }
                        else if (savedRecipesArray[i].recipeObject[measureProp] !== null) {
                            var newIngredientsListItem = $("<li>").text(savedRecipesArray[i].recipeObject[ingredientProp]);
                        }
                        ingredientsList.append(newIngredientsListItem);
                        ingredientCount++;
                    }

                    var instructionsPTag = $("<p>");
                    instructionsPTag.text(savedRecipesArray[i].recipeObject.strInstructions);

                    var deleteRecipe = $("<a>").attr("data-value", i).attr("href", "#!").addClass("delete-recipe-button").text("Delete Recipe");

                    bodyDiv.append(drinkImage, ingredientsList, instructionsPTag, deleteRecipe);

                    newLi.append(headerDiv, bodyDiv);

                    newUl.append(newLi);
                }

                $("#saved-recipes-list-view").append(newUl);
                $(document).ready(function() {
                    $('.collapsible').collapsible();
                });
                
            }

            $(document).on("click", ".open-recipe-modal", function () {
                clearRecipeModal();
        
                $("#modal-recipe-div").modal("open");
        
                var currentRecipe;
                var indexOfSavedRecipe;
        
                for (i = 0; i < savedRecipesArray.length; i++) {
                    if (savedRecipesArray[i].name === this.dataset.value) {
                        indexOfSavedRecipe = i;
                        currentRecipe = savedRecipesArray[i].recipeObject;
                    }
                }
        
                $("#modal-recipe-image").attr("src", currentRecipe.strDrinkThumb);
        
                $("#modal-recipe-name").text(currentRecipe.strDrink);
        
                var ingredientCount = 1;
                var ingredientProp;
                while (currentRecipe[ingredientProp] !== null) {
                    ingredientProp = "strIngredient" + ingredientCount;
        
                    var measureProp = "strMeasure" + ingredientCount;
        
                    if (currentRecipe[ingredientProp] !== null && currentRecipe[measureProp] !== null) {
                        var newIngredientsListItem = $("<li>").text(currentRecipe[ingredientProp] + " - " + currentRecipe[measureProp]);
                    }
                    else if (currentRecipe[measureProp] !== null) {
                        var newIngredientsListItem = $("<li>").text(currentRecipe[ingredientProp]);
                    }
                    $("#modal-recipe-ingredients").append(newIngredientsListItem);
                    ingredientCount++;
                }
        
                $("#modal-recipe-instructions").text(currentRecipe.strInstructions);

                var deleteRecipe = $("<a>").attr("data-value", indexOfSavedRecipe).attr("href", "#!").addClass("delete-recipe-button").text("Delete Recipe");

                $("#modal-recipe-delete").append(deleteRecipe);
            });

            $(document).on("click", ".delete-recipe-button", function(){
                console.log(savedRecipesArray);
                savedRecipesArray.splice(this.dataset.value, 1);
                localStorage.setItem("savedRecipesArray", JSON.stringify(savedRecipesArray));
                console.log(this);
                $("#modal-recipe-div").modal("close");
                checkSwitch();
            })

        });
    }


    if(document.URL.includes("breweries.html")) {
        $(document).ready(function() {

            var localBreweriesArray = [];
            var marker;

            L.mapquest.key = '7XSOhvWh4m4dhAyhCMD2uBfSYK2XqGxv';
    
            var map = L.mapquest.map('map', {
                center: [39.8283, -98.5795],
                layers: L.mapquest.tileLayer('map'),
                zoom: 4
            });

            var layerGroup = L.layerGroup().addTo(map);

            map.addControl(L.mapquest.control());

            $("#search-local-breweries").on("click", function() {
                breweriesAPICall();
            });
            
            function breweriesAPICall() {

                var state = "Kansas";
                var city = $("#city-name").val();
                var perPage = "";
                var queryURL = "https://brianiswu-open-brewery-db-v1.p.rapidapi.com/breweries?per_page=50&by_city=" + city;
                
                $.ajax({

                    "async": true,
                    "crossDomain": true,
                    "url": queryURL,
                    "method": "GET",
                    "headers": {
                        "x-rapidapi-key": "d27507a0ccmsh9a6fcf79498d5ffp1c8025jsndb62b327bc90",
                        "x-rapidapi-host": "brianiswu-open-brewery-db-v1.p.rapidapi.com"
                    }

                }).done(function (response) {

                    console.log(response);
                    localBreweriesArray = [];

                    for(i = 0; i < response.length; i++) {

                        var breweryLocationObject = {};
                        var breweryOverallObject = {};

                        breweryLocationObject.lat = JSON.parse(response[i].latitude);
                        breweryLocationObject.lon = JSON.parse(response[i].longitude);
                        breweryOverallObject.coords = breweryLocationObject;
                        breweryOverallObject.fullinfo = response[i];

                        if(breweryLocationObject.lat !== null && breweryLocationObject.lng !== null) {
                            localBreweriesArray.push(breweryOverallObject);
                        }
                        
                    }
                    
                    console.log(localBreweriesArray);
                    addMarkers(response);
                    addListOfBreweries(response);
                    
                });
            }

            // Adds markers to mapquest map and removes other markers if they exist. Stored in layer in map that can be cleared.
            function addMarkers() {
                console.log(map);

                layerGroup.clearLayers();
                
                var layerGroupArray =  [];

                for(i = 0; i < localBreweriesArray.length; i++) {

                    marker = L.marker(localBreweriesArray[i].coords, {
                        icon: L.mapquest.icons.marker(),
                        draggable: false
                      }).bindPopup(localBreweriesArray[i].fullinfo.name).addTo(layerGroup);

                }

            }

            function addListOfBreweries(response) {

                $("#brewery-list-body").empty();

                for(i = 0; i < response.length; i++) {
                    
                    var newTR = $("<tr>")

                    var nameTd = $("<td>");
                    nameTd.text(response[i].name);

                    var typeTd = $("<td>");
                    typeTd.text(response[i].brewery_type);

                    var addressTd = $("<td>");
                    if(response[i].street === "") {
                        addressTd.text("unavailable");
                    }
                    else {
                        addressTd.text(response[i].street + ", " + response[i].city + ", " + response[i].state + " " + response[i].postal_code.slice(0, 5));
                    }

                    var websiteTd = $("<td>");
                    var websiteATag = $("<a>");
                    if(response[i].website_url === "") {
                        websiteATag.text("unavailable");
                    }
                    else {
                        websiteATag.attr("href", response[i].website_url);
                        websiteATag.text(response[i].website_url);
                    }
                    websiteTd.append(websiteATag);

                    newTR.append(nameTd, typeTd, addressTd, websiteTd);

                    $("#brewery-list-body").append(newTR);

                }

            }
        });
    }
});