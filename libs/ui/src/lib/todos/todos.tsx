import React from "react";
import { Todo } from "@primitive/data";

export interface TodosProps {
  todos: Todo[];
}

export const Todos = (props: TodosProps) => {
  return (
    <ul>
      {props.todos.map((todo) => {
        return (
          <li key={todo.title} data-test="todo">
            {todo.title}
          </li>
        );
      })}
    </ul>
  );
};

export default Todos;
