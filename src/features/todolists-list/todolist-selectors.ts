import {AppRootStateType} from "app/store";

export const selectTodoList = (state: AppRootStateType) => state.todolists
export const selectTasks = (state: AppRootStateType) => state.tasks
