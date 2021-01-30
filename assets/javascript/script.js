$(document).ready(function () {
    $("#modal1").modal();
    $("#modal-recipe-div").modal();

    //Declared variables
    var oneHundredYearsPast = new Date();
    oneHundredYearsPast.setFullYear(oneHundredYearsPast.getFullYear() - 100);
    var liquorArray = ["Vodka", "Brandy", "Rum", "Gin", "Bourbon", "Whiskey", "Scotch", "Tequila", "Beer", "Wine"];
    var temporaryRecipeArray = [];
    var savedRecipesArray = [];
    var indexOfSavedRecipe;

    //Initial call to load liquors list on the homepage.
    loadLiquors();

    //Materialize method call that runs the datepicker for the landing page with a range of 100 years passed in.
    $('.datepicker').datepicker({ yearRange: 100, minDate: oneHundredYearsPast, maxDate: new Date() });

    //On click event for the submit button on landing page that takes in the date to calculate age based on current day. If 21, page automatically switches to homepage.
    $("#submit-birthday").on("click", function () {
        var usersBirthday = $("#user-birthday").val();

        //Moment.js is used to calculate age.
        var age = moment().diff(moment(usersBirthday, "LL"), "years");

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

    //Document on click event to fix issue on mobile where liquor list dropdown selects wrong value.
    $(document).click(function(){
        $('li[id^="select-options"]').on('touchend', function (e) {
            e.stopPropagation();
        });
    });

    //On click to dismiss the brewery link popup card.
    $("#brewery-popup-card-close-button").on("click", function() {
        $("#brewery-popup-card").addClass("hide");
    });

    //On click of the go button, the ajax call starts and takes value of liquor selector as input.
    $("#submitButton").on("click", function () {
        $("#response-data").empty();

        var liquorSelection = $("#liquor-list").val();
        var recipeCount = $("#recipe-count").val();

        var queryUrl = "https://the-cocktail-db.p.rapidapi.com/filter.php?i=" + liquorSelection;

        //Ajax call to the cocktail db api that then calls the AddRecipeToPage function.
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

        //This function saves all recipes on page to a temporary array of objects to then access for click events.
        function sendRecipesToTempArray(currentRecipeObject) {
            var recipeName = currentRecipeObject.strDrink;
            var currentRecipeObject = {
                name: recipeName,
                recipeObject: currentRecipeObject
            }
            temporaryRecipeArray.push(currentRecipeObject);
        }

        //To get the full recipe from cocktail db, a second ajax call is made with the specific id of a drink that is selected by user and grabbed from temporary array.
        //This returned response is then used to load content into modal for full recipe in the onclick event following this function.
        //Cards are dynamically created and added to page in this function.
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

                var newCardDiv = $("<div>").addClass("card homepage-card hoverable");

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

    //On click of plus button opens a modal and populates data from object stored in temporary array.
    $(document).on("click", ".open-recipe", function () {
        clearRecipeModal();

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
        var ingredientProp = 0;
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

    // On click event for saving a recipe pushes an object to local storage with name of recipe and full recipe response object from api call.
    $(document).on("click", "#save-recipe-button", function () {
        var localStorageArray = JSON.parse(localStorage.getItem("savedRecipesArray"));

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

    //Modal is cleared with this function so new information can be loaded. 
    function clearRecipeModal() {
        $("#modal-recipe-image").removeClass("src");
        $("#modal-recipe-name").empty();
        $("#modal-recipe-ingredients").empty();
        $("#modal-recipe-instructions").empty();
        $("#modal-recipe-delete").empty();
    }

    //Checks if saved recipes page is loaded. Had issues with things executing before page load otherwise.
    if (document.URL.includes("saved-recipes.html")) {
        $(document).ready(function() {

            //Grabs local storage data on load.
            var savedRecipesArray = JSON.parse(localStorage.getItem("savedRecipesArray"));

            //Calls function to check what value the toggle switch is on.
            checkSwitch();
            
            function checkSwitch() {

                var switchState = $("#view-switch").prop("checked");

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

            //On click of toggle switch, checkswitch function is called again.
            $(document).on("click", "#view-switch", function() {
                checkSwitch();
            });

            //this function loads cards to page based on saved recipe data when toggle is switched to card view.
            function loadCards() {

                $("#saved-recipes-card-view").empty();

                for(i = 0; i < savedRecipesArray.length; i++) {

                    var newCardDiv = $("<div>").addClass("card hoverable");

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

            //this function loads a collapsible list to page based on saved recipes from local storage when toggle is switched to list view.
            function loadList() {

                $("#saved-recipes-list-view").empty();

                var newUl = $("<ul>").addClass("collapsible");

                for(i = 0; i < savedRecipesArray.length; i++ ) {

                    var newLi = $("<li>");

                    var headerDiv = $("<div>").addClass("collapsible-header center");
                    headerDiv.text(savedRecipesArray[i].name);

                    var bodyDiv = $("<div>").addClass("collapsible-body center");
                    
                    var drinkImage = $("<img>");
                    drinkImage.attr("src", savedRecipesArray[i].recipeObject.strDrinkThumb).attr("id", "saved-recipe-image");

                    var ingredientsList = $("<ul>");

                    //This while loop checks through response object for both ingredients and measurements that are stored separately in the object in weird ways. 
                    //Checks for null values and only returns populated information and appends to list.
                    var ingredientCount = 1;
                    var ingredientProp = 0;
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

            //Opens modal of recipe when plus button is pressed on saved recipes page.
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
        
                //While loop is used again to check for ingredients and measurements and add info to modal.
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

            //On click of delete recipe button, recipe is removed from local storage and page is reloaded to only show saved recipes.
            $(document).on("click", ".delete-recipe-button", function(){

                savedRecipesArray.splice(this.dataset.value, 1);
                localStorage.setItem("savedRecipesArray", JSON.stringify(savedRecipesArray));

                $("#modal-recipe-div").modal("close");
                checkSwitch();
            })

        });
    }

    //Checks if saved breweries page is loaded. Had issues with things executing before page load otherwise.
    if(document.URL.includes("breweries.html")) {
        $(document).ready(function() {

            var localBreweriesArray = [];
            var marker;

            //API Key for mapquest.
            L.mapquest.key = '7XSOhvWh4m4dhAyhCMD2uBfSYK2XqGxv';
    
            //Initial loading of mapquest map focused on United States.
            var map = L.mapquest.map('map', {
                center: [39.8283, -98.5795],
                layers: L.mapquest.tileLayer('map'),
                zoom: 4
            });

            //Creates a layergroup that can be manipulated and doesn't affect main map layer.
            var layerGroup = L.layerGroup().addTo(map);

            map.addControl(L.mapquest.control());

            //calls breweries api call function on click of search city button.
            $("#search-local-breweries").on("click", function() {
                breweriesAPICall();
            });
            
            //This function calls the Open Breweries DB api based on searched city of user and returns a list of up to 50 breweries in that city. 
            function breweriesAPICall() {

                var city = $("#city-name").val();
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
                    
                    //Calls 2 functions, 1 to add markers to the map of locations found with coordinates available and 2 to add the list info to page.
                    addMarkers(response);
                    addListOfBreweries(response);
                    
                });
            }

            // Adds markers to mapquest map and removes other markers if they exist. Stored in layer in map that can be cleared.
            function addMarkers() {

                //Clears previous markers from map when function is called.
                layerGroup.clearLayers();
                
                var layerGroupArray =  [];

                //Loops through api response and adds markers for all locations with coordinates.
                for(i = 0; i < localBreweriesArray.length; i++) {

                    marker = L.marker(localBreweriesArray[i].coords, {
                        icon: L.mapquest.icons.marker(),
                        draggable: false
                    }).bindPopup(localBreweriesArray[i].fullinfo.name).addTo(layerGroup);

                    layerGroupArray.push(L.marker(localBreweriesArray[i].coords));

                }

                //Creates a layer group and fits the bounds of the map view to shown markers.
                var group = L.featureGroup(layerGroupArray);
                map.fitBounds(group.getBounds());

            }

            //Adds table body information to page of located breweries in city.
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

                    var websiteTd = $("<td>").addClass("website-urls");
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