$(document).ready(function() {
  const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'pink'];
  const boardSize = 10;
  let points = 0;
  let currentlvl = 1;
  const gameBoard = $('#game-board');
  const pointsDisplay = $('#points-display');
  const levelDisplay = $('#level-display');
  const success = new Audio('audio/success.mp3');
  const fail = new Audio('audio/fail.mp3');
  let highScores = [];
  const currentYear = new Date().getFullYear();

  // Sound files
  const sounds = [
    new Audio('audio/pop1.mp3'),
    new Audio('audio/pop2.mp3'),
    new Audio('audio/pop3.mp3')
  ];

  // Display hi-score list
  displayHighScores();

  // Generate the board
  function generateBoard() {
    gameBoard.empty();

    let colors = [];
    if (points < 7000) {
        colors = ['red', 'green']; // Easy level
    } else if (points < 10000) {
        colors = ['red', 'green', 'blue']; // Medium level
    } else if (points < 13000) {
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

      success.play();

      swal("Great job!", "All dots cleared. Moving to next round.").then((value) => {
        currentlvl++;
        updateLevelDisplay();
        generateBoard();
			});

    } else if (noMoreValidMoves()) {
      fail.play();

      // Game over
      setTimeout(function(){
        swal({
          title: "Game over!",
          text: "No more valid moves.",
          content: {
            element: "input",
            attributes: {
              placeholder: "Enter your name:",
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
      }, 300);
    }
  }

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
  function playPopSound() {
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    randomSound.play();
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
