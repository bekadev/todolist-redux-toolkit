import {tasksReducer} from 'features/todolists-list/tasks-reducer';
import {todolistsReducer} from 'features/todolists-list/todolists-reducer';
import {AnyAction, combineReducers} from 'redux'
import {ThunkAction, ThunkDispatch} from 'redux-thunk'
import {appReducer} from './app-reducer'
import {authReducer} from 'features/auth/auth-reducer'
import {configureStore} from "@reduxjs/toolkit";

const rootReducer = combineReducers({
    tasks: tasksReducer,
    todolists: todolistsReducer,
    app: appReducer,
    auth: authReducer
})

export const store = configureStore({
    reducer: rootReducer,
})


// непосредственно создаём store
// определить автоматически тип всего объекта состояния
export type AppRootStateType = ReturnType<typeof rootReducer>

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppRootStateType, unknown, AnyAction>

// export type AppDispatch = typeof store.dispatch
export type AppDispatch = ThunkDispatch<AppRootStateType, unknown, AnyAction>


// а это, чтобы можно было в консоли браузера обращаться к store в любой момент
// @ts-ignore
window.store = store;
