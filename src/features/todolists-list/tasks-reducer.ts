import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from 'api/todolists-api'
import {Dispatch} from 'redux'
import {AppRootStateType, AppThunk} from 'app/store'
import {handleServerAppError, handleServerNetworkError} from 'utils/error-utils'
import {appActions} from "app/app-reducer";
import {todolistsActions} from "features/todolists-list/todolists-reducer";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {createAppAsyncThunk} from "utils/create-app-async-thunk";



const fetchTasks = createAppAsyncThunk<{tasks: TaskType[], todolistId: string}, string>
    ('tasks/fetchTasks', async (todolistId, thunkAPI)  => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(dispatch(appActions.setStatus({status: "loading"})))
        const res = await todolistsAPI.getTasks(todolistId)
        const tasks = res.data.items
        dispatch(appActions.setStatus({status: "succeeded"}))
        return {tasks, todolistId}
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})

export interface addTasksType { title: string, todolistId: string }

const addTask = createAppAsyncThunk<{task: TaskType}, addTasksType>
('tasks/addTask', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(dispatch(appActions.setStatus({status: "loading"})))
        const res = await todolistsAPI.createTask(arg)
        if (res.data.resultCode === 0) {
            const task = res.data.data.item
            dispatch(appActions.setStatus({status: "succeeded"}))
            return {task}
        } else {
            handleServerAppError(res.data, dispatch);
            return rejectWithValue(null)
        }
    } catch (e) {
        handleServerNetworkError(e, dispatch)
        return rejectWithValue(null)
    }
})


const initialState: TasksStateType = {}

const slice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        removeTask: (state, action: PayloadAction<{taskId: string, todolistId: string}>) => {
            const tasks = state[action.payload.todolistId]

            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index !== -1) tasks.splice(index, 1)
        },
        updateTask: (state, action: PayloadAction<{taskId: string, model: UpdateDomainTaskModelType, todolistId: string}>) => {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t => t.id === action.payload.taskId)
            if (index !== -1) {
                tasks[index] = {...tasks[index], ...action.payload.model}
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state[action.payload.todolistId] = action.payload.tasks
            })
            .addCase(addTask.fulfilled, (state, action) => {
                state[action.payload.task.todoListId].unshift(action.payload.task)
            })
            .addCase(todolistsActions.addTodolist, (state, action) => {
                state[action.payload.todolist.id] = []
            })
            .addCase(todolistsActions.removeTodolist, (state, action) => {
                delete state[action.payload.id]
            })
            .addCase(todolistsActions.setTodolists, (state, action) => {
                action.payload.todolists.forEach(tl => {
                    state[tl.id] = []
                })
            })
    }
})

export const tasksReducer = slice.reducer
export const tasksActions = slice.actions
export const tasksThunk = {fetchTasks, addTask}

// thunks

export const removeTaskTC = (taskId: string, todolistId: string) => (dispatch: Dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId)
        .then(res => {
            const action = tasksActions.removeTask({taskId, todolistId})
            dispatch(action)
        })
}

export const updateTaskTC = (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string): AppThunk =>
    (dispatch, getState: () => AppRootStateType) => {
        const state = getState()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn('task not found in the state')
            return
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...domainModel
        }

        todolistsAPI.updateTask(todolistId, taskId, apiModel)
            .then(res => {
                if (res.data.resultCode === 0) {
                    const action = tasksActions.updateTask({taskId, todolistId, model: domainModel})
                    dispatch(action)
                } else {
                    handleServerAppError(res.data, dispatch);
                }
            })
            .catch((error) => {
                handleServerNetworkError(error, dispatch);
            })
    }

// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}