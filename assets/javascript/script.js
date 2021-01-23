$(document).ready(function() {

    var liquorArray = ["Vodka", "Gin", "Bourbon", "Whiskey", "Tequila", "Beer", "Wine"];

    loadLiquors();

    //Materialize method call that runs the datepicker for the landing page with a range of 100 years passed in.
    $('.datepicker').datepicker({yearRange: 100});

    //Materialize method call that runs the sidenav bar when page shrinks to mobile size.
    $('.sidenav').sidenav();

    //Materialize method call that runs the selector forms.
    $('select').formSelect();

    //On click of the go button, the ajax call starts and takes value of liquor selector as input.
    $("#submitButton").on("click", function() {
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

    //TODO: Add functionality to the card button.
    $(document).on("click", ".save-recipe", function() {
        
    });
    
    //Liquor list is dynamically loaded with this function using array of liquors at top. 
    function loadLiquors() {
        for(i = 0; i < liquorArray.length; i++) {
            var newOption = $("<option>");
            newOption.addClass("liquor");
            newOption.attr("value", liquorArray[i]);
            newOption.text(liquorArray[i]);

            $("#liquor-list").append(newOption);
        }
    }

    //This function takes the response from the original ajax call and uses a random number generator to pick a recipe from the response object.
    //The recipe is then passed through a new ajax call that uses the id to get the full recipe information. All info is passed into a dynamically 
    // created card and appended to the page.
    function addRecipeToPage(response, recipeCount) {
        var recipeDiv = $("#response-data");

        //TODO: Need to fix issue with random number generator for cocktail recipe pulling up same recipe more than once.
        var currentRandomNumberArray = [];
        
        if(response.drinks.length <= recipeCount) {
            for(i = 0; i < response.drinks.length; i++) {
                recipeAjaxCall(i);
            };
        }
        else {
            for(i = 0; i < recipeCount; i++) {
                var randomNumber = generateRandomNumber();
                function generateRandomNumber() {
                    randomNumber = Math.floor(Math.random() * response.drinks.length);
                    if(currentRandomNumberArray.includes(randomNumber)) {
                        generateRandomNumber();
                    }
                    else {
                        currentRandomNumberArray.push(randomNumber);
                        recipeAjaxCall(randomNumber);
                    }
                }
            } 
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
            }).done(function (response) {
                console.log(response);

                var newCardDiv = $("<div>").addClass("card");

                var newCardImageDiv = $("<div>").addClass("card-image");
                var drinkImage = $("<img>");
                drinkImage.attr("src", response.drinks[0].strDrinkThumb);

                var newTitleSpan = $("<span>").addClass("card-title").text(response.drinks[0].strDrink);

                newCardImageDiv.html("<a class='save-recipe btn-floating halfway-fab waves-effect waves-light red'><i class='material-icons'>add</i></a>").append(drinkImage, newTitleSpan)

                var newCardContentDiv = $("<div>").addClass("card-content");
                var cardContentPTag = $("<p>").text(response.drinks[0].strInstructions);
                newCardContentDiv.append(cardContentPTag);

                newCardDiv.append(newCardImageDiv, newCardContentDiv);
                recipeDiv.append(newCardDiv);
            });
        }
    }


});