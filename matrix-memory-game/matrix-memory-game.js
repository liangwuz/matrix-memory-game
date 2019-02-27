// init the game in the specified html div container
function InitMatrixMemoryGame(htmlDivContainer) {

    const gameJsFileName = 'matrix-memory-game.js';
    // css
    const GoogleIconHref = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    const gameCssRelativePath = './matrix-memory-game.css';
    // sound files relative path to this file
    const SoundRelativePath = {
        correctTile: './sound/correct-tile.mp3',
        wrongTile: './sound/wrong-tile.mp3',
        lvUp: './sound/level-up.mp3',
        gameOver: './sound/sad-trombone.mp3'
    };

    // icon htmls
    const pauseIcon = `<i class="material-icons">pause</i>`;
    const resumeIcon = `<i class="material-icons">play_arrow</i>`;
    const soundIcon = `<i class="material-icons">volume_up</i>`;
    const mutedIcon = `<i class="material-icons">volume_off</i>`;
    const restartIcon = `<i class="material-icons" style="font-size:50px;">refresh</i>`;


    // get the file path path to the follder of this file
    const filePath = (function getFilePath() {
        let scripts = document.getElementsByTagName('script');
        // find the location of this script
        for (let i = 0; i < scripts.length; ++i) {
            const src = scripts[i].src;
            const lastSlash = src.lastIndexOf('/');
            if (src.substring(lastSlash+1) === gameJsFileName){
                return path = src.substring(0, lastSlash+1);
            }
        }
    })();


    // sound effects
    const Sound = {
        correctTile: null, 
        wrongTileL: null, 
        lvUp: null, 
        gameOver: null,
    };

    // create status bar, control and game container
    (function createGameComponent() {
        loadGameCss();

        htmlDivContainer.innerHTML = `
            <div id="content-container-lw">

                <div id="status-bar-lw">
                    <div id="controls-lw">
                        <button id="pause-btn-lw" class="control-btns-lw">${pauseIcon}</button>
                        <button id="mute-btn-lw" class="control-btns-lw">${soundIcon}</button>
                    </div>
                    <div class="pull-top pull-right">
                        <b class="game-status-lw">SCORE: <span id="user-score-lw">--</span></b>
                        <b class="game-status-lw">TILES: <span id="remaining-tiles-lw">--</span></b>
                    </div>
                </div>
                <div id="game-container-lw"><button id="play-btn-lw">PLAY</button></div>
            </div>
        `;


        registerControlEvents();
        loadSoundEffects();
    })();

    // load memory-game.css at the same folder as this js file
    function loadGameCss() {
        // game css path
        let css = filePath + gameCssRelativePath;
        // put into header
        let head = document.getElementsByTagName('head')[0];
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = css;
        head.appendChild(link);

        // google icon
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = GoogleIconHref;
        head.appendChild(link);
    }

    function registerControlEvents() {
        const pauseBtn = document.getElementById('pause-btn-lw');
        pauseBtn.onclick = puaseBtnClick.bind(null, pauseBtn);

        const muteBtn = document.getElementById('mute-btn-lw');
        muteBtn.onclick = muteBtnClick.bind(null, muteBtn);

        document.getElementById('play-btn-lw').onclick = () => {
            resetGameStateAndRun();
        };
    }

    function loadSoundEffects() {
        Sound.correctTile = new Audio(filePath + SoundRelativePath.correctTile);
        Sound.wrongTile = new Audio(filePath + SoundRelativePath.wrongTile);
        Sound.lvUp = new Audio(filePath + SoundRelativePath.lvUp);
        Sound.gameOver = new Audio(filePath + SoundRelativePath.gameOver);
    }

    // matrix dimension, number of tiles to be clicked and user score
    let row, col, tilesTobeClicked, prevLvScore, score;

    function resetGameStateAndRun() {
        row = 3;
        col = 3;
        tilesTobeClicked = 3;
        prevLvScore = 0;
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
        document.getElementById('user-score-lw').innerText = (score === undefined) ? '--' : score;
        document.getElementById('remaining-tiles-lw').innerText = (tilesTobeClicked === undefined) ? '--' : tilesTobeClicked - tileClicked;
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

        // prevent double click
        tile.onclick = null;
        // flip effect
        tile.classList.add('flip-transform');

        checkClickedTileIsCorrect(tile);

        if (tileClicked == tilesTobeClicked) {
            allowClick = false;
            evalCurrentLevel();
        }
    }

    // mark correct / wrong for the clicked tile
    function checkClickedTileIsCorrect(tile) {
        if (targetTiles.includes(tile)) {
            //correct tile, increase score and marked it correct
            ++score;
            updateGameStatusBar();
            tile.classList.add('correct-tiles-lw');
            playSoundEffect(Sound.correctTile);
        } else {
            wrongClick = true;
            --score;
            updateGameStatusBar();
            tile.classList.add('wrong-tiles-lw');
            playSoundEffect(Sound.wrongTile);
        }
    }

    // end the current level, reveal answer and adjust difficulty
    function evalCurrentLevel() {
        // reveal result before change difficulty
        revealResult();

        setTimeout(() => {
            if (score <= 0) {
                // game over
                gameOver();
            } else {
                // only all btn correct will increase difficulty
                if (wrongClick) {
                    decreaseDifficulty();
                } else {
                    increaseDifficulty();
                }
                prevLvScore = score;
                runGameLogic();
            }
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

    function gameOver() {
        playSoundEffect(Sound.gameOver);

        const gameOverText = document.createElement('h1');
        gameOverText.setAttribute('id', 'game-over-text-lw');
        gameOverText.innerText = 'Game Over';

        const restartBtn = document.createElement('button');
        restartBtn.setAttribute('id', 'restart-btn-lw');
        restartBtn.innerHTML = restartIcon;
        restartBtn.onclick = resetGameStateAndRun;

        const gameContainer =  document.getElementById('game-container-lw');
        gameContainer.innerHTML = '';
        gameContainer.appendChild(gameOverText);
        gameContainer.appendChild(restartBtn);
    }

    // add one dimension and 1 target tile
    function increaseDifficulty() {
        playSoundEffect(Sound.lvUp);

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


    let gameIsPaused = false;

    function pauseGame() {
        // clear clicked tiles score
        score = prevLvScore;
        updateGameStatusBar();
        
        gameIsPaused = true;

        createHightlightResumeBtn();
    }

    function createHightlightResumeBtn() {
        const resumeBtn = document.createElement('button');
        resumeBtn.innerText = 'Resume';
        resumeBtn.setAttribute('id', 'resume-btn-lw');
        resumeBtn.onclick = () => {
            document.getElementById('pause-btn-lw').click();
        };

        const gameContainer = document.getElementById('game-container-lw');
        gameContainer.innerHTML = '';
        gameContainer.appendChild(resumeBtn);
    }

    // rerun the current level when resume
    function resumeGame() {
        if (gameIsPaused) {
            gameIsPaused = false;

            // game is not started
            if (isNaN(tilesTobeClicked)) {
                resetGameStateAndRun();
            } else{
                runGameLogic();
            }
        }
    }

    function puaseBtnClick(btn) {
        if (btn.innerHTML === pauseIcon) {
            pauseGame();
            btn.innerHTML = resumeIcon;
        } else {
            resumeGame();
            btn.innerHTML = pauseIcon;
        }
    }


    let allowSound = true;

    function muteGame() {
        allowSound = false;
    }

    function unmuteGame() {
        allowSound = true;
    }

    function muteBtnClick(btn) {
        if (btn.innerHTML === soundIcon) {
            btn.innerHTML = mutedIcon;
            muteGame();
        } else {
            btn.innerHTML = soundIcon;
            unmuteGame();
        }
    }

    function playSoundEffect(sound) {
        if (allowSound) {
            sound.currentTime = 0;
            sound.play();
        }
    }

    return {
        // start: () => {
        //     resetGameStateAndRun();
        // },
        restart: () => {
            resetGameStateAndRun();
        },
        pause: pauseGame,
        resume: resumeGame,
        mute: muteGame,
        unmute: unmuteGame,
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
