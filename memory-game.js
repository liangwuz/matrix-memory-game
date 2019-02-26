// init the game in the specified html div container
function InitMemoryGame(htmlDivContainer) {
    const STYLES = {
        contentContainer: `
            margin-top: 10px;
            margin-bottm: 10px;
            background-color:#855439;
        `,
        statusBar: `
            margin-top: 5px;
            margin-bottom: 5px;
        `,
        // gameStatus: `
        //     border: 1px, solid black;
        //     background: rgb(95, 29, 20);
        //     color: white;
        //     margin-top: 20px;
        //     margin-bottom: 75px;
        //     text-align: center;
        // `,
        gameContainer: `
            height: 430px;
            background-color: red;
        `,
        // tilesContainer: `
        //     width: 400px;
        //     margin: 0 auto;
        //     text-align: center;
        //     background-color: green;
        // `,
        tileRows: `
            width: 400px;
            margin: 0 auto;
            text-align: center;
            background-color: blue;
        `,
        tiles: `
            background-color:#3b2814; 
            width:50px; 
            height:50px;
        `,
        targetTiles: `
            background-color: rgb(23, 138, 138);
            width:50px; 
            height:50px;
        `,
        correctTiles: `
            background-color: lightgreen;
            width:50px; 
            height:50px;
        `,
        wrongTiles: `
            background-color: red;
            width:50px; 
            height:50px;
        `,
        rotatecw: `
            -webkit-transition: -webkit-transform .5s linear;
            -webkit-transform: rotate(90deg);
        `,
        rotateccw: `
            -webkit-transition: -webkit-transform .5s linear;
            -webkit-transform: rotate(-90deg);
        `
    };

    // create status bar, control and game container
    (function createGameComponent() {
        htmlDivContainer.innerHTML = `
            <div id="content-container-lw" style="${STYLES.contentContainer}">
                <div id="status-bar-lw" style="${STYLES.statusBar}">
                    <b style="${STYLES.gameStatus}">Scores: <span id="user-score-lw"></span></b>
                    <b style="${STYLES.gameStatus}">Remaining tiles: <span id="remaining-tiles-lw"></span></b>
                </div>
                <div id="game-container-lw" style="${STYLES.gameContainer}"></div>
            </div>
        `;
    })();

    // matrix dimension, number of tiles to be clicked and user score
    let row, col, tilesTobeClicked, score;

    function resetGameStateAndRun() {
        row = 3;
        col = 3;
        tilesTobeClicked = 3;
        score = 0;

        runGameLogic();
    }

    function runGameLogic() {
        cleanUpPrevLevelState();
        updateGameStatusBar();
        createNewTiles();
        pickRandomCorrectTiles();
        flashTargetTiles(1500, 
                rotateTiles.bind(null, 500, () => {
                    allowClick = true;
                })
            );
    }

    // at the current level, the # of tile has been clicked, any wrong tiles and the tiles are ready for clicked
    let tileClicked = 0, wrongClick = false, allowClick = false;
    // tiles of the current level
    const allTiles = [], targetTiles = [];

    // cleanup tiles and interact state
    function cleanUpPrevLevelState() {
        tileClicked = 0;
        wrongClick = false;
        allowClick = false;
        allTiles.length = 0;
        targetTiles.length = 0;
    }

    function updateGameStatusBar() {
        document.getElementById('user-score-lw').innerText = score;
        document.getElementById('remaining-tiles-lw').innerText = tilesTobeClicked - tileClicked;
    }

    // create tiles match the current level
    function createNewTiles() {
        // div used for rotation 
        const tilesContainer = document.createElement('div');
        tilesContainer.setAttribute('id', 'tiles-container-lw');
        // tilesContainer.setAttribute('style', STYLES.tilesContainer);

        const gameContainer = document.getElementById('game-container-lw');
        // remove prev tiles
        gameContainer.innerHTML = '';
        gameContainer.appendChild(tilesContainer);

        // create new tiles
        for (let y = 0; y < row; ++y) {
            let row = document.createElement('div');
            row.setAttribute('class', 'tile-rows-lw');
            row.setAttribute('style', STYLES.tileRows);
            tilesContainer.appendChild(row);

            for (let x = 0; x < col; ++x) {
                let tile = document.createElement('button');
                tile.setAttribute('class', 'tiles-lw');
                tile.setAttribute('style', STYLES.tiles);
                tile.onclick = () => { tileClick(tile) }
                row.appendChild(tile)
                allTiles.push(tile)
            }
        }
    }

    // check if clicked tile is correct
    function tileClick(tile) {
        if (!allowClick) {
            return;
        }
        
        ++tileClicked;
        checkClickedTileIsCorrect(tile);

        if (tileClicked == tilesTobeClicked) {
            allowClick = false;
            evalCurrentLevel();
        }
    }

    // mark correct / wrong for the clicked tile
    function checkClickedTileIsCorrect(tile) {
        // prevent double click
        tile.onclick = null;

        if (targetTiles.includes(tile)) {
            //correct tile, increase score and marked it correct
            ++score;
            updateGameStatusBar();
            tile.style = STYLES.correctTiles;
            // remove it from the collection
            targetTiles.splice(targetTiles.indexOf(tile), 1);
        } else {
            wrongClick = true;
            --score;
            updateGameStatusBar();
            tile.style = STYLES.wrongTiles;
        }
    }

    // end the current level, reveal answer and adjust difficulty
    function evalCurrentLevel() {
        // reveal result before change difficulty
        revealResult();

        setTimeout(() => {
            // only all btn correct will increase difficulty
            if (wrongClick) {
                decreaseDifficulty();
            } else {
                increaseDifficulty();
            }
            runGameLogic();
        }, 850);
    }

    // randomly select target tiles 
    function pickRandomCorrectTiles() {
        while (targetTiles.length < tilesTobeClicked) {
            let rd = Math.floor(Math.random() * allTiles.length)
            if (!targetTiles.includes(allTiles[rd]))
                targetTiles.push(allTiles[rd])
        }
    }

    // flash the target tile for the specified ms, then invoke the callback function
    function flashTargetTiles(ms = 1000, callback) {
        const promises = [];
        targetTiles.forEach((tile) => {
            // reveal the correct tiles
            tile.style = STYLES.targetTiles;

            promises.push(setTimeoutPromise(() => {
                // swithc back to normal
                tile.style = STYLES.tiles;
            }, ms))
        })
        if (callback) {
            Promise.all(promises)
            .then(callback)
        }
    }

    // wrap settimout with promose
    function setTimeoutPromise(func, ms) {
        return new Promise((res) => {
            setTimeout(() => {
                func();
                res();
            }, ms);
        });
    }

    // after the specified ms, rotate then invoke callback function
    function rotateTiles(ms = 500, callback) {
        const tiles = document.getElementById('tiles-container-lw');

        setTimeout(() => {
            if (Math.random() < 0.5) {
                tiles.style = STYLES.rotateccw;
            } else {
                tiles.style = STYLES.rotateccw;
            }

            if (callback) {
                callback();
            }
        }, ms);
    }


    // reveal the correct tiles
    function revealResult() {
        targetTiles.forEach((tile) => {
            tile.style = STYLES.targetTiles;
        })
    }

    // add one dimension and 1 target tile
    function increaseDifficulty() {
        // max 7*7
        if (row < 7 || col < 7) {
            if (row === col) {
                ++col;
            } else {
                ++row;
            }
            ++tilesTobeClicked;
        }
    }

    // decrease 1 dimension and 1 target tile
    function decreaseDifficulty() {
        // min 3*3
        if (row > 3 || col > 3) {
            if (row === col) {
                --row;
            } else {
                --col;
            }
            --tilesTobeClicked;
        }
    }

    return {
        start: () => {
            resetGameStateAndRun();
        },
        restart: () => {
            resetGameStateAndRun();
        },
        pause: () => {

        },
        resume: () => {

        },
        // end the game, return the score of this player
        end: () => {
            let cs = score;
            revealResult();
            allowClick = false;
            return cs;
        },
        getScore: () => {
            return score;
        }
    };
}