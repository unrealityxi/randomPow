
(function(){
  "use strict";
  /*
    Takes user defined query consisting of ints min, max, and n 
    Contacts API at random.org, sending query for list of n integers.
      min - smallest integer in list
      max - largest -||-
      n   - length of the list

    Output is DOM manipulation sideeffect, appending list of integers,
    and visualized chart consisting of analyzed data to deisgnated divs. 
  */


  // Is in charge for creating config params
  function getParams(selector){
    /*
      Expects selector for target numeric input fields in html file
      in following order: min, max, n
    */

    // selects all numeric type inputs
    let inputData = document.querySelectorAll(selector);

    // appends all values to an array
    let cfgData = []
    inputData.forEach((item) => cfgData.push(parseInt(item.value)));

    let min;
    let max;
    let n; 
    
    // assigns matching array fields to min, max and n
    [min, max, n] = cfgData;
    
    // returns params object consisting of them
    return {min, max, n};
  }


  // calls random.org with configured parameters
  function getRandomNumbers(params){
    /* 
      Takes params object as an arg,
      makes POST request to random.org calling their api,
      returns a promisified response from the server

      Sample params looks like this: 
      {
        min: 0
        max: 1000
        n : 1000
      }
    */
    // api URL (could have been on top of file or passed in as param)
    const URL = "https://api.random.org/json-rpc/1/invoke";

    // api key (should be hidden, but frontend)
    

    // 6c7dcd85-98e3-43e4-ab18-510527357e31
    const KEY = "4649b2a6-91ac-4b14-b0af-aef42617e165";


    // attaches key to param object 
    params.apiKey = KEY

    // config for POST request
    let config = {
      jsonrpc: "2.0",
      method: "generateIntegers",
      params: params,
      id: 357
    }

    // returns a promise as promised above (pun intended :3)
    // makes post request to server with a given config, then
    // returns promisified random numbers data array,
    // starting the promise chain
    return axios.post(URL, config).then((res)=> {
      return res.data.result.random.data
    });

  }

  // Analyzes content of an array 
  function analyzeData(numbers){
      /* 
        Takes array of numbers as input
        Returns an object with original array, and array
        containing analyzed data which looks like this: 
          
          {
            numbers: [
              12,
              1612, 
              ...
            ]
            
            frequencies: [
              {
                number: 1,
                frequency: 20
              },
              {
                number: 12,
                freq...
              },
              ...
            ]
          }
      */

      // analyzes data, reduces it to an obj
      // with number obj with unique number and frequency of that number props
      let freqs = numbers.reduce((freqs, num) => {

        // if there is no data for a current number,
        // initialize it with default props
        // number being current number we're looking at
        // frequency inits to 1 
        if (!freqs[num]){
          freqs[num] = {
            "number": Number(num),
            "frequency": 1
          }
        }

        // if number already exists, increase its frequency prop
        else {
          freqs[num].frequency += 1;
        }
        return freqs 
      }, {});

      // Converts resulting object to array
      let frequencies = [];

      for (let item in freqs){
        frequencies.push(freqs[item]);
      }

      return {
        numbers,
        frequencies
      }
  }


  function sortData(data){

    // Sorts array of frequencies in descending order
    data.frequencies.sort((a, b) => {
      return b.frequency - a.frequency;
    });
    return data;
  }

  // in charge for rendering data to target divs
  function displayData(data){
    /*
      Takes data obj with numeric array and analyzed data on props
      outputs sideeffect of rendering array and charted analyzed data 
      to designated "div" elements in index.html
    */

    // this will render numeric array
    function displayArray(arr, target){

      // get target elements
      let arrayOut = document.querySelector(target);

      // empty it (for subsequent API calls)
      arrayOut.innerHTML = "";

      // Create number string out of given array 
      let str = arr.join(", ");

      // create markup
      let div = document.createElement("div");
      let header = document.createElement("h2");
      let p = document.createElement("p");

      // defines text nodes
      let headerText = document.createTextNode("Random Numbers:");
      let pText = document.createTextNode(str);

      // Populates container with respective texts -
      // info message for header
      // and content message with numbers to paragraph
      div.appendChild(header).appendChild(headerText);
      div.appendChild(p).appendChild(pText);      
      arrayOut.appendChild(div);
    }

    // handles displaying frequencies
    function displayFrequencies(arr, target){

      // gets target element
      let freqsOut = document.querySelector(target);
      
      // empties it (for subsequent api call);
      freqsOut.innerHTML = "";

      // create and append svg element
      // set basic attributes
      let canvasHeight = 300;
      let heightFactor = 20;
      let barWidth = 40;
      let barMargin = 20;
      let fontSize = 13;

      let canvasWidth = arr.length * (barWidth + barMargin);

      var svg = d3.select(target)
                  .append("svg")
                  .attr("height", canvasHeight)
                  .attr("width", canvasWidth);
      
      // creates rectangles representing chart bars
      // styles them too
      svg.selectAll("rect")
         .data(arr)
         .enter().append("rect")
                 .attr("class", "bar")
                 .attr("height", (d, i) => d.frequency * heightFactor) // makes bar slightly taller
                 .attr("width", barWidth) // arbitrary bar width
                 .attr("x", (d, i) => i * (barWidth + barMargin)) // spreads bars across svg 
                 .attr("y", (d, i) => canvasHeight - (d.frequency * heightFactor));
                 // above line makes bars be on bottom by setting their starting
                 // point on a height which is equal to difference between
                 // total canvas height and height of the div
                 // making them appear aligned on bottom
      
      // this pushes d3 into iteration over all data
      // making it possible to later append multiple
      // text elements to each bar chart
      let texts = svg.selectAll("text")
                     .data(arr)
                     .enter();
      
      // appends test element representing the number from data
      // labeling each bar with corresponding number
      texts.append("text")
         .text((d) => d.number)
                 .attr("class", "text-num")
                 .attr("x", (d, i) => (i * (barWidth + barMargin)) + fontSize) 
                 .attr("y", (d, i) => canvasHeight - 10);
                 // should contain font size + padding instead of "36" for x axis
                 // cause magic numbers are bad
                 // for better accuracy 
                 // y axis sets text to be a bit above bottom

      // represents frequency num apeared in dataset
      texts.append("text")
        .text((d) => d.frequency)
                 .attr("class", "text-frequency")
                 .attr("x", (d, i) => (i * (barWidth + barMargin)) + fontSize) 
                 .attr("y", (d, i) => canvasHeight / 2);
                 // same as above element except that 
                 // i've set this text's height to half of canvas width
  } 

    // renders data to document
    displayArray(data.numbers, ".arr-out");
    displayFrequencies(data.frequencies, "#freqs-out");
  }


  // gets things rolling
  function clickHandler(e){
    /*
      Kicks off the promise chain with user suplied config
      on designated button click
    */
    e.preventDefault();

    // gets config data
    let params = getParams("input[type='number']");
    
    // gets the dataset...
    getRandomNumbers(params)
      .then(analyzeData)
      .then(sortData)
      .then(displayData)
      .catch(e => console.log(e));

  }

  // get element that is suposed to trigger things
  let submit = document.getElementById("submit"); 

  // adds click event listener which will trigger the program
  submit.addEventListener("click", clickHandler);

  // tadah! 

})();