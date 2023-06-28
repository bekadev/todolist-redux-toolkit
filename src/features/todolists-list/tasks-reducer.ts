import {ResultCode, TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from 'api/todolists-api'
import {Dispatch} from 'redux'
import {appActions} from "app/app-reducer";
import {todolistsActions} from "features/todolists-list/todolists-reducer";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {createAppAsyncThunk} from "utils/create-app-async-thunk";
import {handleServerAppError} from "utils/handle.server.app.error";
import {handleServerNetworkError} from "utils/handle.server.network.error";



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
        if (res.data.resultCode === ResultCode.Success) {
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

export interface updateTaskType {taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string }

const updateTask = createAppAsyncThunk<updateTaskType, updateTaskType>
('tasks/updateTask', async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue, getState} = thunkAPI
    try {
        dispatch(dispatch(appActions.setStatus({status: "loading"})))
        const state = getState()
        const task = state.tasks[arg.todolistId].find(t => t.id === arg.taskId)
        if (!task) {
            dispatch(appActions.setError({error: 'task not found in the state'}))
            return rejectWithValue(null)
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...arg.domainModel
        }
        const  res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel)
                if (res.data.resultCode === ResultCode.Success) {
                    dispatch(appActions.setStatus({status: "succeeded"}))
                    return arg
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
    },
    extraReducers: builder => {
        builder
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state[action.payload.todolistId] = action.payload.tasks
            })
            .addCase(addTask.fulfilled, (state, action) => {
                state[action.payload.task.todoListId].unshift(action.payload.task)
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex(t => t.id === action.payload.taskId)
                if (index !== -1) {
                    tasks[index] = {...tasks[index], ...action.payload.domainModel}
                }
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
export const tasksThunk = {fetchTasks, addTask, updateTask}

// thunks

export const removeTaskTC = (taskId: string, todolistId: string) => (dispatch: Dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId)
        .then(res => {
            const action = tasksActions.removeTask({taskId, todolistId})
            dispatch(action)
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