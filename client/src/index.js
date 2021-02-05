import {TableState, Player, GameState}  from './table-state';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/resizable';
import createjs from 'createjs';
import './css/loadfonts.css';
import './css/stylesheet.css'
import './css/card.css'
import io from 'socket.io-client';
import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import Table from "./components/table";
// File imports for webpack
import ActionSound from './audio/action.ogg';
import CardPlaceSound from './audio/cardPlace1.wav';
import DealSound from './audio/deal.wav';
import FlopSound from './audio/flop.wav';
import TurnSound from './audio/turn.wav';
// Action sounds
import FoldSound from "./audio/fold1.wav";
import CheckSound from "./audio/check.wav";
import ChipsStackSound from "./audio/chipsStack4.wav";
import TableImage from "./components/tableImage";
import BelowTable from "./components/belowTable";
import {TableStateManager} from "./table-state-manager";
import Header from "./components/header";
import ReplaySubContainer from "./components/replay";
import {transformTable, transformTableState} from "./funcs";

let socket = io('/' + SESSION_ID);
socket.on('connect', () => {
    socket.emit('authenticate', { token: localStorage.getItem('token') });
    socket.on('authenticated', () => {
        console.log('authenticated');
    });
    socket.on('unauthorized', (msg) => {
        console.log(`unauthorized: ${JSON.stringify(msg.data)}`);
        throw new Error(msg.data.type);
    });
});
//resize page (to fit)

var $el = $("#page-contents");
var elHeight = $el.outerHeight();
var elWidth = $el.outerWidth();

var $wrapper = $("#scaleable-wrapper");

$wrapper.resizable({
  resize: doResize
});

function doResize(event, ui) {
  
  var scale, origin;
    
  scale = Math.min(
    ui.size.width / elWidth,    
    ui.size.height / elHeight
  );
  
  $el.css({
    transform: "translate(-50%, -50%) " + "scale(" + scale + ")"
  });
  
}

var starterData = { 
  size: {
    width: $wrapper.width(),
    height: $wrapper.height()
  }
};
doResize(null, starterData);

$('input[name=singleStraddleBox]').change(function () {
    if ($(this).is(':checked')) {
        console.log('player elects to straddle utg');
        socket.emit('straddle-switch', {
            isStraddling: true,
            straddletype: 1
        });
    } else {
        console.log('player elects to stop straddling utg');
        socket.emit('straddle-switch', {
            isStraddling: false,
            straddletype: 0
        });
    }
});

$('input[name=multiStraddleBox]').change(function () {
    if ($(this).is(':checked')) {
        console.log('player elects to start multi straddling');
        socket.emit('straddle-switch', {
            isStraddling: true,
            straddletype: -1
        });
    } else {
        console.log('player elects to stop multi straddling');
        socket.emit('straddle-switch', {
            isStraddling: false,
            straddletype: 0
        });
    }
});

function isVolumeOn() {
    let volumeIcons = document.getElementsByClassName('volume');
    // volumeIcons is falsy if the volume Icon has not rendered yet (only true before initial render)
    if (volumeIcons.length < 1) return true;
    // volumeIcons should always be of length 1.
    return volumeIcons[0].matches('.on');
}

// function playSoundIfVolumeOn(soundName) {
//     if (isVolumeOn()){
//         createjs.Sound.play(soundName);
//     }
// }

//Listen for events--------------------------------------------------------------------------------

const setTurnTimer = (delay) => {
    socket.emit('set-turn-timer', {delay: delay});
};

socket.on('player-disconnect', (data) => {
    console.log(`${data.playerName} disconnected`)
    // TODO: do something that makes it clear that the player is offline, such as making
    //  their cards gray or putting the word "offline" next to their name
});

socket.on('player-reconnect', (data) => {
    console.log(`${data.playerName} reconnected`);
    // TODO: undo the effects of the player-disconnect event listener
});

let tableState = {};
let messageCache = [];
let feedbackText = '';
// let handEndLog = [];
// socket.emit('get-hand-end-log');
// socket.on('get-hand-end-log', (data) => {
//     console.log(data);
//     handEndLog = data.handEndLog;
//     renderBelowTable();
// });
function setState(data) {
    // let newTable = transformTable(data.table);
    // if there was a game and there is no longer a game (b/c we are waiting) or if we are now pre-flop
    // let isEndOfHand = tableState.table && tableState.table.game && (!newTable.game || newTable.game.board.length < tableState.table.game.board.length);
    // if (isEndOfHand) {
    //     handEndLog.push({time: Date.now(), finalState: tableState});
    // }
    tableState = transformTableState(data);

    renderBetsAndFields();
    renderBelowTable();
    renderHeader();

    if (tableState.gameInProgress && tableState.player) {
        renderStraddleOptions(true);
    } else {
        renderStraddleOptions(false);
    }
}

socket.on('state-snapshot', setState);

//incoming chat
socket.on('chat', (data) => {
    let date = new Date();
    let minutes = (date.getMinutes() < 10) ? `0${date.getMinutes()}` : `${date.getMinutes()}`;
    let time = `${date.getHours()}:${minutes} ~ `;
    outputMessage(<span><span className='info'>{time}{data.handle}</span> {data.message}</span>);
});

//somebody is typing
socket.on('typing', (data) => {
    feedbackText = data + ' is writing a message...';
    // $("#chat-window").scrollTop($("#chat-window")[0].scrollHeight);
});

// data is {seat, time}
// time is milliseconds until the player's turn expires and they are forced to fold.
// seat is not necessarily the next action seat, as the timer could have been refreshed.
// in all other cases, seat should be the action seat.
// if time <= 0, remove the timer.
socket.on('render-timer', (data) => {
    // Clear existing turn timers
    // $('.name').removeClass('turn-timer');
    // Set new timer for data.playerName
    if (data.time > 0) {
        // TODO: implement front end graphics for turn timer
        // $(`#${data.seat} > .name`).addClass('turn-timer');
    } else {
        // TODO: remove graphics for turn timer
        // no longer display the timer
    }
});

//2021-02-05
socket.on('alert', function(data) {
    alert(data.message);
});

socket.on('sv_refresh', function() {
    alert('sv_refresh');
    document.location.reload();
});


function outputMessage(s) {
    feedbackText = '';
    messageCache.push({text:s, em: false});
    renderBelowTable();
}

socket.on('alert', function(data) {
    alert(data.message);
});

//helper functions--------------------------------------------------------------------------------
const loadSounds = () => {
    createjs.Sound.registerSound('/client/dist/' + DealSound, 'deal');
    createjs.Sound.registerSound('/client/dist/' + FlopSound, 'flop');
    createjs.Sound.registerSound('/client/dist/' + TurnSound, 'turn');
    createjs.Sound.registerSound('/client/dist/' + CardPlaceSound, 'river');
    createjs.Sound.registerSound('/client/dist/' + ActionSound, 'action');
    // action sounds 
    createjs.Sound.registerSound('/client/dist/' + FoldSound, 'fold');
    createjs.Sound.registerSound('/client/dist/' + CheckSound, 'check');
    createjs.Sound.registerSound('/client/dist/' + ChipsStackSound, 'bet');
    createjs.Sound.volume = 0.25;
};
loadSounds();

const cleanInput = (input) => {
    return $('<div/>').text(input).html();
};

ReactDOM.render((
    <React.StrictMode>
        <ReplaySubContainer socket={socket}/>
    </React.StrictMode>
), document.getElementById('replay-root'));
ReactDOM.render((
    <React.StrictMode>
        <TableImage>
            <div id="ovalparent">
            </div>
        </TableImage>
    </React.StrictMode>
), document.getElementById('table-img-root'));

function renderBetsAndFields() {
    // const ovalParent = $('#ovalparent');
    ReactDOM.render((
        <React.StrictMode>
            <Table volumeOn={isVolumeOn()}
                   id="table"
                   raceInProgress={tableState.raceInProgress}
                   raceSchedule={tableState.raceSchedule}
                   manager={tableState.manager}
                   betWidth={60}
                   betHeight={35}
                   tableWidth={$('#ovalparent').width()}
                   tableHeight={Math.floor($('#ovalparent').width()/2)}/>
        </React.StrictMode>
    ), document.getElementById('ovalparent'));
}
function renderHeader() {
    ReactDOM.render((
        <React.StrictMode>
            <Header loggedIn={tableState.player && !tableState.player.leavingGame}
                    socket={socket}
                    table={tableState.table}
                    player={tableState.player} />
        </React.StrictMode>
    ), document.getElementById('header-root'));
}
function renderBelowTable() {
    ReactDOM.render((
        <React.StrictMode>
            <BelowTable socket={socket}
                        messages={messageCache}
                        feedbackText={feedbackText}
                        player={tableState.player}
                        manager={tableState.manager}
                        // handEndLog={handEndLog}
                        volumeOn={isVolumeOn()}/>
        </React.StrictMode>
    ), document.getElementById('below-table-root'));
}
$(window).resize(function () {
    // createHands();
    if (tableState.table) renderBetsAndFields();
    // renderBelowTable();
    // distributeHands(false);
    // distributeBets();
    let resizeData = {
        size: {
            width: $wrapper.width(),
            height: $wrapper.height()
        }
    };
    doResize(null, resizeData);
});

const renderStraddleOptions = (canRender) => {
    // console.log('tableState', tableState);
    if (canRender){
        if (tableState.table.straddleLimit == 1){
            $('.single-straddle').removeClass('collapse');
            $('.multi-straddle').addClass('collapse');
            if (tableState.player.isStraddling){
                $('input[name=singleStraddleBox]').prop("checked", true);
            }
        }
        else if (tableState.table.straddleLimit == -1){
            $('.single-straddle').removeClass('collapse');
            $('.multi-straddle').removeClass('collapse');
            if (tableState.player.isStraddling) {
                $('input[name=singleStraddleBox]').prop("checked", true);
                $('input[name=multiStraddleBox]').prop("checked", true);
            }
        }
        else {
            $('.single-straddle').addClass('collapse');
            $('.multi-straddle').addClass('collapse');
        }
    } else {
        $('.single-straddle').addClass('collapse');
        $('.multi-straddle').addClass('collapse');
    }
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
