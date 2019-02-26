// init the game in the specified html div container
function InitMemoryGame(htmlDivContainer) {

    // create status bar, control and game container
    (function createGameComponent() {
        loadGameCss();

        htmlDivContainer.innerHTML = `
            <div id="content-container-lw">
                <div id="status-bar-lw">
                    <b class="game-status-lw">Scores: <span id="user-score-lw"></span></b>
                    <b class="game-status-lw">Remaining tiles: <span id="remaining-tiles-lw"></span></b>
                </div>
                <div id="game-container-lw"></div>
            </div>
        `;
    })();

    // load memory-game.css at the same folder as this js file
    function loadGameCss() {
        let scripts = document.getElementsByTagName('script');
        let path;
        // find the location of this script
        for (let i = 0; i < scripts.length; ++i) {
            const src = scripts[i].src;
            const lastSlash = src.lastIndexOf('/');
            if (src.substring(lastSlash+1) === 'memory-game.js'){
                path = src.substring(0, lastSlash+1);
                break;
            }
        }
        // css path
        let css = path + 'memory-game.css';

        // put into header
        let head = document.getElementsByTagName('head')[0];
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = css;
        head.appendChild(link);
    }

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

        const gameContainer = document.getElementById('game-container-lw');
        // remove prev tiles
        gameContainer.innerHTML = '';
        gameContainer.appendChild(tilesContainer);

        // create new tiles
        for (let y = 0; y < row; ++y) {
            let row = document.createElement('div');
            row.setAttribute('class', 'tile-rows-lw');
            tilesContainer.appendChild(row);

            for (let x = 0; x < col; ++x) {
                let tile = document.createElement('button');
                tile.setAttribute('class', 'tiles-lw');
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
            tile.classList.add('correct-tiles-lw');
            // remove it from the collection
            targetTiles.splice(targetTiles.indexOf(tile), 1);
        } else {
            wrongClick = true;
            --score;
            updateGameStatusBar();
            tile.classList.add('wrong-tiles-lw');
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
            tile.classList.add('target-tiles-lw');

            promises.push(setTimeoutPromise(() => {
                // swithc back to normal
                tile.classList.remove('target-tiles-lw');
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
                tiles.classList.add('rotatecw-lw');
            } else {
                tiles.classList.add('rotateccw-lw')
            }

            if (callback) {
                callback();
            }
        }, ms);
    }


    // reveal the correct tiles
    function revealResult() {
        targetTiles.forEach((tile) => {
            tile.classList.add('target-tiles-lw');
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