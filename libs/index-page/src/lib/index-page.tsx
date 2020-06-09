import React, { useEffect, useState } from "react";
import { Todo } from "@primitive/data";
import { Todos } from "@primitive/ui";
import Link from "next/link";

export const IndexPage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    fetch("/api/todos")
      .then((response) => response.json())
      .then(setTodos);
  }, []);

  function addTodo() {
    fetch("/api/addTodo", {
      method: "POST",
      body: "",
    })
      .then((response) => response.json())
      .then((newTodo) => {
        setTodos([...todos, newTodo]);
      });
  }

  return (
    <>
      <h1>Todos</h1>
      <Todos todos={todos} />
      <button id={"add-todo"} onClick={addTodo}>
        Add Todo
      </button>
      <Link href="/home">
        <a>Go home</a>
      </Link>
    </>
  );
};
