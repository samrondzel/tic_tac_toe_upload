import React, {useState} from "react";

import {useParams, Link} from "react-router-dom";

export default function GameField({gameState, isActive, figure, roomId, gameCanStart, functions: {drawFigure, leaveGame}}){

  let params = useParams();
  let gameId = params.gameId;
  console.log(gameState)
  return (
    <>
      <div id = "gameFieldLinks">
        <Link to = "/" onClick = {leaveGame}>Leave game</Link>
      </div>
      {
        !gameCanStart &&
        <h4>Waiting for the second player to join</h4>
      }

      {
        gameCanStart &&
        <h4>{isActive ? "Your turn: " : "Opponent's turn: "}</h4>
      }


      <div id = "gameBoardContainer">
        <div id = "gameBoard">
          {gameState.map((boardCell, i) => {
            return (

                <div key = {i} onClick = {isActive && gameCanStart ? () => drawFigure(figure, i) : function(){}}>
                  {boardCell !== "" ? boardCell : ""}
                </div>

            )
          })}
        </div>
      </div>
    </>
  )
}
