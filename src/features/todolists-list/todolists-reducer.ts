import {todolistsAPI, TodolistType} from 'api/todolists-api'
import {Dispatch} from 'redux'
import {appActions, RequestStatusType} from 'app/app-reducer'
import {handleServerNetworkError} from 'utils/error-utils'
import { AppThunk } from 'app/store';
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState: Array<TodolistDomainType> = []

const slice = createSlice({
    name: 'todolist',
    initialState,
    reducers: {
        removeTodolist: (state, action: PayloadAction<{id: string}>) => {
            // можно и так писать
            // state.filter(tl => tl.id != action.payload.id)
            const index = state.findIndex(t => t.id === action.payload.id)
            if (index !== -1) state.splice(index, 1)
        },
        addTodolist: (state, action: PayloadAction<{todolist: TodolistType }>) => {
            state.unshift({...action.payload.todolist, filter: 'all', entityStatus: 'idle'})
        },
        changeTodolistTitle: (state, action: PayloadAction<{id: string, title: string}>) => {
            const todolist = state.find(t => t.id === action.payload.id)
            if (todolist) {
                todolist.title = action.payload.title
            }
        },
        changeTodolistFilter: (state, action: PayloadAction<{id: string, filter: FilterValuesType}>) => {
            const todolist = state.find(t => t.id === action.payload.id)
            if (todolist) {
                todolist.filter = action.payload.filter
            }
        },
        changeTodolistEntityStatus: (state, action: PayloadAction<{id: string, entityStatus: RequestStatusType}>) => {
            const todolist = state.find(t => t.id === action.payload.id)
            if (todolist) {
                todolist.entityStatus = action.payload.entityStatus
            }
        },
        setTodolists: (state, action: PayloadAction<{todolists: TodolistType[]}>) => {
            return action.payload.todolists.map(tl => ({...tl, filter: 'all', entityStatus: 'idle'}))
        },
    },

})

export const todolistsReducer = slice.reducer
export const todolistsActions = slice.actions

// thunks
export const fetchTodolistsTC = (): AppThunk => {
    return (dispatch) => {
        dispatch(dispatch(appActions.setStatus({status: "loading"})))
        todolistsAPI.getTodolists()
            .then((res) => {
                dispatch(todolistsActions.setTodolists({todolists: res.data}))
                dispatch(appActions.setStatus({status: "succeeded"}))
            })
            .catch(error => {
                handleServerNetworkError(error, dispatch);
            })
    }
}
export const removeTodolistTC = (todolistId: string): AppThunk => {
    return (dispatch) => {
        //изменим глобальный статус приложения, чтобы вверху полоса побежала
        dispatch(dispatch(appActions.setStatus({status: "loading"})))
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(todolistsActions.changeTodolistEntityStatus({entityStatus: "loading", id: todolistId}))
        todolistsAPI.deleteTodolist(todolistId)
            .then((res) => {
                dispatch(todolistsActions.removeTodolist({id: todolistId}))
                //скажем глобально приложению, что асинхронная операция завершена
                dispatch(appActions.setStatus({status: "succeeded"}))
            })
    }
}
export const addTodolistTC = (title: string): AppThunk => {
    return (dispatch) => {
        dispatch(dispatch(appActions.setStatus({status: "loading"})))
        todolistsAPI.createTodolist(title)
            .then((res) => {
                dispatch(todolistsActions.addTodolist({todolist: res.data.data.item}))
                dispatch(appActions.setStatus({status: "succeeded"}))
            })
    }
}
export const changeTodolistTitleTC = (id: string, title: string) => {
    return (dispatch: Dispatch) => {
        todolistsAPI.updateTodolist(id, title)
            .then((res) => {
                dispatch(todolistsActions.changeTodolistTitle({title, id}))
            })
    }
}

export type FilterValuesType = 'all' | 'active' | 'completed';
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
