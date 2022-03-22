import React from "react";

export default function JoinGame({gameId, functions: {submitForm, changeGameId}}){
  return (
    <>
      <div className="App">
        <h4>Welcome to tic tac toe game</h4>

        <form onSubmit = {submitForm}>
          <input type = "text" placeholder="Input game id" value = {gameId} onChange = {(e) => changeGameId(e)}/>
          <button type = "submit">Submit</button>
        </form>
      </div>
    </>
  )
}
