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
    $("#goButton").on("click", function() {
        $("#response-data").empty();

        var liquorSelection = $("#liquor-list").val();
        console.log(liquorSelection);
        
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
            
            var recipeDiv = $("#response-data");
            
            var randomNumber = Math.floor(Math.random() * response.drinks.length);
            
            var drinkName = $("<h2>");
            drinkName.text(response.drinks[randomNumber].strDrink);
            
            var drinkImage = $("<img>");
            drinkImage.attr("src", response.drinks[randomNumber].strDrinkThumb);
            
            recipeDiv.append(drinkName, drinkImage);
        });
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


});