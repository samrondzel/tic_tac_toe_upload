import React, {useEffect, useState} from "react";
import logo from './logo.svg';
import './App.css';
import {io} from "socket.io-client";
import {Routes, Route, useNavigate} from "react-router-dom";

import JoinGame from "./components/JoinGame";
import GameField from "./components/GameField";

var socket;

function App() {

  const setUpListeners = (socket) => {
    //Listening for establishing connection with server
    socket.on("connect", () => {
      console.log("Made connection");
    });

    socket.on("connect_error", (err) => {
      console.log("Didn't make connection: " + err);
    });

    //Listening for successfully joining the socket's room
    socket.on("join_room_success", (message) => {
      console.log("Successfully joined the room " + message.roomId);
      setRoomId(message.roomId);
      setIsActive(message.isActive);
      setFigure(message.figure);
    });

    //Listening to starting the game - when both players have joined
    socket.on("game_can_start", () => {
      setGameCanStart(true);
    });

    //Listening to ending the game - when any of the players has left
    socket.on("game_finished", () => {
      setGameCanStart(false);
    });

    //Listening for error while joining the socket's room
    socket.on("join_room_error", (message) => {
      alert(message.error);
    });

    //Listening for successfully leaving the socket's room
    socket.on("leave_room_success", (message) => {
      console.log(message.roomId);
      setRoomId("");
    });

    //Listening for completing the move
    socket.on("end_of_move", () => {
      setIsActive(false);
    });

    //Listening for winning the game
    socket.on("win", () => {
      alert("You have won!");
      setIsActive(true);
    });

    //Listening for losing the game
    socket.on("lose", () => {
      alert("You have lost!");
      setIsActive(false);
    });

    //Listening for draw
    socket.on("draw", ({socketId}) => {
      if(socketId === socket.id){
        setIsActive(true);
      }else{
        alert("Draw!");
        setIsActive(false);
      }
    });

    //Listening for cleaning the board after the game is finished
    socket.on("erase_board", () => {
      cleanBoard();
    });

    //Listening for starting the move
    socket.on("start_of_move", (opponentsMove) => {
      let opponentsFigure = opponentsMove.figure;
      let opponentsPosition = opponentsMove.position;
      let currentBoardState = opponentsMove.currentBoardState;
      const tempGameState = currentBoardState.map((boardCell, i) => {
        return i === opponentsPosition ? opponentsFigure : boardCell;
      });
      setGameState(tempGameState);
      setIsActive(true);
    });
  }

  function drawFigure(figure, index){
    let abortDrawing = false;
    let nextPosition;
    const tempGameState = gameState.map((boardCell, i) => {
      if(i === index){
        if(boardCell === ""){
          nextPosition = i;
          return figure;
        }else{
          alert("Can't reassign a cell");
          abortDrawing = true;
          return boardCell;
        }
      }else{
        return boardCell;
      }
    });
    if(!abortDrawing){
      let winner = evaluateBoard(tempGameState);
      socket.emit("new_move", {figure: figure, position: nextPosition, gameBoard: tempGameState});
      if(winner !== ":D"){
        if(winner === figure){
          alert("You have won!");
          setIsActive(true);
        }else if(winner === "draw"){
          alert("Draw!");
          setIsActive(true);
        }else{
          alert("You have lost!");
          setIsActive(false);
        }
        socket.emit("winner", {winner: winner, figure: figure});
      }
      setGameState(tempGameState);
    }
  }

  function cleanBoard(){
    let arr = new Array(9);
    for(let i = 0; i < arr.length; i++){
      arr[i] = "";
    }
    setGameState(arr);
  }

  function leaveGame(){
    cleanBoard();
    socket.emit("leave_game", {roomId: roomId});
    setRoomId("");
  }

  function evaluateBoard(board){
    //Evaluate to get the winner
    let winningRules = [
      [0,1,2],
      [0,3,6],
      [6,7,8],
      [2,5,8],
      [0,4,8],
      [1,4,7],
      [2,4,6]
    ];

    let winner = ":D";

    for(let i = 0; i < winningRules.length; i++){
      let rule = winningRules[i];
      if(board[rule[0]] !== "" && board[rule[0]] === board[rule[1]] && winner === ":D"){
        if(board[rule[0]] === board[rule[2]]){
          return board[rule[0]];
        }
      }
    }

    let hasFreeSpace = false;
    for(let i = 0; i < board.length; i++){
      if(board[i] === ""){
        hasFreeSpace = true;
      }
    }

    if(!hasFreeSpace){
      return "draw";
    }

    return winner;
  }

  let navigate = useNavigate();
  const [gameId, setGameId] = useState("");
  const [roomId, setRoomId] = useState("");

  let arr = new Array(9);
  for(let i = 0; i < arr.length; i++){
    arr[i] = "";
  }
  const [gameState, setGameState] = useState(arr);

  const [isActive, setIsActive] = useState(false);
  const [gameCanStart, setGameCanStart] = useState(false);
  const [figure, setFigure] = useState("");

  const connect = () => {
    socket = io("http://localhost:9004");
    setUpListeners(socket);
  }

  useEffect(() => {
    connect();
  }, []);

  const submitForm = (e) => {
    e.preventDefault();
    if(gameId !== ""){
      if(socket){
        socket.emit("join_game", {"roomId": gameId});
      }
      setRoomId(gameId);
      navigate("/game/" + gameId);
      setGameId("");
    }else{
      alert("Enter the id of the room");
    }
  }

  const changeGameId = (e) => {
    setGameId(e.target.value);
  }

  return (
    <>
      <Routes>
        <Route path = "/" element = {<JoinGame gameId = {gameId} functions = {{submitForm, changeGameId}}/>}/>
        <Route path = "/game/:gameId" element = {<GameField figure = {figure} isActive = {isActive}
                                                            gameState = {gameState} roomId = {roomId}
                                                            gameCanStart = {gameCanStart}
                                                            functions = {{drawFigure, cleanBoard, leaveGame}}/>}/>
      </Routes>

    </>
  );
}

export default App;
