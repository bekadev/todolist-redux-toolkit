import {Dispatch} from 'redux'
import {authAPI} from 'api/todolists-api'
import {authActions} from "features/Login/auth-reducer";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
    status: 'idle' as RequestStatusType,
    error: null as string | null,
    isInitialized: false
}

export type InitialStateType = typeof initialState


const slice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setStatus: (state, action: PayloadAction<{status: RequestStatusType}>) => {
            state.status = action.payload.status
        },
        setError: (state, action: PayloadAction<{error: null | string}>) => {
            state.error = action.payload.error
        },
        setIsInitialized: (state, action: PayloadAction<{value: boolean}>) => {
            state.isInitialized = action.payload.value
        },
    }
})

export const appReducer = slice.reducer
export const appActions = slice.actions

export type RequestStatusType = 'idle' | 'loading' | 'succeeded' | 'failed'

export const initializeAppTC = () => (dispatch: Dispatch) => {
    authAPI.me().then(res => {
        if (res.data.resultCode === 0) {
            dispatch(authActions.setIsLoggedIn({isLoggedIn: true}));
        } else {

        }

        dispatch(appActions.setIsInitialized({value: true}));
    })
}
