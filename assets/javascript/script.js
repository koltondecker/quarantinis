$(document).ready(function () {
    $("#modal1").modal();
    $("#modal-recipe-div").modal();

    var currentDay = new Date("yyyy-MM-dd hh:mm:ss");
    var liquorArray = ["Vodka", "Gin", "Bourbon", "Whiskey", "Tequila", "Beer", "Wine"];
    var temporaryRecipeArray = [];
    var savedRecipesArray = [];
    var indexOfSavedRecipe;

    loadLiquors();

    //Materialize method call that runs the datepicker for the landing page with a range of 100 years passed in.
    $('.datepicker').datepicker({ maxDate: currentDay });

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

                var newTitleSpan = $("<span>").addClass("card-title").text(fullRecipeResponse.drinks[0].strDrink);

                newCardImageDiv.html("<a class='open-recipe btn-floating halfway-fab waves-effect waves-light red' href='#modal-recipe-div'data-value=" + JSON.stringify(fullRecipeResponse.drinks[0].strDrink) + "><i class='material-icons'>add</i></a>").append(drinkImage, newTitleSpan)

                var newCardContentDiv = $("<div>").addClass("card-content");
                var cardContentPTag = $("<p>").text(fullRecipeResponse.drinks[0].strInstructions);
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
        
        savedRecipesArray.push(temporaryRecipeArray[indexOfSavedRecipe]);
        
        localStorage.setItem("savedRecipesArray", JSON.stringify(savedRecipesArray));

    });

    function clearRecipeModal() {
        $("#modal-recipe-image").removeClass("src");
        $("#modal-recipe-name").empty();
        $("#modal-recipe-ingredients").empty();
        $("#modal-recipe-instructions").empty();
    }


    if (document.URL.includes("saved-recipes.html")) {
        $(document).ready(function() {

            var savedRecipesArray = JSON.parse(localStorage.getItem("savedRecipesArray"));

            loadList();

            $("#view-switch").on("click", function() {

                var switchState = $("#view-switch").prop("checked");
                console.log(switchState);
                if(switchState) {
                    //Card View!!!
                    $("#saved-recipes").empty();
                    loadCards();
                }
                else {
                    //List View!!!
                    $("#saved-recipes").empty();
                    loadList();
                }

            });

            function loadCards() {

                for(i = 0; i < savedRecipesArray.length; i++) {

                    var newCardDiv = $("<div>").addClass("card");

                    var newCardImageDiv = $("<div>").addClass("card-image");
                    var drinkImage = $("<img>");
                    drinkImage.attr("src", savedRecipesArray[i].recipeObject.strDrinkThumb);

                    var newTitleSpan = $("<span>").addClass("card-title").text(savedRecipesArray[i].recipeObject.strDrink);

                    newCardImageDiv.html("<a class='open-recipe btn-floating halfway-fab waves-effect waves-light  red' href='#modal-recipe-div'data-value=" + JSON.stringify(savedRecipesArray[i].recipeObject.strDrink) + "><i class='material-icons'>add</i></a>").append(drinkImage, newTitleSpan)

                    var newCardContentDiv = $("<div>").addClass("card-content");
                    var cardContentPTag = $("<p>").text(savedRecipesArray[i].recipeObject.strInstructions);
                    newCardContentDiv.append(cardContentPTag);

                    newCardDiv.append(newCardImageDiv, newCardContentDiv);
                    $("#saved-recipes").append(newCardDiv);
                
                }
            }

            function loadList() {
                
                var newTable = $("<table>");
                var newTableHead = newTable.html("<thead><tr><th>Recipe Name</th><th>Another List Item</th><th>And another</th></tr></thead>");
                var newTableBody = $("<tbody>");
                var anotherListItemPlaceholder = "stuff here";
                var andAnother = "more stuff here";
                
                for(i = 0; i < savedRecipesArray.length; i++) {
                    var newTR = $("<tr>");
                    newTR.html("<td>" + savedRecipesArray[i].name + "</td><td>" + anotherListItemPlaceholder + "</td><td>" + andAnother + "</td>");
                    newTableBody.append(newTR);
                }

                newTable.append(newTableHead, newTableBody);

                $("#saved-recipes").append(newTable);
                
            }

        });
    }


    if(document.URL.includes("breweries.html")) {
        $(document).ready(function() {

            var localBreweriesArray = [];

            var map = new mqgl.Map('map', '7XSOhvWh4m4dhAyhCMD2uBfSYK2XqGxv', {
                zoom: 3,
            });

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

                    for(i = 0; i < response.length; i++) {

                        var breweryLocationObject = {};

                        breweryLocationObject.lat = response[i].latitude;
                        breweryLocationObject.lng = response[i].longitude;

                        if(breweryLocationObject.lat !== null && breweryLocationObject.lng !== null) {
                            localBreweriesArray.push(breweryLocationObject);
                        }
                        
                    }
                    
                    console.log(localBreweriesArray);
                    addMarkers();
                    
                });
            }

            function addMarkers() {
                    
                for(i = 0; i < localBreweriesArray.length; i++) {
                    map.icons.marker.add(localBreweriesArray[i]);
                }

                map.fitBounds();

            }
        });
    }
});