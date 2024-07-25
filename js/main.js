$(document).ready(function() {
  const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'pink'];
  const onoff = localStorage.getItem("cp-music") || (localStorage.setItem("cp-music", "on"), "on");
  const boardSize = 10;
  let points = 0;
  let currentlvl = 1;
  const gameBoard = $('#game-board');
  const pointsDisplay = $('#points-display');
  const levelDisplay = $('#level-display');
  const success = new Audio('audio/success.mp3');
  const fail = new Audio('audio/fail.mp3');
  const dropSound = new Audio('audio/bubbles.mp3');
  const bgSound = new Audio('audio/bg.mp3');
  let highScores = [];
  const currentYear = new Date().getFullYear();
  bgSound.volume = 0.3;
  bgSound.loop = true;
  //bgSound.play();

  // Sound files
  /*
  const sounds = [
    new Audio('audio/pop1.mp3'),
    new Audio('audio/pop2.mp3'),
    new Audio('audio/pop3.mp3')
  ];
  */

  const soundUrls = [
    'audio/pop1.mp3',
    'audio/pop2.mp3',
    'audio/pop3.mp3'
  ];

  // Preload audio files
  const sounds = soundUrls.map(url => {
    const audio = new Audio(url);
    audio.addEventListener('canplaythrough', () => {
      //console.log(`${url} is ready to play`);
    }, false);
    return audio;
  });

  // Display hi-score list
  displayHighScores();

  // Array of all possible colors
  const allColors = ['red', 'green', 'blue', 'yellow', 'pink'];

  // Function to shuffle an array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Function to get colors based on points
  function getColorsBasedOnPoints(points) {
    let numColors;

    if (points < 12000) {
      numColors = 2; // Easy level 9000
    } else if (points < 15000) {
      numColors = 3; // Medium level 12000
    } else if (points < 18000) {
      numColors = 4; // Hard level 15000
    } else {
      numColors = 5; // Very Hard level
    }

    // Shuffle the array of all possible colors
    shuffleArray(allColors);

    // Select the first `numColors` from the shuffled array
    return allColors.slice(0, numColors);
  }

  // Generate the board with a staggered animation effect
  // 2024-07-03 v.2
  function generateBoard() {
    const gameBoard = $('#game-board');
    gameBoard.empty();

    // Get the colors based on points
    let colors = getColorsBasedOnPoints(points);

    const dots = [];

    // Populate the board with dots
    for (let i = 0; i < boardSize * boardSize; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const dot = $('<div class="dot"></div>').addClass(color);
      dots.push(dot);
      gameBoard.append(dot);
    }

    // Apply the fall animation in reverse order
    for (let i = dots.length - 1; i >= 0; i--) {
      setTimeout(() => {
        dots[i].addClass('fall');

        // Remove the fall class and set opacity to 1 after the animation ends
        dots[i].on('animationend', function() {
          $(this).removeClass('fall').css('opacity', '1');
        });
      }, (dots.length - i - 1) * 5); // 5ms delay per dot
    }

    //dropSound.play();
    localStorage.getItem("cp-music") === "on" && dropSound.play();
  }

  // Generate the board
  /* 2024-07-03
  function generateBoard() {
    gameBoard.empty();

    // Get the colors based on points
    let colors = getColorsBasedOnPoints(points);

    // Populate the board with dots
    for (let i = 0; i < boardSize * boardSize; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const dot = $('<div class="dot"></div>').addClass(color);
      gameBoard.append(dot);
    }
  }
  */


  /* 2024-07-02
  // Generate the board
  function generateBoard() {
    gameBoard.empty();

    let colors = [];
    if (points < 9000) {
        colors = ['red', 'green']; // Easy level
    } else if (points < 12000) {
        colors = ['red', 'green', 'blue']; // Medium level
    } else if (points < 15000) {
        colors = ['red', 'green', 'blue', 'yellow']; // Hard level
    } else {
        colors = ['red', 'green', 'blue', 'yellow', 'pink']; // Very Hard level
    }

    for (let i = 0; i < boardSize * boardSize; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const dot = $('<div class="dot"></div>').addClass(color);
      gameBoard.append(dot);
    }
  }
  */

  // Initialize the board
  generateBoard();

  // Helper function to get color of a dot
  function getColor(x, y) {
    const dot = $(`.dot:eq(${y * boardSize + x})`);
    if (dot.length === 0) return null;
    const color = dot.attr('class').split(' ').find(cls => colors.includes(cls) || cls === 'empty');
    return color || 'empty';
  }

  // Helper function to set color of a dot
  function setColor(x, y, color) {
    const dot = $(`.dot:eq(${y * boardSize + x})`);
    dot.removeClass(colors.join(' ') + ' empty').addClass(color);
  }

  // Check for matching adjacent dots
  function getMatchingDots(x, y, color) {
    const queue = [[x, y]];
    const visited = Array(boardSize).fill().map(() => Array(boardSize).fill(false));
    const matches = [];

    while (queue.length) {
      const [cx, cy] = queue.pop();
      if (cx < 0 || cy < 0 || cx >= boardSize || cy >= boardSize || visited[cy][cx] || getColor(cx, cy) !== color) {
        continue;
      }
      matches.push([cx, cy]);
      visited[cy][cx] = true;
      queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    return matches;
  }

  // Function to shift down dots in a column and close gaps
  function shiftDown() {
    for (let col = 0; col < boardSize; col++) {
      let emptySlots = 0;
      for (let row = boardSize - 1; row >= 0; row--) {
        const color = getColor(col, row);
        if (color === 'empty') {
          emptySlots++;
        } else if (emptySlots > 0) {
          setColor(col, row + emptySlots, color);
          setColor(col, row, 'empty');
        }
      }
    }

    // Shift columns left to remove empty columns
    let emptyColumns = 0;
    for (let col = 0; col < boardSize; col++) {
      if (getColor(col, boardSize - 1) === 'empty') {
        emptyColumns++;
      } else if (emptyColumns > 0) {
        for (let row = 0; row < boardSize; row++) {
          const color = getColor(col, row);
          setColor(col - emptyColumns, row, color);
          setColor(col, row, 'empty');
        }
      }
    }
  }

  /* Shift down and to the center
  // Function to shift down dots in a column and close gaps
  function shiftDown() {
    for (let col = 0; col < boardSize; col++) {
      let emptySlots = 0;
      for (let row = boardSize - 1; row >= 0; row--) {
        const color = getColor(col, row);
        if (color === 'empty') {
          emptySlots++;
        } else if (emptySlots > 0) {
          setColor(col, row + emptySlots, color);
          setColor(col, row, 'empty');
        }
      }
    }

    // Collect all non-empty columns
    let nonEmptyColumns = [];
    for (let col = 0; col < boardSize; col++) {
      if (getColor(col, boardSize - 1) !== 'empty') {
        nonEmptyColumns.push(col);
      }
    }

    // Calculate the offset to center the columns
    const totalNonEmptyColumns = nonEmptyColumns.length;
    const totalEmptyColumns = boardSize - totalNonEmptyColumns;
    const offset = Math.floor(totalEmptyColumns / 2);

    // Shift columns to center them
    let targetCol = offset;
    for (let i = 0; i < nonEmptyColumns.length; i++) {
      const sourceCol = nonEmptyColumns[i];
      if (targetCol !== sourceCol) {
        for (let row = 0; row < boardSize; row++) {
          const color = getColor(sourceCol, row);
          setColor(targetCol, row, color);
          setColor(sourceCol, row, 'empty');
        }
      }
      targetCol++;
    }
  }

  // Function to get the color of a dot at (col, row)
  function getColor(col, row) {
    return $(`#game-board .dot:nth-child(${row * boardSize + col + 1})`).attr('class').split(' ')[1];
  }

  // Function to set the color of a dot at (col, row)
  function setColor(col, row, color) {
    const dot = $(`#game-board .dot:nth-child(${row * boardSize + col + 1})`);
    dot.removeClass(dot.attr('class').split(' ').slice(1).join(' ')).addClass(color);
  }
  */


  // Check if all dots of a specific color are removed
  function checkWinningCondition(color) {
    for (let col = 0; col < boardSize; col++) {
      for (let row = 0; row < boardSize; row++) {
        if (getColor(col, row) === color) {
          return false;
        }
      }
    }
    return true;
  }

  // Check if there are no more valid moves
  function noMoreValidMoves() {
    for (let col = 0; col < boardSize; col++) {
      for (let row = 0; row < boardSize; row++) {
        const color = getColor(col, row);
        if (color !== 'empty') {
          const matchingDots = getMatchingDots(col, row, color);
          if (matchingDots.length >= 3) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Check if the game is over (either win or fail)
  function checkGameOver() {
    /*
    if (checkWinningCondition('red')) {
      alert('Congratulations! You have removed all red dots. You win!');
      generateBoard();
    } else if (currentMoves >= maxMoves || noMoreValidMoves()) {
      alert('Game over! No more valid moves or exceeded the maximum moves allowed.');
      generateBoard();
    }
    */
    if (isBoardCleared()) {
      //alert('Great job! All dots cleared. Moving to next round.');
      //generateBoard();

      //success.play();
      localStorage.getItem("cp-music") === "on" && success.play();

      setTimeout(function(){
        currentlvl++;
        updateLevelDisplay();
        generateBoard();
      }, 300);

      /*
      swal("Great job!", "All dots cleared. Moving to next round.").then((value) => {
        currentlvl++;
        updateLevelDisplay();
        generateBoard();
			});
      */
    } else if (noMoreValidMoves()) {
      //fail.play();
      localStorage.getItem("cp-music") === "on" && fail.play();

      // Game over
      setTimeout(function(){
        swal({
          title: "Game over!",
          text: "No more valid moves.",
          closeOnClickOutside: false,
          content: {
            element: "input",
            attributes: {
              placeholder: "Enter a username for the leaderboard:",
              type: "text",
              id: "userNameInput"
            }
          },
          buttons: {
            cancel: "Cancel",
            confirm: {
              text: "OK",
              closeModal: true // Prevent dialog from closing immediately
            }
          }
        })
        .then((isConfirm) => {
          if (isConfirm) {
            // Get the value entered by the user in the input field
            var playerName = document.getElementById("userNameInput").value;

            if (playerName === "") {
              resetGame(); // User did not enter a name
            } else {
              // Create a new object with the player's name and score
              const playerScore = { name: playerName, score: points };

              // Add the player's score to the high scores array
              highScores.push(playerScore);

              // Sort the high scores array
              highScores.sort((a, b) => b.score - a.score);

              // Limit the number of high scores
              const maxHighScores = 10;
              highScores = highScores.slice(0, maxHighScores);

              // Save the updated high scores
              localStorage.setItem('cp-highScores', JSON.stringify(highScores));

              window.location.reload();
            }

          } else {
            resetGame(); // User clicked cancel
          }
        });
      }, 700);
    }
  }

  /*
  // Function to display high scores in a list
  function displayHighScores() {
    const list = document.getElementById('hiscore-list');

    // Clear existing list items
    while (list.firstChild) {
      list.firstChild.remove();
    }

    // Retrieve high scores from local storage
    const savedHighScores = JSON.parse(localStorage.getItem('cp-highScores'));

    if (savedHighScores) {
      highScores = savedHighScores;

      // Iterate through high scores and create list items
      highScores.forEach((score, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${score.name} - ${score.score}`;
        list.appendChild(listItem);
      });
    } else {
      const listItem = document.createElement('li');
      listItem.textContent = "Leaderboard is empty";
      list.appendChild(listItem);
    }
  }*/


  // Function to display high scores in a list
  function displayHighScores() {
    const leaderboardBody = document.getElementById('leaderboardBody');

    // Clear existing list items
    while (leaderboardBody.firstChild) {
      leaderboardBody.firstChild.remove();
    }

    // Retrieve high scores from local storage
    const savedHighScores = JSON.parse(localStorage.getItem('cp-highScores'));

    if (savedHighScores) {
      highScores = savedHighScores;

      // Iterate through high scores and create list items
      highScores.forEach((score, index) => {

        const row = document.createElement('tr');

        // Create and append the rank cell
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1 + ".";
        row.appendChild(rankCell);

        // Create and append the name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = score.name;
        row.appendChild(nameCell);

        // Create and append the score cell
        const scoreCell = document.createElement('td');
        scoreCell.textContent = score.score + "p";
        scoreCell.style.textAlign = 'right'; // Ensure scores are right-aligned
        row.appendChild(scoreCell);

        // Append the row to the table body
        leaderboardBody.appendChild(row);
      });
    } else {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 3;
      cell.textContent = "Leaderboard is empty";
      row.appendChild(cell);
      leaderboardBody.appendChild(row);
    }
  }

  // Function to reset the game (back to easy level)
  function resetGame() {
    points = 0;
    currentlvl = 1;
    updatePointsDisplay();
    updateLevelDisplay();
    generateBoard();
  }

  function updateLevelDisplay() {
    levelDisplay.text('Lvl: ' + currentlvl);
  }

  // Update points display
  function updatePointsDisplay() {
    //pointsDisplay.text(`${points}p`);

    const pointsElement = $('#points');

    // Update points
    pointsElement.text(points);

    // Add the 'updated' class for animation
    pointsElement.addClass('updated');

    // Remove the 'updated' class after the animation ends
    setTimeout(() => {
      pointsElement.removeClass('updated');
    }, 200); // Match this duration with the CSS transition time
  }

  // Calculate points based on number of dots removed
  function calculatePoints(matchingDots) {
    let basePoints = 10; // Points per dot
    let bonusPoints = 0;

    if (matchingDots.length > 3) {
      bonusPoints = (matchingDots.length - 3) * 5; // Additional points for more than three dots
    }

    return (matchingDots.length * basePoints) + bonusPoints;
  }

  // Function to play a random pop sound
  /*
  function playPopSound() {
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    //randomSound.play();
    localStorage.getItem("cp-music") === "on" && randomSound.play();

    // Check if the device supports vibration
    if ("vibrate" in navigator) {
      // Execute vibration code
      navigator.vibrate(10); // Vibrate for 200 milliseconds
    }
  }
  */

  function playPopSound() {
    const randomIndex = Math.floor(Math.random() * soundUrls.length);
    const randomSound = new Audio(soundUrls[randomIndex]);

    //console.log(`Attempting to play sound: ${soundUrls[randomIndex]}`);
    if (localStorage.getItem("cp-music") === "on") {
      randomSound.play().catch(error => {
        //console.error(`Error playing sound: ${error}`);
      });
    } else {
      //console.log("Sound is turned off in localStorage");
    }

    // Check if the device supports vibration
    if ("vibrate" in navigator) {
      // Execute vibration code
      navigator.vibrate(10); // Vibrate for 200 milliseconds
    }
  }

  // Function to check if the board is cleared
  function isBoardCleared() {
    for (let col = 0; col < boardSize; col++) {
      for (let row = 0; row < boardSize; row++) {
        if (getColor(col, row) !== 'empty') {
          return false;
        }
      }
    }
    return true;
  }

  // Hover event handler to highlight matching dots
  gameBoard.on('mouseenter', '.dot', function() {
    const index = $(this).index();
    const x = index % boardSize;
    const y = Math.floor(index / boardSize);
    const color = getColor(x, y);

    if (color === 'empty') return;

    const matchingDots = getMatchingDots(x, y, color);

    if (matchingDots.length >= 3) {
      matchingDots.forEach(([mx, my]) => {
        const dot = $(`.dot:eq(${my * boardSize + mx})`);
        dot.addClass('highlight');
      });
    }
  });

  gameBoard.on('mouseleave', '.dot', function() {
    $('.dot').removeClass('highlight');
  });

  // Click event handler
  gameBoard.on('click', '.dot', function() {
    $('.dot').removeClass('highlight'); // Remove highlight on click

    const index = $(this).index();
    const x = index % boardSize;
    const y = Math.floor(index / boardSize);
    const color = getColor(x, y);
    const dot = $(this);
    dot.addClass('clicked');

    setTimeout(() => {
      dot.removeClass('clicked');
    }, 300); // Adjust the delay (in milliseconds) as needed for your animation duration

    if (color === 'empty') return;

    const matchingDots = getMatchingDots(x, y, color);

    if (matchingDots.length >= 3) {
      playPopSound(); // Play sound on valid move

      matchingDots.forEach(([mx, my]) => {
        setColor(mx, my, 'empty');
      });

      const earnedPoints = calculatePoints(matchingDots);
      points += earnedPoints;

      shiftDown();

      updatePointsDisplay();
      updateLevelDisplay();

      checkGameOver();
    }
  });

  // Sound button
  if (onoff == "on") {
    $("#sound-button span").text("Sound on");
    $('#sound-button img').attr('src', 'img/speaker.png');
  } else if (onoff == "off") {
    $("#sound-button span").text("Sound off");
    $('#sound-button img').attr('src', 'img/speaker-off.png');
  } else {
    $("#sound-button span").text("Sound on");
    $('#sound-button img').attr('src', 'img/speaker.png');
  }

  // Sound button click
  $('#sound-button').click(function() {
    if (onoff == "on") {
      localStorage.setItem("cp-music", "off");
      location.reload();
    } else if (onoff == "off") {
      localStorage.setItem("cp-music", "on");
      location.reload();
    } else {
      localStorage.setItem("cp-music", "off");
      location.reload();
    }
  });

  // Fullscreen button
  $('#fullscreen-button').click(function() {
    const gameContainer = $('html')[0]; // Get the DOM element

	  if (gameContainer.requestFullscreen) {
	      gameContainer.requestFullscreen();
	  } else if (gameContainer.mozRequestFullScreen) { /* Firefox */
	      gameContainer.mozRequestFullScreen();
	  } else if (gameContainer.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
	      gameContainer.webkitRequestFullscreen();
	  } else if (gameContainer.msRequestFullscreen) { /* IE/Edge */
	      gameContainer.msRequestFullscreen();
	  }
  });

  // How-to-button
  $('#how-to-button').click(function() {
    swal("Game instructions", "ColorPop! is a colorful puzzle game. Click on groups of three or more connected dots of the same color to remove them and earn points. The more dots you remove in one click, the higher your score. \n\n Clear all the dots to advance to the next round with your score intact. If no more valid moves are left, the game is over, and you can save your score. Aim to beat your high score and enjoy the challenge!");
  });

  // Reset leaderboard button click
  $('#reset-button').click(function() {
    swal({
      title: "Reset leaderboard?",
      text: "Do you really want to reset the leaderboard?",
      buttons: true,
    })
    .then((willReset) => {
      if (willReset) {
        localStorage.removeItem("cp-highScores");
      	location.reload();
      }
    });
  });

  // Credits button
  $('#credits-button').click(function() {
    swal("Credits © " + currentYear, "This game is created by Kim Andersson.\n\nSpecial thanks to Annie for contributing with game ideas.");
  });

  //Disable right click
	document.addEventListener("contextmenu", function (e) {
		e.preventDefault();
	}, false);
});
